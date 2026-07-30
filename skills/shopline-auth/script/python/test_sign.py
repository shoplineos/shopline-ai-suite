"""
test_sign.py — Unit tests for SHOPLINE signature utilities (Python)

Run with:
  python -m pytest test_sign.py -v
  # or
  python test_sign.py

Covers:
  - verify_sign: valid signature, wrong secret, tampered param, sign field excluded
  - verify_timestamp: current time, 9 min ago, 11 min ago (rejected), invalid format
  - generate_post_sign: deterministic, empty body, different secrets/timestamps
"""

import hashlib
import hmac as hmac_module
import json
import time
import unittest

from sign import generate_post_sign, verify_sign, verify_timestamp


# =============================================================================
# Helpers
# =============================================================================

def compute_hmac(payload: str, secret: str) -> str:
    """Compute HMAC-SHA256 for building expected signatures in tests."""
    return hmac_module.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def build_payload(query: dict) -> str:
    """Build sorted k=v&k=v payload string (without 'sign')."""
    params = {k: v for k, v in query.items() if k != "sign"}
    return "&".join(f"{k}={params[k]}" for k in sorted(params))


# =============================================================================
# verifySign tests
# =============================================================================

class TestVerifySign(unittest.TestCase):

    def setUp(self):
        self.query = {
            "appkey":    "myapp",
            "handle":    "test-store.myshopline.com",
            "timestamp": "1712100000000",
        }
        self.secret = "test-secret"
        self.sign = compute_hmac(build_payload(self.query), self.secret)

    def test_valid_signature_passes(self):
        q = {**self.query, "sign": self.sign}
        self.assertTrue(verify_sign(self.secret, q, self.sign))

    def test_wrong_secret_rejected(self):
        q = {**self.query, "sign": self.sign}
        self.assertFalse(verify_sign("wrong-secret", q, self.sign))

    def test_tampered_param_rejected(self):
        q = {**self.query, "handle": "evil.myshopline.com", "sign": self.sign}
        self.assertFalse(verify_sign(self.secret, q, self.sign))

    def test_sign_field_excluded_from_payload(self):
        # "sign" must never be included in the payload before hashing
        q = {"appkey": "myapp", "sign": "random-value"}
        expected = compute_hmac("appkey=myapp", self.secret)
        self.assertTrue(verify_sign(self.secret, q, expected))


# =============================================================================
# verify_timestamp tests
# =============================================================================

class TestVerifyTimestamp(unittest.TestCase):

    def test_current_time_passes(self):
        ts = str(int(time.time() * 1000))
        self.assertTrue(verify_timestamp(ts))

    def test_nine_minutes_ago_passes(self):
        ts = str(int((time.time() - 9 * 60) * 1000))
        self.assertTrue(verify_timestamp(ts))

    def test_eleven_minutes_ago_rejected(self):
        ts = str(int((time.time() - 11 * 60) * 1000))
        self.assertFalse(verify_timestamp(ts))

    def test_eleven_minutes_future_rejected(self):
        ts = str(int((time.time() + 11 * 60) * 1000))
        self.assertFalse(verify_timestamp(ts))

    def test_non_numeric_rejected(self):
        self.assertFalse(verify_timestamp("not-a-number"))

    def test_empty_string_rejected(self):
        self.assertFalse(verify_timestamp(""))


# =============================================================================
# generate_post_sign tests
# =============================================================================

class TestGeneratePostSign(unittest.TestCase):

    def setUp(self):
        self.body      = json.dumps({"code": "abc123"}, separators=(",", ":"))
        self.timestamp = "1712100000000"
        self.secret    = "test-secret"

    def test_deterministic(self):
        s1 = generate_post_sign(self.body, self.timestamp, self.secret)
        s2 = generate_post_sign(self.body, self.timestamp, self.secret)
        self.assertEqual(s1, s2)

    def test_empty_body_returns_nonempty_hex(self):
        sign = generate_post_sign("", self.timestamp, self.secret)
        self.assertGreater(len(sign), 0)

    def test_different_secrets_produce_different_signatures(self):
        s1 = generate_post_sign(self.body, self.timestamp, "secret-a")
        s2 = generate_post_sign(self.body, self.timestamp, "secret-b")
        self.assertNotEqual(s1, s2)

    def test_different_timestamps_produce_different_signatures(self):
        s1 = generate_post_sign(self.body, "1000000000000", self.secret)
        s2 = generate_post_sign(self.body, "9999999999999", self.secret)
        self.assertNotEqual(s1, s2)


# =============================================================================

if __name__ == "__main__":
    unittest.main(verbosity=2)
