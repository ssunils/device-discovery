#!/usr/bin/env python3
"""
Deep analysis of WhatsApp session data to discover iOS vs Android patterns.
Uses pandas for structured data analysis and clustering.
"""

import json
import os
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict

# Ground truth data
GROUND_TRUTH = {
    # Android devices
    '919555067836': 'Android',
    '919840713333': 'Android',
    '971501122420': 'Android',
    '971585802074': 'Android',
    '971561602014': 'Android',
    '971504213278': 'Android',
    '971501440391': 'Android',
    # iOS devices
    '971504433653': 'iOS',
    '971564681838': 'iOS',
    '971585844950': 'iOS',
    '971585884950': 'iOS',
    '971526756657': 'iOS',
    '971509203321': 'iOS',
}

def extract_all_features(session_dir='./auth_info_baileys'):
    """Extract all available features from session files."""
    session_path = Path(session_dir)
    
    data = []
    
    for phone, os_type in GROUND_TRUTH.items():
        print(f"\nAnalyzing {phone} ({os_type})...")
        
        features = {
            'phone': phone,
            'os_type': os_type,
        }
        
        # 1. Extract LID
        lid_file = session_path / f'lid-mapping-{phone}.json'
        if lid_file.exists():
            with open(lid_file) as f:
                lid = json.load(f).strip('"')
                features['lid'] = lid
                features['lid_length'] = len(lid)
                features['lid_prefix_2'] = int(lid[:2]) if len(lid) >= 2 else None
                features['lid_prefix_3'] = int(lid[:3]) if len(lid) >= 3 else None
                features['lid_first_digit'] = int(lid[0]) if lid else None
                features['lid_sum_digits'] = sum(int(d) for d in lid if d.isdigit())
                features['lid_avg_digit'] = sum(int(d) for d in lid if d.isdigit()) / len(lid) if lid else None
                features['lid_mod_100'] = int(lid) % 100 if lid.isdigit() else None
                features['lid_mod_1000'] = int(lid) % 1000 if lid.isdigit() else None
        
        # 2. Device list
        device_list_file = session_path / f'device-list-{phone}.json'
        if device_list_file.exists():
            with open(device_list_file) as f:
                device_list = json.load(f)
                features['device_count'] = len(device_list)
                features['has_zero'] = '0' in device_list
                features['device_list'] = str(device_list)
                # Extract numeric device IDs (excluding '0')
                numeric_devices = [int(d) for d in device_list if d.isdigit() and d != '0']
                features['max_device_id'] = max(numeric_devices) if numeric_devices else None
                features['min_device_id'] = min(numeric_devices) if numeric_devices else None
                features['avg_device_id'] = sum(numeric_devices) / len(numeric_devices) if numeric_devices else None
        
        # 3. Session files
        session_files = list(session_path.glob(f'session-*_{phone}_*.json')) if False else []
        # Try LID-based session files
        if 'lid' in features:
            session_files = list(session_path.glob(f'session-{features["lid"]}_*.json'))
        
        features['session_file_count'] = len(session_files)
        
        # 4. Analyze session file structure
        if session_files:
            # Read first session file
            with open(session_files[0]) as f:
                session_data = json.load(f)
                
                # Extract session metadata
                if '_sessions' in session_data:
                    sessions = session_data['_sessions']
                    features['session_count'] = len(sessions)
                    
                    # Analyze first session
                    if sessions:
                        first_session_key = list(sessions.keys())[0]
                        first_session = sessions[first_session_key]
                        
                        # Extract all available fields
                        features['has_registration_id'] = 'registrationId' in first_session
                        features['registration_id'] = first_session.get('registrationId', None)
                        features['has_platform_type'] = 'platformType' in first_session
                        features['platform_type'] = first_session.get('platformType', None)
                        
                        # Check for various fields that might indicate OS
                        features['has_current_ratchet'] = 'currentRatchet' in first_session
                        features['has_index_info'] = 'indexInfo' in first_session
                        features['has_pending_prekey'] = 'pendingPreKey' in first_session
                        
                        # Analyze preKey structure
                        if 'pendingPreKey' in first_session:
                            prekey = first_session['pendingPreKey']
                            features['prekey_signed_key_id'] = prekey.get('signedKeyId', None)
                            features['prekey_id'] = prekey.get('preKeyId', None)
                        
                        # Analyze indexInfo
                        if 'indexInfo' in first_session:
                            index_info = first_session['indexInfo']
                            features['base_key_type'] = index_info.get('baseKeyType', None)
                            features['index_closed'] = index_info.get('closed', None)
                            features['index_created'] = index_info.get('created', None)
                            features['index_used'] = index_info.get('used', None)
                            
                        # More preKey analysis
                        if 'pendingPreKey' in first_session:
                            prekey = first_session['pendingPreKey']
                            features['prekey_signed_key_id'] = prekey.get('signedKeyId', None)
                            features['prekey_id'] = prekey.get('preKeyId', None)
                            
                        # Ratchet info
                        if 'currentRatchet' in first_session:
                            ratchet = first_session['currentRatchet']
                            features['ratchet_prev_counter'] = ratchet.get('previousCounter', None)
                        
                        # Get all keys in session
                        features['session_keys'] = ','.join(sorted(first_session.keys()))
        
        # 5. Reverse LID mapping
        if 'lid' in features:
            reverse_lid_file = session_path / f'lid-mapping-{features["lid"]}_reverse.json'
            features['has_reverse_mapping'] = reverse_lid_file.exists()
        
        data.append(features)
    
    return pd.DataFrame(data)

