/**
 * Device Activity Tracker - Web Server
 *
 * HTTP server with Socket.IO for real-time tracking visualization.
 * Provides REST API and WebSocket interface for the React frontend.
 *
 * For educational and research purposes only.
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { pino } from "pino";
import { Boom } from "@hapi/boom";
import { WhatsAppTracker, ProbeMethod } from "./tracker.js";
import {
  SignalTracker,
  getSignalAccounts,
  checkSignalNumber,
} from "./signal-tracker.js";
import { historyManager } from "./history-manager.js";
import { imageManager } from "./image-manager.js";

// Configuration
const SIGNAL_API_URL = process.env.SIGNAL_API_URL || "http://localhost:8080";

const app = express();
app.use(cors());

// Serve static images
app.use("/images", express.static("data/images"));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"],
  },
});

let sock: any;
let isWhatsAppConnected = false;
let isSignalConnected = false;
let signalAccountNumber: string | null = null;
let globalProbeMethod: ProbeMethod = "delete"; // Default to delete method
let currentWhatsAppQr: string | null = null; // Store current QR code for new clients

// Platform type for contacts
type Platform = "whatsapp" | "signal";

interface TrackerEntry {
  tracker: WhatsAppTracker | SignalTracker;
  platform: Platform;
}

const trackers: Map<string, TrackerEntry> = new Map(); // JID/Number -> Tracker entry

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "debug" }),
    markOnlineOnConnect: true,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", async (update: any) => {
    const {
      connection,
      lastDisconnect,
      qr,
      isOnline,
      receivedPendingNotifications,
    } = update;

    if (qr) {
      console.log("QR Code generated");
      currentWhatsAppQr = qr; // Store the QR code
      io.emit("qr", qr);
    }

    if (connection === "close") {
      isWhatsAppConnected = false;
      currentWhatsAppQr = null; // Clear QR on close

      // Extract detailed error information
      const error = lastDisconnect?.error;
      const statusCode = (error as any)?.output?.statusCode;
      const errorMessage = error?.message || "Unknown error";

      console.error("[CONNECTION] Connection closed");
      console.error("[CONNECTION] Error:", errorMessage);
      console.error("[CONNECTION] Status Code:", statusCode);
      console.error("[CONNECTION] Reason:", lastDisconnect?.reason);

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[CONNECTION] Should reconnect: ${shouldReconnect}`);

      io.emit("connection-status", {
        status: "disconnected",
        error: errorMessage,
        statusCode: statusCode,
        reason: lastDisconnect?.reason,
      });

      if (shouldReconnect) {
        console.log("[CONNECTION] Attempting to reconnect in 5 seconds...");
        setTimeout(() => {
          connectToWhatsApp();
        }, 5000);
      } else {
        console.log("[CONNECTION] Not reconnecting - user logged out");
      }
    } else if (connection === "open") {
      isWhatsAppConnected = true;
      currentWhatsAppQr = null; // Clear QR on successful connection
      console.log("✅ WhatsApp connection opened successfully");
      io.emit("connection-open");
      io.emit("connection-status", {
        status: "connected",
        error: null,
      });
    } else if (connection === "connecting") {
      console.log("[CONNECTION] Connecting to WhatsApp...");
      io.emit("connection-status", {
        status: "connecting",
        error: null,
      });
    }

    // Log other connection updates
    if (isOnline !== undefined) {
      console.log(`[CONNECTION] Online status: ${isOnline}`);
    }
    if (receivedPendingNotifications !== undefined) {
      console.log(
        `[CONNECTION] Received pending notifications: ${receivedPendingNotifications}`
      );
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Add error event handler
  sock.ev.on("error", (err: any) => {
    console.error(
      "[SOCKET ERROR] Unexpected socket error:",
      err.message || err
    );
    console.error("[SOCKET ERROR] Stack:", err.stack);
  });

  // Add WebSocket error handling
  if ((sock as any).ws) {
    (sock as any).ws.on("error", (err: any) => {
      console.error("[WEBSOCKET ERROR] WebSocket error:", err.message || err);
      console.error("[WEBSOCKET ERROR] Stack:", err.stack);
    });
  }

  sock.ev.on(
    "messaging-history.set",
    ({ chats, contacts, messages, isLatest }: any) => {
      console.log(
        `[SESSION] History sync - Chats: ${chats.length}, Contacts: ${contacts.length}, Messages: ${messages.length}, Latest: ${isLatest}`
      );
    }
  );

  sock.ev.on("messages.update", (updates: any) => {
    for (const update of updates) {
      console.log(
        `[MSG UPDATE] JID: ${update.key.remoteJid}, ID: ${update.key.id}, Status: ${update.update.status}, FromMe: ${update.key.fromMe}`
      );
    }
  });
}

connectToWhatsApp();

// Signal linking state
let signalLinkingInProgress = false;
let signalApiAvailable = false;
let currentSignalQrUrl: string | null = null;

// Check Signal API availability
async function checkSignalApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${SIGNAL_API_URL}/v1/about`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Check Signal connection status
async function checkSignalConnection() {
  try {
    const available = await checkSignalApiAvailable();
    if (available !== signalApiAvailable) {
      signalApiAvailable = available;
      console.log(`[SIGNAL] API available: ${available}`);
      io.emit("signal-api-status", { available });
    }

    if (!available) {
      if (isSignalConnected) {
        isSignalConnected = false;
        signalAccountNumber = null;
        io.emit("signal-disconnected");
      }
      return;
    }

    const accounts = await getSignalAccounts(SIGNAL_API_URL);
    if (accounts.length > 0) {
      if (!isSignalConnected) {
        isSignalConnected = true;
        signalAccountNumber = accounts[0];
        signalLinkingInProgress = false;
        console.log(`[SIGNAL] Connected with account: ${signalAccountNumber}`);
        io.emit("signal-connection-open", { number: signalAccountNumber });
      }
    } else {
      if (isSignalConnected) {
        isSignalConnected = false;
        signalAccountNumber = null;
        console.log("[SIGNAL] Disconnected");
        io.emit("signal-disconnected");
      }
      // No accounts - need to link, start QR code process
      if (!signalLinkingInProgress) {
        startSignalLinking();
      }
    }
  } catch (err) {
    console.log("[SIGNAL] Error checking connection:", err);
    if (isSignalConnected) {
      isSignalConnected = false;
      signalAccountNumber = null;
      io.emit("signal-disconnected");
    }
  }
}

// Start Signal device linking - signal-cli-rest-api returns QR as PNG image
async function startSignalLinking() {
  if (signalLinkingInProgress || isSignalConnected) return;

  signalLinkingInProgress = true;
  console.log("[SIGNAL] Starting device linking...");

  try {
    // Check if the QR endpoint is available
    const response = await fetch(
      `${SIGNAL_API_URL}/v1/qrcodelink?device_name=activity-tracker`
    );
    if (!response.ok) {
      console.log("[SIGNAL] Failed to start linking:", response.status);
      signalLinkingInProgress = false;
      return;
    }

    // signal-cli-rest-api returns the QR code as a PNG image directly
    // Send the URL to the frontend to display as an image
    currentSignalQrUrl = `${SIGNAL_API_URL}/v1/qrcodelink?device_name=activity-tracker&t=${Date.now()}`;
    console.log("[SIGNAL] Emitting QR image URL:", currentSignalQrUrl);
    io.emit("signal-qr-image", currentSignalQrUrl);

    // Keep polling to check if linking completed
    pollSignalLinkingStatus();
  } catch (err) {
    console.log("[SIGNAL] Error starting linking:", err);
    signalLinkingInProgress = false;
  }
}

// Poll to check if Signal linking has completed
async function pollSignalLinkingStatus() {
  const checkInterval = setInterval(async () => {
    try {
      const accounts = await getSignalAccounts(SIGNAL_API_URL);
      if (accounts.length > 0) {
        // Linking completed!
        clearInterval(checkInterval);
        signalLinkingInProgress = false;
        currentSignalQrUrl = null;
        isSignalConnected = true;
        signalAccountNumber = accounts[0];
        console.log(
          `[SIGNAL] Linking completed! Account: ${signalAccountNumber}`
        );
        io.emit("signal-connection-open", { number: signalAccountNumber });
      }
    } catch (err) {
      // Keep polling
    }
  }, 2000);

  // Stop polling after 5 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
    signalLinkingInProgress = false;
  }, 300000);
}

// Check Signal connection periodically
checkSignalConnection();
setInterval(checkSignalConnection, 5000);

io.on("connection", (socket) => {
  console.log("Client connected");

  // Send current WhatsApp QR code if available
  if (currentWhatsAppQr) {
    socket.emit("qr", currentWhatsAppQr);
  }

  if (isWhatsAppConnected) {
    socket.emit("connection-open");
  }

  if (isSignalConnected && signalAccountNumber) {
    socket.emit("signal-connection-open", { number: signalAccountNumber });
  }

  // Send Signal API availability status
  socket.emit("signal-api-status", { available: signalApiAvailable });

  // Send current Signal QR code if linking is in progress
  if (signalLinkingInProgress && currentSignalQrUrl) {
    socket.emit("signal-qr-image", currentSignalQrUrl);
  }

  // Send current probe method to client
  socket.emit("probe-method", globalProbeMethod);

  // Send tracked contacts with platform info
  const trackedContacts = Array.from(trackers.entries()).map(([id, entry]) => ({
    id,
    platform: entry.platform,
  }));

  // Handle request to get tracked contacts (for page refresh)
  socket.on("get-tracked-contacts", () => {
    const trackedContacts = Array.from(trackers.entries()).map(
      ([id, entry]) => ({
        id,
        platform: entry.platform,
      })
    );
    socket.emit("tracked-contacts", trackedContacts);
  });

  // Add contact - supports both WhatsApp and Signal
  socket.on(
    "add-contact",
    async (data: string | { number: string; platform: Platform }) => {
      // Support both old format (string) and new format (object)
      const { number, platform } =
        typeof data === "string"
          ? { number: data, platform: "whatsapp" as Platform }
          : data;

      console.log(`Request to track on ${platform}: ${number}`);
      const cleanNumber = number.replace(/\D/g, "");

      if (platform === "signal") {
        // Signal tracking
        if (!isSignalConnected || !signalAccountNumber) {
          socket.emit("error", {
            message: "Signal is not connected. Please link Signal first.",
          });
          return;
        }

        const signalId = `signal:${cleanNumber}`;
        if (trackers.has(signalId)) {
          socket.emit("error", {
            jid: signalId,
            message: "Already tracking this contact on Signal",
          });
          return;
        }

        try {
          const targetNumber = cleanNumber.startsWith("+")
            ? cleanNumber
            : `+${cleanNumber}`;

          // Check if number is registered and discoverable on Signal
          console.log(`[SIGNAL] Checking if ${targetNumber} is registered...`);
          const checkResult = await checkSignalNumber(
            SIGNAL_API_URL,
            signalAccountNumber,
            targetNumber
          );

          if (!checkResult.registered) {
            console.log(
              `[SIGNAL] Number ${targetNumber} is not discoverable: ${checkResult.error}`
            );
            socket.emit("error", {
              jid: signalId,
              message:
                checkResult.error || "Number is not registered on Signal",
            });
            return;
          }

          console.log(
            `[SIGNAL] Number ${targetNumber} is registered, starting tracking...`
          );

          // Log search to history
          historyManager.logEvent("search", signalId, "signal", {
            number: cleanNumber,
          });

          const tracker = new SignalTracker(
            SIGNAL_API_URL,
            signalAccountNumber,
            targetNumber
          );

          trackers.set(signalId, { tracker, platform: "signal" });

          tracker.onUpdate = (updateData) => {
            io.emit("tracker-update", {
              jid: signalId,
              platform: "signal",
              ...updateData,
            });
          };

          tracker.startTracking();

          socket.emit("contact-added", {
            jid: signalId,
            number: cleanNumber,
            platform: "signal",
          });

          io.emit("contact-name", { jid: signalId, name: cleanNumber });
        } catch (err) {
          console.error(err);
          socket.emit("error", { message: "Failed to start Signal tracking" });
        }
      } else {
        // WhatsApp tracking (original logic)
        const targetJid = cleanNumber + "@s.whatsapp.net";

        if (trackers.has(targetJid)) {
          socket.emit("error", {
            jid: targetJid,
            message: "Already tracking this contact",
          });
          return;
        }

        try {
          const results = await sock.onWhatsApp(targetJid);
          const result = results?.[0];

          if (result?.exists) {
            // Log search to history
            historyManager.logEvent(
              "search",
              result.jid,
              "whatsapp",
              {
                number: cleanNumber,
              }
              // profilePicPath will be added after image is downloaded
            );

            const tracker = new WhatsAppTracker(sock, result.jid);
            tracker.setProbeMethod(globalProbeMethod);
            trackers.set(result.jid, { tracker, platform: "whatsapp" });

            tracker.onUpdate = (updateData) => {
              io.emit("tracker-update", {
                jid: result.jid,
                platform: "whatsapp",
                ...updateData,
              });
            };

            tracker.startTracking();

            console.log(
              `[TRACKER] Tracker started for ${
                result.jid
              }, Detected OS: ${tracker.getOSType()}, Details: ${JSON.stringify(
                tracker.getOSDetails()
              )}`
            );

            const ppUrl = await tracker.getProfilePicture();

            let contactName = cleanNumber;
            try {
              const contactInfo = await sock.onWhatsApp(result.jid);
              if (contactInfo && contactInfo[0]?.notify) {
                contactName = contactInfo[0].notify;
              }
            } catch (err) {
              console.log("[NAME] Could not fetch contact name, using number");
            }

            socket.emit("contact-added", {
              jid: result.jid,
              number: cleanNumber,
              platform: "whatsapp",
            });

            // Download and save the profile picture locally
            const localImagePath = await imageManager.downloadAndSaveImage(
              ppUrl ?? null,
              result.jid
            );
            const imageUrlToSend = localImagePath || ppUrl || null;

            // Store the local image path in the tracker for history logging
            tracker.profilePicPath = localImagePath || undefined;

            io.emit("profile-pic", { jid: result.jid, url: imageUrlToSend });
            io.emit("contact-name", { jid: result.jid, name: contactName });
          } else {
            socket.emit("error", {
              jid: targetJid,
              message: "Number not on WhatsApp",
            });
          }
        } catch (err) {
          console.error(err);
          socket.emit("error", {
            jid: targetJid,
            message: "Verification failed",
          });
        }
      }
    }
  );

  socket.on("remove-contact", (jid: string) => {
    console.log(`Request to stop tracking: ${jid}`);
    const entry = trackers.get(jid);
    if (entry) {
      entry.tracker.stopTracking();
      trackers.delete(jid);
      socket.emit("contact-removed", jid);
    }
  });

  socket.on("pause-contact", (jid: string) => {
    console.log(`Request to pause tracking: ${jid}`);
    const entry = trackers.get(jid);
    if (entry) {
      entry.tracker.pauseTracking();
      socket.emit("contact-paused", jid);
    }
  });

  socket.on("resume-contact", (jid: string) => {
    console.log(`Request to resume tracking: ${jid}`);
    const entry = trackers.get(jid);
    if (entry) {
      entry.tracker.resumeTracking();
      socket.emit("contact-resumed", jid);
    }
  });

  socket.on("set-probe-method", (method: ProbeMethod) => {
    console.log(`Request to change probe method to: ${method}`);
    if (method !== "delete" && method !== "reaction") {
      socket.emit("error", { message: "Invalid probe method" });
      return;
    }

    globalProbeMethod = method;

    for (const entry of trackers.values()) {
      // Only WhatsApp trackers support the delete method
      if (entry.platform === "whatsapp") {
        (entry.tracker as WhatsAppTracker).setProbeMethod(method);
      }
      // Signal trackers always use reaction method
    }

    io.emit("probe-method", method);
    console.log(`Probe method changed to: ${method}`);
  });

  socket.on("get-history", async () => {
    const history = await historyManager.getHistory();
    socket.emit("history-data", history);
  });

  socket.on("clear-history", async () => {
    await historyManager.clearHistory();
    socket.emit("history-cleared");
  });

  socket.on("logout-whatsapp", async () => {
    console.log("Request to logout from WhatsApp");
    try {
      if (sock) {
        // Stop all active trackers
        for (const entry of trackers.values()) {
          if (entry.platform === "whatsapp") {
            entry.tracker.stopTracking();
          }
        }
        trackers.clear();

        // Logout from WhatsApp
        await sock.logout();
        isWhatsAppConnected = false;
        currentWhatsAppQr = null;

        // Notify all clients
        io.emit("whatsapp-logged-out");
        socket.emit("logout-success");

        console.log("✅ Successfully logged out from WhatsApp");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error during logout:", msg);
      socket.emit("logout-error", { message: msg });
    }
  });
});

// Debug endpoint to test OS detection
app.get("/debug/os/:jid", async (req, res) => {
  const jid = req.params.jid;
  try {
    const results = await sock.onWhatsApp(jid);
    const result = results?.[0];
    if (!result?.exists) {
      return res.json({ error: "JID does not exist" });
    }
    const tracker = new WhatsAppTracker(sock, result.jid);
    // Note: detectOSType is private, but we can access getOSType after initialization
    const osType = tracker.getOSType();
    const osDetails = tracker.getOSDetails();
    res.json({ jid: result.jid, osType, osDetails });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ error: msg });
  }
});

const PORT = parseInt(process.env.PORT || "3001", 10);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
