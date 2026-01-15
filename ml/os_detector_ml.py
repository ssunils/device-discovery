#!/usr/bin/env python3
"""
ML-based OS Detection for WhatsApp Devices
Uses TensorFlow model trained on Baileys session features
"""

import sys
import json
import os
from pathlib import Path

# Suppress TensorFlow logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

# Try to import numpy; if unavailable, fall back to Python stdlib statistics
try:
    import numpy as np
    _NUMPY_AVAILABLE = True
except Exception:
    np = None
    import statistics as _stats
    _NUMPY_AVAILABLE = False

# Try to import TensorFlow lazily; if unavailable, mark and proceed (do NOT exit on import failure)
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    import pickle
    _TENSORFLOW_AVAILABLE = True
except Exception:
    tf = None
    load_model = None
    pickle = pickle if 'pickle' in globals() else None
    _TENSORFLOW_AVAILABLE = False


def _mean(arr):
    if _NUMPY_AVAILABLE:
        return float(np.mean(arr))
    return float(_stats.mean(arr)) if arr else 0.0


def _std(arr):
    if _NUMPY_AVAILABLE:
        return float(np.std(arr))
    return float(_stats.pstdev(arr)) if arr else 0.0


def _min(arr):
    return float(min(arr)) if arr else 0.0


def _max(arr):
    return float(max(arr)) if arr else 0.0


def extract_features(session_data: dict) -> list:
    """Extract 23 features from Baileys session data"""
    
    features = []
    
    # Get all sessions for this device
    # Support both explicit 'sessions' key and Baileys-style '_sessions' container.
    if isinstance(session_data.get("_sessions"), dict):
        # Baileys stores sessions under the `_sessions` key -> {sessionKey: sessionObj}
        sessions_list = list(session_data["_sessions"].values())
    else:
        sessions = session_data.get("sessions", {}) or {
            k: v for k, v in session_data.items()
            if k not in ["creds", "chats", "contacts", "messages"]
        }
        sessions_list = list(sessions.values()) if isinstance(sessions, dict) else sessions

    # Keep only actual session objects (dicts) to avoid treating metadata strings as sessions
    sessions_list = [s for s in sessions_list if isinstance(s, dict)]
    
    if not sessions_list:
        # Return zero vector if no sessions
        return [0] * 23
    
    # 1-4: Timing Features (inter-session intervals)
    intervals = []
    timestamps = []
    for sess in sessions_list:
        if isinstance(sess, dict):
            # Try to extract timestamp from session
            ts = sess.get("timestamp") or sess.get("ts") or 0
            if ts:
                timestamps.append(ts)
    
    if len(timestamps) > 1:
        timestamps.sort()
        intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
    
    # Feature 1: Average inter-session interval
    features.append(_mean(intervals))
    # Feature 2: Std dev of intervals
    features.append(_std(intervals))
    # Feature 3: Min interval
    features.append(_min(intervals))
    # Feature 4: Max interval
    features.append(_max(intervals))
    
    # 5-8: Chain/Session Renegotiation Features
    chain_counts = []
    multi_chain_count = 0
    
    for sess in sessions_list:
        if isinstance(sess, dict):
            chains = sess.get("_chains", {})
            chain_count = len(chains) if chains else 1
            chain_counts.append(chain_count)
            if chain_count >= 2:
                multi_chain_count += 1
    
    # Feature 5: Average chains per session
    features.append(float(_mean(chain_counts)) if chain_counts else 1)
    # Feature 6: Max chains in any session
    features.append(float(_max(chain_counts)) if chain_counts else 1)
    # Feature 7: Count of multi-chain sessions (2+)
    features.append(float(multi_chain_count))
    # Feature 8: Binary has multi-chain
    features.append(1.0 if multi_chain_count > 0 else 0.0)
    
    # 9-11: Device Type Features
    base_key_types = {}
    for sess in sessions_list:
        if isinstance(sess, dict):
            bkt = sess.get("indexInfo", {}).get("baseKeyType") or sess.get("baseKeyType")
            if bkt:
                base_key_types[bkt] = base_key_types.get(bkt, 0) + 1
    
    # Feature 9: Unique baseKeyType count
    features.append(float(len(base_key_types)))
    # Feature 10: Count of baseKeyType 1
    features.append(float(base_key_types.get(1, 0)))
    # Feature 11: Count of baseKeyType 2
    features.append(float(base_key_types.get(2, 0)))
    
    # 12-14: Activity State Features
    active_sessions = sum(1 for s in sessions_list if isinstance(s, dict) and 
                         s.get("indexInfo", {}).get("closed", -1) == -1)
    inactive_sessions = len(sessions_list) - active_sessions
    
    # Feature 12: Active session count
    features.append(float(active_sessions))
    # Feature 13: Inactive session count
    features.append(float(inactive_sessions))
    # Feature 14: Active/inactive ratio
    ratio = active_sessions / inactive_sessions if inactive_sessions > 0 else 0
    features.append(float(ratio))
    
    # 15-17: Pending PreKey Features
    pending_prekey_counts = []
    for sess in sessions_list:
        if isinstance(sess, dict):
            ppk = sess.get("pendingPreKey", 0)
            # Normalize pendingPreKey into a numeric count/indicator:
            # - numeric values are used directly
            # - dict objects (Baileys pendingPreKey structure) count as 1
            # - lists count by length
            # - otherwise treated as 0
            if isinstance(ppk, (int, float)):
                pending_prekey_counts.append(float(ppk))
            elif isinstance(ppk, dict):
                # Presence of a pendingPreKey object indicates at least 1 pending key
                pending_prekey_counts.append(1.0)
            elif isinstance(ppk, list):
                pending_prekey_counts.append(float(len(ppk)))
            else:
                pending_prekey_counts.append(0.0)

    # Feature 15: Total pending PreKey count (sum of normalized counts)
    features.append(float(sum(pending_prekey_counts)))
    # Feature 16: Average pending PreKey
    features.append(float(np.mean(pending_prekey_counts)) if pending_prekey_counts else 0)
    # Feature 17: Ratio of sessions with pending PreKey (fraction of sessions with count>0)
    ppk_ratio = (
        sum(1 for c in pending_prekey_counts if c > 0) / len(pending_prekey_counts)
        if pending_prekey_counts
        else 0
    )
    features.append(float(ppk_ratio))
    
    # 18-20: Counter/Key Features (power management proxy)
    counters = []
    signed_key_ids = []
    pre_key_ids = []
    
    for sess in sessions_list:
        if isinstance(sess, dict):
            c = sess.get("currentRatchet", {}).get("counter", 0)
            if c:
                counters.append(c)
            ski = sess.get("indexInfo", {}).get("signedKeyId")
            if ski:
                signed_key_ids.append(ski)
            pki = sess.get("indexInfo", {}).get("preKeyId")
            if pki:
                pre_key_ids.append(pki)
    
    # Feature 18: Average counter value
    features.append(float(np.mean(counters)) if counters else 0)
    # Feature 19: Average signed key ID
    features.append(float(np.mean(signed_key_ids)) if signed_key_ids else 0)
    # Feature 20: Average pre key ID
    features.append(float(np.mean(pre_key_ids)) if pre_key_ids else 0)
    
    # 21-23: Advanced Activity Features
    # Feature 21: Session count
    features.append(float(len(sessions_list)))
    # Feature 22: Time span (latest - earliest timestamp)
    time_span = 0
    if len(timestamps) > 1:
        time_span = max(timestamps) - min(timestamps)
    features.append(float(time_span))
    # Feature 23: Sessions per hour (velocity)
    sessions_per_hour = 0
    if time_span > 0:
        hours = max(time_span / 3600, 1)  # At least 1 hour
        sessions_per_hour = len(sessions_list) / hours
    features.append(float(sessions_per_hour))
    
    return features


