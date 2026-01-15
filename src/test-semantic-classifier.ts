import { classifyMultipleDevices } from "./semantic-os-classifier.js";

const sessionDir = "./auth_info_baileys";

// Ground truth data (all 13 devices)
const GROUND_TRUTH: Record<string, "iOS" | "Android"> = {
  // Android
  "919555067836": "Android",
  "919840713333": "Android",
  "971501122420": "Android",
  "971585802074": "Android",
  "971561602014": "Android",
  "971504213278": "Android",
  "971501440391": "Android",
  // iOS
  "971504433653": "iOS",
  "971564681838": "iOS",
  "971585844950": "iOS",
  "971585884950": "iOS",
  "971526756657": "iOS",
  "971509203321": "iOS",
};

const phones = Object.keys(GROUND_TRUTH);
const results = classifyMultipleDevices(phones, sessionDir);

console.log("=== SEMANTIC CLASSIFIER TEST RESULTS ===\n");

let correct = 0;
let total = 0;

for (const [phone, classification] of results) {
  const actual = GROUND_TRUTH[phone];
  const passed = classification.osType === actual;

  if (passed) correct++;
  total++;

  console.log(`${phone}:`);
  console.log(`  Actual:      ${actual}`);
  console.log(
    `  Predicted:   ${classification.osType} ${passed ? "✅" : "❌"}`
  );
  console.log(
    `  Confidence:  ${(classification.confidence * 100).toFixed(1)}%`
  );
  console.log(
    `  Signals:     reg=${classification.signals.registrationId}, pre=${classification.signals.preKeyId}, signed=${classification.signals.signedKeyId}, chains=${classification.signals.chainCount}, prefix=${classification.signals.lidPrefix}`
  );
  console.log("---");
}

console.log(
  `\nFinal Score: ${correct}/${total} (${((correct / total) * 100).toFixed(
    1
  )}%)`
);

if (correct === total) {
  console.log("\n🎉 ALL DEVICES CORRECTLY CLASSIFIED!");
} else {
  console.log("\n⚠️ SOME MISCLASSIFICATIONS DETECTED.");
}
