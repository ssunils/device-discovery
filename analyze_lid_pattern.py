#!/usr/bin/env python3
"""
Analyze LID patterns to find iOS vs Android classifier
"""

devices = {
    '919555067836': 'Android',
    '919840713333': 'Android',
    '971501122420': 'Android',
    '971504433653': 'iOS',
    '971564681838': 'iOS',
    '971585802074': 'Android',
    '971585844950': 'iOS',
    '971585884950': 'iOS',
}

# LID mappings extracted from auth_info_baileys
lids = {
    '919555067836': '86642509537531',
    '919840713333': '211729019588613',
    '971501122420': '99364638826583',
    '971504433653': '128977985368108',
    '971564681838': '156302600839390',
    '971585802074': '221130870812860',
    '971585844950': '159523692146914',
    '971585884950': '264647328403690',
}

# Sender's data (verified iOS)
sender_phone = '971526756657'
sender_lid = '27711145828533'
sender_os = 'iOS'

print("=" * 80)
print("DETAILED LID PATTERN ANALYSIS FOR iOS vs Android")
print("=" * 80)

android_lids = []
ios_lids = []

for phone, os_type in sorted(devices.items()):
    lid = lids[phone]
    lid_int = int(lid)
    
    if os_type == 'Android':
        android_lids.append(lid_int)
    else:
        ios_lids.append(lid_int)

print("\n1. ANDROID DEVICES (LID numeric values)")
print("-" * 80)
android_sorted = sorted(android_lids)
for lid in android_sorted:
    print(f"  {lid}")
print(f"Range: {min(android_lids):>15} to {max(android_lids):<15}")
print(f"Spread: {max(android_lids) - min(android_lids)}")
print(f"Average: {sum(android_lids) / len(android_lids):.0f}")

print("\n2. iOS DEVICES (LID numeric values)")
print("-" * 80)
ios_sorted = sorted(ios_lids)
for lid in ios_sorted:
    print(f"  {lid}")
print(f"Range: {min(ios_lids):>15} to {max(ios_lids):<15}")
print(f"Spread: {max(ios_lids) - min(ios_lids)}")
print(f"Average: {sum(ios_lids) / len(ios_lids):.0f}")

# Sender data
print(f"\n3. SENDER DATA (verified iOS)")
print("-" * 80)
print(f"Phone: {sender_phone}")
print(f"LID: {sender_lid} ({int(sender_lid)})")
print(f"OS: {sender_os}")

# Check overlap
print(f"\n4. RANGE OVERLAP")
print("-" * 80)
min_android = min(android_lids)
max_android = max(android_lids)
min_ios = min(ios_lids)
max_ios = max(ios_lids)

print(f"Android range: {min_android} - {max_android}")
print(f"iOS range:     {min_ios} - {max_ios}")

if max_android < min_ios or max_ios < min_android:
    print(f"✓ RANGES DON'T OVERLAP - Range-based classifier possible")
else:
    print(f"✗ RANGES OVERLAP - Need different classifier")

# Find best threshold
print(f"\n5. THRESHOLD ANALYSIS")
print("-" * 80)

# Try different thresholds
test_thresholds = [
    (min_android + max_android) / 2,
    (min_ios + max_ios) / 2,
    (max_android + min_ios) / 2,
    100000000000,
    150000000000,
    200000000000,
]

best_threshold = None
best_accuracy = 0

for threshold in test_thresholds:
    correct = 0
    for phone, os_type in devices.items():
        lid = int(lids[phone])
        predicted = 'iOS' if lid > threshold else 'Android'
        if predicted == os_type:
            correct += 1
    
    accuracy = correct / len(devices)
    print(f"Threshold {threshold:.0f}: {correct}/8 correct ({accuracy*100:.1f}%)")
    
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_threshold = threshold

# Digit pattern analysis
print(f"\n6. DIGIT PATTERN ANALYSIS")
print("-" * 80)

print("\nAndroid digit sum (sum of all digits in LID):")
for phone in sorted([p for p, os in devices.items() if os == 'Android']):
    lid = lids[phone]
    digit_sum = sum(int(d) for d in lid)
    print(f"  {phone}: {lid} → sum={digit_sum}")

print("\niOS digit sum:")
for phone in sorted([p for p, os in devices.items() if os == 'iOS']):
    lid = lids[phone]
    digit_sum = sum(int(d) for d in lid)
    print(f"  {phone}: {lid} → sum={digit_sum}")

# Leading digit analysis
print(f"\n7. LEADING DIGIT ANALYSIS")
print("-" * 80)

android_leading = {}
ios_leading = {}

for phone, os_type in devices.items():
    lid = lids[phone]
    leading = lid[0]
    
    if os_type == 'Android':
        android_leading[leading] = android_leading.get(leading, 0) + 1
    else:
        ios_leading[leading] = ios_leading.get(leading, 0) + 1

print("\nAndroid leading digits:")
for digit in sorted(android_leading.keys()):
    print(f"  '{digit}': {android_leading[digit]} device(s)")

print("\niOS leading digits:")
for digit in sorted(ios_leading.keys()):
    print(f"  '{digit}': {ios_leading[digit]} device(s)")

# Modulo analysis
print(f"\n8. MODULO ANALYSIS")
print("-" * 80)

for mod in [3, 5, 7, 10, 11]:
    print(f"\nMod {mod}:")
    android_mods = [int(lids[p]) % mod for p, os in devices.items() if os == 'Android']
    ios_mods = [int(lids[p]) % mod for p, os in devices.items() if os == 'iOS']
    
    print(f"  Android: {sorted(android_mods)}")
    print(f"  iOS:     {sorted(ios_mods)}")
    
    # Check for separation
    if max(android_mods) < min(ios_mods) or max(ios_mods) < min(android_mods):
        print(f"  ✓ Separation found at mod {mod}!")

print("\n" + "=" * 80)
print("RECOMMENDATIONS")
print("=" * 80)
print(f"""
Based on analysis, the best classifier appears to be:
  Threshold: {best_threshold:.0f}
  Accuracy: {best_accuracy*100:.1f}%
  
  Rule: LID > {best_threshold:.0f} → iOS
        LID ≤ {best_threshold:.0f} → Android
""")
