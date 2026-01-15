/**
 * Simple Direct OS Classifier
 *
 * Instead of complex ML feature extraction, just read the platform field
 * directly from WhatsApp's session credentials.
 *
 * This is the ground truth from WhatsApp's protocol implementation.
 */

import { readFileSync } from "fs";
import path from "path";

export interface DeviceClassification {
  osType: "iOS" | "Android" | "Web" | "Unknown";
  confidence: number; // 0.0 to 1.0
  method: "direct_platform_field";
  platform: string | null;
}

/**
 * Classify device OS from Baileys session credentials
 * @param sessionDir Path to auth_info_baileys directory
 * @returns Device classification with 100% confidence
 */
export function classifyDeviceOSSimple(
  sessionDir: string
): DeviceClassification {
  try {
    const credsPath = path.join(sessionDir, "creds.json");
    const credsData = readFileSync(credsPath, "utf-8");
    const creds = JSON.parse(credsData);

    const platform = creds.platform?.toLowerCase?.() || null;

    let osType: "iOS" | "Android" | "Web" | "Unknown";

    if (platform === "iphone") {
      osType = "iOS";
    } else if (platform === "android") {
      osType = "Android";
    } else if (platform === "web") {
      osType = "Web";
    } else {
      osType = "Unknown";
    }

    return {
      osType,
      confidence: 1.0, // 100% confidence - from official WhatsApp source
      method: "direct_platform_field",
      platform,
    };
  } catch (err) {
    console.error("[OS-CLASSIFIER] Error reading creds:", err);
    return {
      osType: "Unknown",
      confidence: 0,
      method: "direct_platform_field",
      platform: null,
    };
  }
}

/**
 * Classify device OS by JID (phone number)
 *
 * This maps a contact's JID to the device OS of the account
 * Note: This returns the account owner's OS, not the contact's OS
 *
 * @param jid WhatsApp JID (e.g., "971526756657@s.whatsapp.net")
 * @param sessionDir Path to auth_info_baileys directory
 * @returns Device classification
 */
export function classifyByJID(
  jid: string,
  sessionDir: string
): DeviceClassification {
  // Extract phone number from JID
  const phoneMatch = jid.match(/^(\d+)@/);
  const phoneNumber = phoneMatch?.[1];

  if (!phoneNumber) {
    return {
      osType: "Unknown",
      confidence: 0,
      method: "direct_platform_field",
      platform: null,
    };
  }

  // For multi-device tracking, check if device-list file exists
  const deviceListPath = path.join(
    sessionDir,
    `device-list-${phoneNumber}.json`
  );

  try {
    readFileSync(deviceListPath, "utf-8"); // Just check existence
    // If device list exists, use account's platform
    return classifyDeviceOSSimple(sessionDir);
  } catch {
    // Device not in our contact list
    return {
      osType: "Unknown",
      confidence: 0,
      method: "direct_platform_field",
      platform: null,
    };
  }
}

/**
 * Batch classify multiple devices
 */
export function classifyMultipleDevices(
  jids: string[],
  sessionDir: string
): Map<string, DeviceClassification> {
  const classification = classifyDeviceOSSimple(sessionDir);
  const result = new Map<string, DeviceClassification>();

  for (const jid of jids) {
    result.set(jid, classification);
  }

  return result;
}

/**
 * Get raw platform value from creds
 */
export function getRawPlatform(sessionDir: string): string | null {
  try {
    const credsPath = path.join(sessionDir, "creds.json");
    const creds = JSON.parse(readFileSync(credsPath, "utf-8"));
    return creds.platform || null;
  } catch {
    return null;
  }
}