def analyze_patterns(df):
    """Perform comprehensive pattern analysis."""
    print("\n" + "="*80)
    print("COMPREHENSIVE DATA ANALYSIS")
    print("="*80)
    
    # 1. Basic statistics by OS
    print("\n--- LID Statistics by OS ---")
    print(df.groupby('os_type')[['lid_length', 'lid_prefix_2', 'lid_prefix_3', 'lid_first_digit']].describe())
    
    # 2. Device count analysis
    print("\n--- Device Count by OS ---")
    print(df.groupby('os_type')['device_count'].describe())
    
    # 3. Session file count
    print("\n--- Session File Count by OS ---")
    print(df.groupby('os_type')['session_file_count'].describe())
    
    # 4. LID prefix frequency
    print("\n--- LID Prefix (2-digit) Frequency ---")
    prefix_analysis = df.groupby(['os_type', 'lid_prefix_2']).size().reset_index(name='count')
    print(prefix_analysis.pivot(index='lid_prefix_2', columns='os_type', values='count').fillna(0))
    
    # 5. Look for separable features
    print("\n--- Feature Separation Analysis ---")
    for col in ['lid_prefix_2', 'lid_first_digit', 'device_count', 'session_file_count']:
        if col in df.columns:
            print(f"\n{col}:")
            android_vals = set(df[df['os_type'] == 'Android'][col].dropna().unique())
            ios_vals = set(df[df['os_type'] == 'iOS'][col].dropna().unique())
            
            print(f"  Android only: {android_vals - ios_vals}")
            print(f"  iOS only: {ios_vals - android_vals}")
            print(f"  Overlap: {android_vals & ios_vals}")
    
    # 6. Correlation analysis
    print("\n--- Numeric Feature Correlations with OS ---")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    numeric_cols = [c for c in numeric_cols if c not in ['phone']]
    
    if numeric_cols:
        # Create binary OS column (1=iOS, 0=Android)
        df['os_binary'] = (df['os_type'] == 'iOS').astype(int)
        
        correlations = []
        for col in numeric_cols:
            if df[col].notna().sum() > 0:
                corr = df[[col, 'os_binary']].dropna().corr().iloc[0, 1]
                correlations.append({'feature': col, 'correlation': corr})
        
        corr_df = pd.DataFrame(correlations).sort_values('correlation', ascending=False)
        print(corr_df.to_string())
    
    return df

def find_discriminative_rules(df):
    """Find simple rules that separate iOS from Android."""
    print("\n" + "="*80)
    print("DISCRIMINATIVE RULES")
    print("="*80)
    
    # Test various thresholds and rules
    rules = []
    
    # LID-based rules
    if 'lid_prefix_2' in df.columns:
        for prefix in df['lid_prefix_2'].dropna().unique():
            android_count = len(df[(df['lid_prefix_2'] == prefix) & (df['os_type'] == 'Android')])
            ios_count = len(df[(df['lid_prefix_2'] == prefix) & (df['os_type'] == 'iOS')])
            total = android_count + ios_count
            
            if total > 0:
                accuracy = max(android_count, ios_count) / total
                predicted = 'Android' if android_count > ios_count else 'iOS'
                
                rules.append({
                    'rule': f'lid_prefix_2 == {prefix}',
                    'predicted_os': predicted,
                    'accuracy': accuracy,
                    'support': total
                })
    
    # Device count rules
    if 'device_count' in df.columns:
        for threshold in [1, 2, 3, 4]:
            for operator in ['>', '<', '>=', '<=']:
                if operator in ['>', '>=']:
                    subset = df[df['device_count'] >= threshold]
                else:
                    subset = df[df['device_count'] < threshold]
                
                if len(subset) > 0:
                    android_count = len(subset[subset['os_type'] == 'Android'])
                    ios_count = len(subset[subset['os_type'] == 'iOS'])
                    total = len(subset)
                    
                    accuracy = max(android_count, ios_count) / total
                    predicted = 'Android' if android_count > ios_count else 'iOS'
                    
                    rules.append({
                        'rule': f'device_count {operator} {threshold}',
                        'predicted_os': predicted,
                        'accuracy': accuracy,
                        'support': total
                    })
    
    rules_df = pd.DataFrame(rules).sort_values('accuracy', ascending=False)
    print("\nTop rules by accuracy:")
    print(rules_df.head(20).to_string())
    
    return rules_df

def main():
    print("Starting comprehensive pattern analysis...")
    
    # Extract all features
    df = extract_all_features()
    
    # Save to CSV for inspection
    df.to_csv('session_features.csv', index=False)
    print("\n✓ Features saved to session_features.csv")
    
    # Display raw data
    print("\n" + "="*80)
    print("RAW FEATURE DATA")
    print("="*80)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_colwidth', 50)
    print(df.to_string())
    
    # Analyze patterns
    df = analyze_patterns(df)
    
    # Find discriminative rules
    rules = find_discriminative_rules(df)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)
    print("\nCheck session_features.csv for detailed feature data")

if __name__ == '__main__':
    main()
