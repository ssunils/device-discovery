import { spawn } from "child_process";
import path from "path";
import { pino } from "pino";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const logger = pino({
  level: process.env.LOG_LEVEL || "silent",
});

export interface MLDetectionResult {
  jid: string;
  osType: "iOS" | "Android" | "Unknown";
  confidence: number; // 0.0 - 1.0
  method: "tensorflow_ml" | "heuristic" | "unknown";
  chainCount?: number;
  error?: string;
}

/**
 * Detect the correct Python path
 * Tries to find the project's venv first, then falls back to system Python
 */
function getPythonPath(pythonEnv?: string, projectRoot?: string): string {
  if (pythonEnv) return pythonEnv;

  // Try to find venv in project root
  const root = projectRoot || process.cwd();
  const venvPath = path.join(root, ".venv", "bin", "python");

  if (existsSync(venvPath)) {
    return venvPath;
  }

  // Fall back to system Python
  try {
    const which = execSync("which python3", { encoding: "utf-8" }).trim();
    if (which) return which;
  } catch (_) {
    // ignore
  }

  return "python3"; // Last resort
}

/**
 * Call Python ML detector via subprocess
 * Uses trained TensorFlow model for OS detection with confidence scores
 */
export async function detectOSWithML(
  jid: string,
  sessionFilePath: string,
  pythonEnv?: string
): Promise<MLDetectionResult> {
  return new Promise((resolve) => {
    try {
      // Get project root from cwd or from session file path
      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, "ml", "os_detector_ml.py");

      console.log(`[ML-DETECTOR] Working directory: ${projectRoot}`);
      console.log(`[ML-DETECTOR] Script path: ${scriptPath}`);

      // Get the correct Python path
      const pythonPath = getPythonPath(pythonEnv, projectRoot);
      console.log(`[ML-DETECTOR] Python path: ${pythonPath}`);

      if (!existsSync(scriptPath)) {
        console.error(`[ML-DETECTOR] Script not found at: ${scriptPath}`);
        resolve({
          jid,
          osType: "Unknown",
          confidence: 0,
          method: "unknown",
          error: `ML script not found at ${scriptPath}`,
        });
        return;
      }

      // Spawn Python process with cwd set to project root
      const python = spawn(pythonPath, [scriptPath, jid, sessionFilePath], {
        timeout: 5000, // 5 second timeout
        cwd: projectRoot, // Set working directory to project root
      });

      logger.info(`[ML-DETECTOR] Using Python: ${pythonPath}`);
      logger.info(`[ML-DETECTOR] Script: ${scriptPath}`);
      console.log(
        `[ML-DETECTOR] Using Python: ${pythonPath} (exists: ${existsSync(
          pythonPath
        )})`
      );
      console.log(
        `[ML-DETECTOR] Script: ${scriptPath} (exists: ${existsSync(
          scriptPath
        )})`
      );
      console.log(
        `[ML-DETECTOR] JID: ${jid}, Session: ${sessionFilePath}, Working Dir: ${projectRoot}`
      );

      let output = "";
      let errorOutput = "";

      // Collect stdout
      python.stdout?.on("data", (data) => {
        output += data.toString();
      });

      // Collect stderr
      python.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      // Handle completion
      python.on("close", (code) => {
        console.log(
          `[ML-DETECTOR] Close - Code: ${code}, Output length: ${output.length}, Error: ${errorOutput}`
        );
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output.trim());

            // Validate response format
            if (result.osType && result.confidence !== undefined) {
              console.log("[ML-DETECTOR] SUCCESS - Result:", result);
              resolve({
                jid: result.jid || jid,
                osType: result.osType as "iOS" | "Android" | "Unknown",
                confidence: Number(result.confidence),
                method: "tensorflow_ml",
                chainCount: result.chainCount,
              });
            } else {
              console.log("[ML-DETECTOR] INVALID FORMAT - Result:", result);
              logger.error("[ML-DETECTOR] Invalid response format: %O", result);
              resolve({
                jid,
                osType: "Unknown",
                confidence: 0,
                method: "unknown",
                error: "Invalid ML response format",
              });
            }
          } catch (e) {
            console.log(
              "[ML-DETECTOR] JSON PARSE ERROR:",
              output,
              errorOutput,
              String(e)
            );
            logger.error(
              "[ML-DETECTOR] JSON parse error: %s %s",
              output,
              errorOutput
            );
            resolve({
              jid,
              osType: "Unknown",
              confidence: 0,
              method: "unknown",
              error: `Parse error: ${String(e)}`,
            });
          }
        } else {
          console.log(
            "[ML-DETECTOR] PYTHON ERROR - Code:",
            code,
            "Output:",
            output,
            "Error:",
            errorOutput
          );
          logger.error(
            "[ML-DETECTOR] Python error (code %s): %s",
            String(code),
            errorOutput
          );
          resolve({
            jid,
            osType: "Unknown",
            confidence: 0,
            method: "unknown",
            error: errorOutput || "Python process failed",
          });
        }
      });

      // Handle process errors
      python.on("error", (err) => {
        console.log("[ML-DETECTOR] SPAWN ERROR:", err.message);
        resolve({
          jid,
          osType: "Unknown",
          confidence: 0,
          method: "unknown",
          error: `Spawn error: ${err.message}`,
        });
      });

      // Force timeout after 5 seconds
      setTimeout(() => {
        if (!python.killed) {
          python.kill();
          resolve({
            jid,
            osType: "Unknown",
            confidence: 0,
            method: "unknown",
            error: "ML detection timeout",
          });
        }
      }, 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : "";
      console.error(`[ML-DETECTOR] Exception caught:`, errorMsg);
      console.error(`[ML-DETECTOR] Stack:`, errorStack);
      logger.error("[ML-DETECTOR] Unexpected error: %s", errorMsg);
      resolve({
        jid,
        osType: "Unknown",
        confidence: 0,
        method: "unknown",
        error: `Unexpected error: ${errorMsg}`,
      });
    }
  });
}

