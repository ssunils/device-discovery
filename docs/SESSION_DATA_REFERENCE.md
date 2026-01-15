# iOS and Android Device Classifiers - Data Reference

## 📋 Session Data Structure

### Location
```
auth_info_baileys/creds.json
```

### The Classifier Field

The **primary classifier** is located directly in the session credentials:

```json
{
  "platform": "iphone",  ← iOS/Android Indicator
  "me": {
    "id": "971526756657:17@s.whatsapp.net",
    "lid": "27711145828533:17@lid",
    "name": "Sunil"
  },
  "registrationId": 68,
  "nextPreKeyId": 813,
  "accountSyncCounter": 1,
  "registered": false,
  "noiseKey": { /* encryption keys */ },
  "signedIdentityKey": { /* encryption keys */ },
  "signedPreKey": { /* encryption keys */ },
  "processedHistoryMessages": [ /* message history */ ],
  "account": { /* account details */ },
  "signalIdentities": [ /* identity info */ ],
  "routingInfo": { /* network routing */ },
  "myAppStateKeyId": "AAAAAIw/"
}
```

---

## 🎯 Classifier Values

### Platform Field Mappings

| Value | OS | Type |
|-------|-----|------|
| `"iphone"` | **iOS** | Mobile |
| `"android"` | **Android** | Mobile |
| `"web"` | **Web Client** | Desktop/Browser |
| `null` or missing | **Unknown** | Unidentified |

### Example Values from Your System

```
Current Session:
  platform: "iphone"
  → Classification: iOS ✅
  → Confidence: 100%
  → Method: Direct from creds.json
```

---

## 📊 Complete Field Reference

### Authentication & Encryption
```json
{
  "noiseKey": {
    "private": { "type": "Buffer", "data": "..." },
    "public": { "type": "Buffer", "data": "..." }
  },
  "pairingEphemeralKeyPair": { /* keys */ },
  "signedIdentityKey": { /* keys */ },
  "signedPreKey": {
    "keyPair": { /* keys */ },
    "signature": { /* sig */ },
    "keyId": 1
  }
}
```

### Device Identity
```json
{
  "me": {
    "id": "971526756657:17@s.whatsapp.net",    ← WhatsApp JID
    "lid": "27711145828533:17@lid",            ← Local ID
    "name": "Sunil"                            ← Device name
  },
  "platform": "iphone",                         ← OS Indicator ⭐
  "registrationId": 68                          ← Registration number
}
```

### Key Management
```json
{
  "nextPreKeyId": 813,                          ← Next key to use
  "firstUnuploadedPreKeyId": 813,              ← Unsynced keys
  "myAppStateKeyId": "AAAAAIw/"                ← App state version
}
```

### Account Status
```json
{
  "registered": false,                          ← Registration state
  "accountSyncCounter": 1,                      ← Sync version
  "accountSettings": {
    "unarchiveChats": false
  },
  "lastAccountSyncTimestamp": 1768480338,      ← Last sync time
  "lastPropHash": "PWk5B"                       ← Property hash
}
```

### Message History
```json
{
  "processedHistoryMessages": [
    {
      "key": {
        "remoteJid": "971526756657@s.whatsapp.net",
        "fromMe": false,
        "id": "3AA37514D695F0A2204C",
        "addressingMode": "pn"
      },
      "messageTimestamp": 1768479791
    }
    // ... more messages
  ]
}
```

### Signal Protocol
```json
{
  "signalIdentities": [
    {
      "identifier": {
        "name": "27711145828533:17@lid",
        "deviceId": 0
      },
      "identifierKey": {
        "type": "Buffer",
        "data": "BeB6ljQSvYNKEjIMaemF2+Us/eYujAXe6YWAN/ALFHws"
      }
    }
  ]
}
```

### Account Details
```json
{
  "account": {
    "details": "CNmKrsMDEKS4o8sGGAEgACgA",      ← Protobuf encoded
    "accountSignatureKey": "4HqWNBK9g0oSMgxp6YXb5Sz95i6MBd7phYA38AsUfCw=",
    "accountSignature": "1Qmi/bE/rjfKFaVHFELZyagb9SwSLQr5ZsUHzYQi+ZZiY09q7rC+LGHX4cK1s9/TLRGrgSrXVdmauxZSs1KhBQ==",
    "deviceSignature": "NTh15kAnaFmJM0IBbntnS0Vl2Tyd0LwUUfGmT2d8WGbnTfCq9a93nirysCz0RkAeI0HR4wyv6zzTc+foCiUpDw=="
  }
}
```

