# Ignored Devices

This document lists device numbers that must be excluded from automated analysis, heuristics, or training evaluation.

## 971526756657 (Known Sender / Source)
- Reason: This number is a source/sender device used in the dataset and in research experiments (known iOS sender). Including it in detection outputs or training evaluation may bias results and cause misleading statistics (for example, multi-chain patterns originating from a sender used in tests).
- Action: The system should ignore this number when calculating heuristics, reporting multi-chain signatures, or running evaluation tests.

> Location: `docs/ignored_devices.md`

If you need additional devices to be ignored, add them to `src/config.ts` in the `IGNORED_DEVICE_NUMBERS` array and describe them here with justification.
