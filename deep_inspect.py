#!/usr/bin/env python3
import json
import os
import pandas as pd
from pathlib import Path
from collections import Counter

GROUND_TRUTH = {
    '919555067836': 'Android', '919840713333': 'Android', '971501122420': 'Android',
    '971585802074': 'Android', '971561602014': 'Android', '971504213278': 'Android',
    '971501440391': 'Android', '971504433653': 'iOS', '971564681838': 'iOS',
    '971585844950': 'iOS', '971585884950': 'iOS', '971526756657': 'iOS',
    '971509203321': 'iOS',
}

def get_lid(phone, session_dir):
    lid_file = Path(session_dir) / f'lid-mapping-{phone}.json'
    if lid_file.exists():
        with open(lid_file) as f:
            return json.load(f).strip('"')
    return None

def deep_inspect():
    session_dir = './auth_info_baileys'
    results = []
    
    for phone, os_type in GROUND_TRUTH.items():
        lid = get_lid(phone, session_dir)
        if not lid: continue
        
        session_files = list(Path(session_dir).glob(f'session-{lid}_*.json'))
        for s_file in session_files:
            with open(s_file) as f:
                try:
                    data = json.load(f)
                    if '_sessions' not in data: continue
                    
                    for sess_id, sess in data['_sessions'].items():
                        info = {
                            'phone': phone,
                            'os': os_type,
                            'file': s_file.name,
                            'registrationId': sess.get('registrationId'),
                            'has_pending': 'pendingPreKey' in sess,
                            'preKeyId': sess.get('pendingPreKey', {}).get('preKeyId') if 'pendingPreKey' in sess else None,
                            'signedKeyId': sess.get('pendingPreKey', {}).get('signedKeyId') if 'pendingPreKey' in sess else None,
                            'chain_count': len(sess.get('_chains', {})),
                            'baseKeyType': sess.get('indexInfo', {}).get('baseKeyType'),
                            'closed': sess.get('indexInfo', {}).get('closed'),
                            'ratchet_prev': sess.get('currentRatchet', {}).get('previousCounter'),
                        }
                        
                        # Inspect the binary structure of registrationId
                        reg_id = info['registrationId']
                        if reg_id is not None:
                            info['reg_id_bits'] = bin(reg_id).count('1')
                            info['reg_id_max_bit'] = reg_id.bit_length()
                            info['reg_id_is_small'] = reg_id < 20000
                            
                        # Inspect RootKey entropy/prefix
                        root_key = sess.get('currentRatchet', {}).get('rootKey', '')
                        if root_key:
                            info['root_key_start'] = root_key[0]
                            info['root_key_end'] = root_key[-2] if len(root_key) > 1 else ''
                            
                        results.append(info)
                except:
                    continue
                    
    df = pd.DataFrame(results)
    
    print("\n=== DEEP SEMANTIC ANALYSIS ===")
    
    print("\n1. Registration ID Range Analysis:")
    print(df.groupby('os')['registrationId'].agg(['min', 'max', 'mean', 'count']))
    
    print("\n2. Small Registration ID (< 20,000) frequency:")
    print(df.groupby('os')['reg_id_is_small'].value_counts(normalize=True))
    
    print("\n3. PreKey ID Value Distribution:")
    print(df.groupby('os')['preKeyId'].agg(['min', 'max', 'median']))
    
    print("\n4. RootKey First Character Distribution:")
    print(pd.crosstab(df['os'], df['root_key_start']))
    
    print("\n5. Presence of pendingPreKey:")
    print(df.groupby('os')['has_pending'].value_counts(normalize=True))
    
    print("\n6. Chain Count per Session:")
    print(df.groupby('os')['chain_count'].value_counts(normalize=True))

    # Look for the "Unicorn" - a feature that is 100% unique to one side
    print("\n7. Searching for Absolute Discriminators...")
    
    # Feature 1: Registration ID < 20,000 is ONLY Android in our set?
    android_small = df[(df['os'] == 'Android') & (df['reg_id_is_small'] == True)]
    ios_small = df[(df['os'] == 'iOS') & (df['reg_id_is_small'] == True)]
    print(f"Devices with small RegID: Android={len(android_small)}, iOS={len(ios_small)}")
    
    # Feature 2: High PreKeyId (> 100,000) is ONLY Android?
    android_high_pre = df[(df['os'] == 'Android') & (df['preKeyId'] > 100000)]
    ios_high_pre = df[(df['os'] == 'iOS') & (df['preKeyId'] > 100000)]
    print(f"Devices with high PreKeyID (>100k): Android={len(android_high_pre)}, iOS={len(ios_high_pre)}")

    # Feature 3: Chain count > 1?
    print("\nSessions with Multiple Chains:")
    print(df[df['chain_count'] > 1][['os', 'phone', 'chain_count']])

if __name__ == "__main__":
    deep_inspect()
