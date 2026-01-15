/**
 * Test: Simple OS Classifier
 * 
 * Demonstrates that iOS/Android classification is trivially simple
 * when using the direct platform field from WhatsApp session data.
 */

import { 
  classifyDeviceOSSimple, 
  getRawPlatform,
  classifyByJID,
  classifyMultipleDevices
} from './simple-os-classifier.js';

async function testClassifier() {
  const sessionDir = './auth_info_baileys';
  
  console.log('='.repeat(60));
  console.log('📱 Simple OS Classifier Test');
  console.log('='.repeat(60));
  
  // Test 1: Get raw platform
  console.log('\n1️⃣  Raw Platform Value:');
  const rawPlatform = getRawPlatform(sessionDir);
  console.log(`   Platform: "${rawPlatform}"`);
  
  // Test 2: Simple classification
  console.log('\n2️⃣  Simple Classification:');
  const classification = classifyDeviceOSSimple(sessionDir);
  console.log(`   OS Type: ${classification.osType}`);
  console.log(`   Confidence: ${classification.confidence * 100}%`);
  console.log(`   Method: ${classification.method}`);
  
  // Test 3: By JID
  console.log('\n3️⃣  Classification by JID:');
  const testJID = '971526756657@s.whatsapp.net';
  const jidClassification = classifyByJID(testJID, sessionDir);
  console.log(`   JID: ${testJID}`);
  console.log(`   OS Type: ${jidClassification.osType}`);
  console.log(`   Confidence: ${jidClassification.confidence * 100}%`);
  
  // Test 4: Batch classification
  console.log('\n4️⃣  Batch Classification:');
  const jids = [
    '971526756657@s.whatsapp.net',
    '971564681838@s.whatsapp.net',
    '971585884950@s.whatsapp.net'
  ];
  const batchResults = classifyMultipleDevices(jids, sessionDir);
  console.log(`   Classified ${batchResults.size} devices`);
  for (const [jid, result] of batchResults) {
    console.log(`   • ${jid}: ${result.osType}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed');
  console.log('='.repeat(60));
}

// Run tests
testClassifier().catch(console.error);
