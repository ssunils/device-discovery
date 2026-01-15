import unittest
from ml.os_detector_ml import extract_features

class TestExtractFeaturesPendingPreKey(unittest.TestCase):
    def make_session(self, pending_values):
        # Build a session object with multiple session entries
        sessions = {}
        for i, p in enumerate(pending_values):
            sessions[f'sess{i}'] = {
                'indexInfo': {'closed': -1},
                '_chains': {'a': {}},
                'pendingPreKey': p
            }
        return {'_sessions': sessions}

    def test_numeric_pending(self):
        s = self.make_session([3, 0, 2])
        feats = extract_features(s)
        total = feats[14]
        avg = feats[15]
        ratio = feats[16]
        self.assertEqual(total, 5.0)
        self.assertAlmostEqual(avg, 5.0/3)
        self.assertAlmostEqual(ratio, 2.0/3)

    def test_dict_pending(self):
        s = self.make_session([{'signedKeyId': 1}, {}, 0])
        feats = extract_features(s)
        total = feats[14]
        avg = feats[15]
        ratio = feats[16]
        # dicts should be counted as 1 each, so total = 2
        self.assertEqual(total, 2.0)
        self.assertAlmostEqual(avg, 2.0/3)
        self.assertAlmostEqual(ratio, 2.0/3)

    def test_list_pending(self):
        s = self.make_session([[1,2,3], [], [1]])
        feats = extract_features(s)
        total = feats[14]
        avg = feats[15]
        ratio = feats[16]
        # lengths: 3,0,1 -> total 4
        self.assertEqual(total, 4.0)
        self.assertAlmostEqual(avg, 4.0/3)
        self.assertAlmostEqual(ratio, 2.0/3)

    def test_missing_pending(self):
        # no pendingPreKey field present
        sessions = {'_sessions': {
            's1': {'indexInfo': {'closed': -1}, '_chains': {'a': {}}},
            's2': {'indexInfo': {'closed': -1}, '_chains': {'b': {}}}
        }}
        feats = extract_features(sessions)
        total = feats[14]
        avg = feats[15]
        ratio = feats[16]
        self.assertEqual(total, 0.0)
        self.assertEqual(avg, 0.0)
        self.assertEqual(ratio, 0.0)

if __name__ == '__main__':
    unittest.main()
