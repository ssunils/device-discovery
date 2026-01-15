#!/usr/bin/env node
/**
 * Test script for ML detector integration
 * Tests both the Node.js wrapper and Python ML detector
 */

import { detectOSWithML } from "./ml-detector.js";
import path from "path";

async function testMLDetector() {
  console.log("🧪 Testing ML Detector Integration\n");

  const testDir = "/Users/user/DEV/remote-device-activity/device-activity-tracker";
  const sessionFile = path.join(
    testDir,
    "auth_info_baileys",
    "session-156302600839390_1.10.json"
  );

  console.log(`📁 Session file: ${sessionFile}`);
  console.log(`🔍 Testing ML detection...\n`);

  try {
    const result = await detectOSWithML("919555067836@s.whatsapp.net", sessionFile);

    console.log("✅ ML Detection Result:");
    console.log(`   OS Type: ${result.osType}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(2)}%`);
    console.log(`   Method: ${result.method}`);
    console.log(`   Error: ${result.error || "None"}`);

    if (result.osType === "iOS") {
      console.log("\n✨ iOS Detection: SUCCESS");
    } else if (result.osType === "Unknown" && result.error) {
      console.log("\n❌ ML Detection failed:", result.error);
    } else {
      console.log(`\n⚠️  Detected as ${result.osType}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }

  console.log("\n✅ Test completed");
}

testMLDetector();