def predict_os(jid: str, session_file: str) -> dict:
    """Predict device OS using TensorFlow model"""
    
    try:
        # Read session file
        if not os.path.exists(session_file):
            return {
                "jid": jid,
                "osType": "Unknown",
                "confidence": 0,
                "error": f"Session file not found: {session_file}"
            }
        
        with open(session_file, "r") as f:
            session_data = json.load(f)
        
        # Extract features
        features = extract_features(session_data)
        features_array = np.array(features).reshape(1, -1)
        
        # Get model directory - handle both absolute and relative paths
        script_dir = Path(__file__).parent
        model_dir = script_dir.parent / "models"
        
        # Also try relative path from current working directory
        if not model_dir.exists():
            model_dir = Path("models")
        
        model_file = model_dir / "os_detector_model.h5"
        scaler_file = model_dir / "os_detector_scaler.pkl"
        
        # Check if models exist
        if not model_file.exists() or not scaler_file.exists():
            return {
                "jid": jid,
                "osType": "Unknown",
                "confidence": 0,
                "error": f"Model files not found. Checked: {model_dir}",
                "expected_files": [str(model_file), str(scaler_file)],
                "model_exists": model_file.exists(),
                "scaler_exists": scaler_file.exists()
            }
        
        # Load scaler
        with open(scaler_file, "rb") as f:
            scaler = pickle.load(f)
        
        # Normalize features
        features_normalized = scaler.transform(features_array)
        
        # Load model and predict
        model = load_model(model_file, compile=False)
        prediction = model.predict(features_normalized, verbose=0)[0][0]
        
        # Classify - iOS is 1, Android is 0
        os_type = "iOS" if prediction > 0.5 else "Android"
        # Confidence represents how certain we are
        confidence = float(abs(prediction - 0.5) * 2)
        
        # Ensure confidence is within [0, 1] range
        confidence = min(1.0, max(0.0, confidence))
        
        return {
            "jid": jid,
            "osType": os_type,
            "confidence": confidence,
            "method": "tensorflow_ml",
            "prediction_score": float(prediction),  # Raw model output for debugging
            "features": {
                "avg_chains": features[4],  # Average chains per session
                "multi_chain_count": features[6],  # Count of multi-chain sessions
                "session_count": features[20],  # Total sessions
                "active_sessions": features[11],  # Active sessions
                "session_count_feature": features[20],  # Feature 21
            }
        }
        
    except Exception as e:
        import traceback
        return {
            "jid": jid,
            "osType": "Unknown",
            "confidence": 0,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "error": "Usage: python3 os_detector_ml.py <jid> <session_file>"
        }))
        sys.exit(1)
    
    jid = sys.argv[1]
    session_file = sys.argv[2]
    
    result = predict_os(jid, session_file)
    print(json.dumps(result))