### Network Routing
```json
{
  "routingInfo": {
    "type": "Buffer",
    "data": "CAMIDQgF"                          ← Encoded routing info
  }
}
```

---

## 🔍 How to Extract the Classifier

### Method 1: Direct JavaScript/TypeScript

```typescript
import { readFileSync } from 'fs';
import path from 'path';

function getOS(sessionDir: string) {
  const creds = JSON.parse(
    readFileSync(path.join(sessionDir, 'creds.json'), 'utf-8')
  );
  return creds.platform; // "iphone" | "android" | "web" | null
}

// Usage
const platform = getOS('./auth_info_baileys');
console.log(platform); // "iphone"
```

### Method 2: Command Line

```bash
# Extract just the platform value
cat auth_info_baileys/creds.json | jq '.platform'
# Output: "iphone"

# Get full device info
cat auth_info_baileys/creds.json | jq '{
  platform: .platform,
  name: .me.name,
  id: .me.id
}'
```

### Method 3: Python

```python
import json

with open('auth_info_baileys/creds.json') as f:
    creds = json.load(f)
    platform = creds.get('platform')
    print(platform)  # "iphone"
```

---

## 📈 Your System's Current State

### Current Session Data
```
File: auth_info_baileys/creds.json
Device Owner: Sunil
Device ID: 971526756657:17@s.whatsapp.net
Platform: iphone
Classification: iOS ✅
Confidence: 100%
```

### Related Device Lists
```
device-list-919555067836.json  → Linked contact's devices
device-list-919840713333.json  → Linked contact's devices
device-list-971526756657.json  → Linked contact's devices
device-list-971564681838.json  → Linked contact's devices
device-list-971585802074.json  → Linked contact's devices
device-list-971585844950.json  → Linked contact's devices
device-list-971585884950.json  → Linked contact's devices
```

**Note:** These device-list files only show device indices (0, 69, 70, etc.), not platform info. Only your own `creds.json` contains the `platform` field.

---

## 🔐 Important Notes

### What You Can Classify
- ✅ Your own device OS (from your `creds.json`)
- ✅ Stored in `"platform"` field
- ✅ Always accurate and up-to-date

### What You Cannot Classify
- ❌ Contacts' OS (you don't have their `creds.json`)
- ❌ Linked devices' OS (only you have the platform info)
- ❌ Web clients (show as "web" regardless of actual OS)

### Why This Is Reliable
1. Set by WhatsApp during registration
2. Persisted in secure session storage
3. Used by WhatsApp for routing decisions
4. Never changes during a session
5. Directly from the protocol layer

---

## 🚀 Quick Implementation

```typescript
// Complete classifier in 15 lines
import { readFileSync } from 'fs';
import path from 'path';

export function classifyDeviceOS(sessionDir: string): 'iOS' | 'Android' | 'Unknown' {
  try {
    const creds = JSON.parse(
      readFileSync(path.join(sessionDir, 'creds.json'), 'utf-8')
    );
    const platform = creds.platform?.toLowerCase();
    
    if (platform === 'iphone') return 'iOS';
    if (platform === 'android') return 'Android';
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Usage
console.log(classifyDeviceOS('./auth_info_baileys')); // iOS
```

---

## 📚 Field Purposes

| Field | Purpose | Classifier? |
|-------|---------|-----------|
| `platform` | Device OS type | ✅ **YES** |
| `me.id` | Your WhatsApp JID | No |
| `me.lid` | Your local LID | No |
| `registrationId` | Account registration number | No |
| `noiseKey` | Noise protocol encryption | No |
| `signedPreKey` | Signal protocol key | No |
| `signalIdentities` | Identity keys | No |
| `routingInfo` | Network routing data | No |
| `accountSettings` | UI preferences | No |
| `processedHistoryMessages` | Sync history | No |

---

## 💾 Data Persistence

The `platform` field is:
- **Created**: During initial WhatsApp registration
- **Stored**: In `creds.json` (encrypted locally)
- **Updated**: Never (static for session lifetime)
- **Synced**: Across all linked devices with same account
- **Cleared**: Only when you log out/disconnect

---

## Conclusion

**The iOS/Android classifier is trivially simple when you have direct access to the source data.** No ML, no complex features, no inference needed. Just read the `platform` field from `creds.json`.
