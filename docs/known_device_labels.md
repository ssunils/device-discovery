# Known Device Labels (Ground Truth)

This file records devices with known OS labels and the observed session signatures (chain counts) from the `auth_info_baileys` session files.

| Phone Number | Known OS | Observed max _chains_ | Notes                                                                                    |
| ------------ | -------- | --------------------- | ---------------------------------------------------------------------------------------- |
| 919555067836 | Android  | 1                     | Sessions inspected: `session-86642509537531_*.json` (single-chain sessions)              |
| 919840713333 | Android  | 1                     | Lid mapping -> `211729019588613`; `session-211729019588613_1.0.json` shows single-chain  |
| 971501122420 | Android  | 1                     | `session-99364638826583_1.0.json` shows single-chain                                     |
| 971504433653 | iOS      | 1                     | `session-128977985368108_1.0.json` shows single-chain (no multi-chain signature present) |
| 971564681838 | iOS      | 1                     | `session-156302600839390_1.0.json` (multiple sessions present, all single-chain)         |
| 971585802074 | Android  | 1                     | `session-221130870812860_1.0.json` single-chain                                          |
| 971585844950 | iOS      | 1                     | `session-159523692146914_1.0.json` single-chain                                          |
DEPRECATED: Known device labels were removed per user request to avoid bias. Ground-truth labels should not be embedded in production detection flows. If you need an offline ground-truth CSV for evaluation, keep it external to the detection codebase.