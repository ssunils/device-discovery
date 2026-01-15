# Session Features (exposed on ML failure)

When the TensorFlow model fails (or cannot run), the system no longer applies the simple '2+ chains = iOS' heuristic. Instead, it computes a compact and interpretable set of features derived from the session file and attaches them to `osDetails.features` for inspection and offline analysis.

Fields returned by `extractSessionFeatures(sessionFile)`:

- `sessionCount` — number of session objects found
- `chainCounts` — list of chain counts per session (e.g., [1,1,2])
- `avgChains` — average chains per session
- `maxChains` — max chains observed in any session
- `multiChainSessions` — number of sessions with 2+ chains
- `activeSessions` — count of sessions with `indexInfo.closed === -1`
- `pendingPreKeyTotal` — sum of pendingPreKey / preKeyId values across sessions

Why this change?
- The 2+ chains heuristic is brittle and can be absent for iOS devices depending on the session state. Exposing features helps diagnosis and enables richer model-building without hard-coded rules.

How it's used
- Tracker sets `osDetails.method = 'feature_analysis'` and includes the `features` object when ML fails.
- The UI and downstream analysis can read `devices[].os.features` and display or log those values.

If you'd like, I can also:
- Add an API endpoint (`GET /debug/features/:jid`) that returns the computed features for a given JID, or
- Add automated analysis tools that compute feature importances across the dataset to identify distinctive signals.