/*******************************************
 * Session feature extractor (used when ML fails)
 * Returns a small, interpretable feature set derived
 * from the session file so the tracker/UI can inspect
 * what signals were present without applying a binary
 * heuristic (2+ chains).
 *******************************************/
export function extractSessionFeatures(sessionFile: string): {
  sessionCount: number;
  chainCounts: number[];
  avgChains: number;
  maxChains: number;
  multiChainSessions: number;
  activeSessions: number;
  pendingPreKeyTotal: number;
} {
  try {
    const raw = readFileSync(sessionFile, { encoding: "utf-8" });
    const obj = JSON.parse(raw);

    // Support both '_sessions' (Baileys) and 'sessions' or flat-style files
    const sessionsRaw =
      (obj && typeof obj === "object" && Array.isArray(obj.sessions))
        ? obj.sessions
        : obj && typeof obj === "object" && obj._sessions && typeof obj._sessions === "object"
        ? Object.values(obj._sessions)
        : Object.values(obj).filter((v: any) => v && typeof v === "object");

    const sessions = sessionsRaw.filter((s: any) => typeof s === "object");

    const chainCounts: number[] = [];
    let activeSessions = 0;
    let pendingPreKeyTotal = 0;

    for (const sess of sessions) {
      const chains = sess?._chains || {};
      const c = typeof chains === "object" ? Object.keys(chains).length : 1;
      chainCounts.push(c);

      if (sess?.indexInfo && typeof sess.indexInfo === "object") {
        if (sess.indexInfo.closed === -1) activeSessions += 1;
        const ppk = sess.pendingPreKey || (sess.indexInfo && sess.indexInfo.preKeyId) || 0;
        if (typeof ppk === "number") pendingPreKeyTotal += ppk;
      }
    }

    const sessionCount = sessions.length;
    const maxChains = chainCounts.length ? Math.max(...chainCounts) : 0;
    const avgChains = chainCounts.length ? chainCounts.reduce((a, b) => a + b, 0) / chainCounts.length : 0;
    const multiChainSessions = chainCounts.filter((n) => n >= 2).length;

    return {
      sessionCount,
      chainCounts,
      avgChains,
      maxChains,
      multiChainSessions,
      activeSessions,
      pendingPreKeyTotal,
    };
  } catch (err) {
    return {
      sessionCount: 0,
      chainCounts: [],
      avgChains: 0,
      maxChains: 0,
      multiChainSessions: 0,
      activeSessions: 0,
      pendingPreKeyTotal: 0,
    };
  }
}
