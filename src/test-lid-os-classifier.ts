/**
 * Test Suite: LID-based OS Classifier
 * Validates classifier against 9 ground truth devices
 */

import {
  classifyDeviceOS,
  classifyByLIDPrefix,
  extractLID,
  classifyMultipleDevices,
  getKnownPrefixes,
} from './lid-os-classifier.js';

interface TestDevice {
  phone: string;
  os: 'iOS' | 'Android';
  lid: string;
  prefix: string;
}

const TEST_DEVICES: TestDevice[] = [
  {
    phone: '919555067836',
    os: 'Android',
    lid: '86642509537531',
    prefix: '86',
  },
  {
    phone: '919840713333',
    os: 'Android',
    lid: '211729019588613',
    prefix: '21',
  },
  {
    phone: '971501122420',
    os: 'Android',
    lid: '99364638826583',
    prefix: '99',
  },
  {
    phone: '971504433653',
    os: 'iOS',
    lid: '128977985368108',
    prefix: '12',
  },
  {
    phone: '971564681838',
    os: 'iOS',
    lid: '156302600839390',
    prefix: '15',
  },
  {
    phone: '971585802074',
    os: 'Android',
    lid: '221130870812860',
    prefix: '22',
  },
  {
    phone: '971585844950',
    os: 'iOS',
    lid: '159523692146914',
    prefix: '15',
  },
  {
    phone: '971585884950',
    os: 'iOS',
    lid: '264647328403690',
    prefix: '26',
  },
  {
    phone: '971526756657',
    os: 'iOS',
    lid: '27711145828533',
    prefix: '27',
  },
];

async function runTests() {
  console.log('=' .repeat(80));
  console.log('🧪 LID-Based OS Classifier Test Suite');
  console.log('=' .repeat(80));

  // Test 1: LID Prefix Classification
  console.log('\n1️⃣  Testing LID Prefix Classification');
  console.log('-' .repeat(80));

  let prefixTestsPassed = 0;
  for (const device of TEST_DEVICES) {
    const result = classifyByLIDPrefix(device.lid);
    const passed = result.osType === device.os;
    prefixTestsPassed += passed ? 1 : 0;

    const status = passed ? '✓' : '✗';
    console.log(
      `${status} ${device.phone}: LID ${device.lid} (${device.prefix}) → ${result.osType} (expected ${device.os})`
    );
  }

  console.log(
    `\nResult: ${prefixTestsPassed}/${TEST_DEVICES.length} passed (${(
      (prefixTestsPassed / TEST_DEVICES.length) *
      100
    ).toFixed(1)}%)`
  );

  // Test 2: Full Classification
  console.log('\n2️⃣  Testing Full Classification (extract + classify)');
  console.log('-' .repeat(80));

  const sessionDir = './auth_info_baileys';
  let fullTestsPassed = 0;

  for (const device of TEST_DEVICES) {
    const result = classifyDeviceOS(device.phone, sessionDir);
    const passed = result.osType === device.os;
    fullTestsPassed += passed ? 1 : 0;

    const status = passed ? '✓' : '✗';
    console.log(
      `${status} ${device.phone}: ${result.osType} (confidence: ${(
        result.confidence * 100
      ).toFixed(0)}%)`
    );
  }

  console.log(
    `\nResult: ${fullTestsPassed}/${TEST_DEVICES.length} passed (${(
      (fullTestsPassed / TEST_DEVICES.length) *
      100
    ).toFixed(1)}%)`
  );

  // Test 3: Batch Classification
  console.log('\n3️⃣  Testing Batch Classification');
  console.log('-' .repeat(80));

  const phones = TEST_DEVICES.map((d) => d.phone);
  const batchResults = classifyMultipleDevices(phones, sessionDir);

  console.log(`Classified ${batchResults.size} devices in batch`);
  for (const [phone, result] of batchResults) {
    const expected = TEST_DEVICES.find((d) => d.phone === phone)?.os;
    const match = result.osType === expected ? '✓' : '✗';
    console.log(`  ${match} ${phone}: ${result.osType}`);
  }

  // Test 4: Confidence Scoring
  console.log('\n4️⃣  Testing Confidence Scoring');
  console.log('-' .repeat(80));

  for (const device of TEST_DEVICES) {
    const result = classifyByLIDPrefix(device.lid);
    const confidence = (result.confidence * 100).toFixed(1);
    console.log(
      `  ${device.phone}: ${result.osType} - ${confidence}% confidence`
    );
  }

  // Test 5: Known Prefixes
  console.log('\n5️⃣  Testing Known Prefixes');
  console.log('-' .repeat(80));

  const prefixes = getKnownPrefixes();
  console.log(`iOS prefixes: ${prefixes.ios.join(', ')}`);
  console.log(`Android prefixes: ${prefixes.android.join(', ')}`);

  // Test 6: Edge Cases
  console.log('\n6️⃣  Testing Edge Cases');
  console.log('-' .repeat(80));

  const edgeCases = [
    { lid: '', label: 'Empty LID' },
    { lid: '1', label: 'Single digit' },
    { lid: '99', label: 'Android prefix only' },
    { lid: '12', label: 'iOS prefix only' },
    { lid: '999999999999999', label: 'Unknown prefix' },
  ];

  for (const edgeCase of edgeCases) {
    const result = classifyByLIDPrefix(edgeCase.lid);
    console.log(`  ${edgeCase.label} (${edgeCase.lid}): ${result.osType}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 Test Summary');
  console.log('=' .repeat(80));

  const totalTests = TEST_DEVICES.length * 2;
  const totalPassed = prefixTestsPassed + fullTestsPassed;

  console.log(`Prefix tests: ${prefixTestsPassed}/${TEST_DEVICES.length} ✓`);
  console.log(`Full tests:   ${fullTestsPassed}/${TEST_DEVICES.length} ✓`);
  console.log(
    `\nTotal: ${totalPassed}/${totalTests} tests passed (${(
      (totalPassed / totalTests) *
      100
    ).toFixed(1)}%)`
  );

  if (totalPassed === totalTests) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed.');
  }

  console.log('=' .repeat(80));
}

// Run tests
runTests().catch(console.error);
