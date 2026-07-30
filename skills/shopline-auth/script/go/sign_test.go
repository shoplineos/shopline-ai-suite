package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"testing"
	"time"
)

// =============================================================================
// VerifySign tests
// =============================================================================

func TestVerifySign_ValidSignature(t *testing.T) {
	appSecret := "test-secret"
	params := url.Values{
		"appkey":    []string{"myapp"},
		"handle":    []string{"test-store.myshopline.com"},
		"timestamp": []string{"1712100000000"},
	}
	// Payload: sorted keys joined as k=v&k=v (sign excluded)
	payload := "appkey=myapp&handle=test-store.myshopline.com&timestamp=1712100000000"
	sign := hmacSHA256Hex(payload, appSecret)
	params.Set("sign", sign)

	if !VerifySign(appSecret, params, sign) {
		t.Fatal("expected valid signature to pass")
	}
}

func TestVerifySign_WrongSecret(t *testing.T) {
	params := url.Values{
		"appkey":    []string{"myapp"},
		"handle":    []string{"test-store.myshopline.com"},
		"timestamp": []string{"1712100000000"},
	}
	correctSign := hmacSHA256Hex(
		"appkey=myapp&handle=test-store.myshopline.com&timestamp=1712100000000",
		"correct-secret",
	)
	params.Set("sign", correctSign)

	if VerifySign("wrong-secret", params, correctSign) {
		t.Fatal("wrong secret must be rejected")
	}
}

func TestVerifySign_TamperedParam(t *testing.T) {
	appSecret := "test-secret"
	params := url.Values{
		"appkey":    []string{"myapp"},
		"handle":    []string{"test-store.myshopline.com"},
		"timestamp": []string{"1712100000000"},
	}
	sign := hmacSHA256Hex(
		"appkey=myapp&handle=test-store.myshopline.com&timestamp=1712100000000",
		appSecret,
	)
	params.Set("sign", sign)

	// Tamper with a parameter after signing
	params.Set("handle", "evil-store.myshopline.com")

	if VerifySign(appSecret, params, sign) {
		t.Fatal("tampered parameter must be rejected")
	}
}

func TestVerifySign_SignFieldExcluded(t *testing.T) {
	// The "sign" field itself must never be included in the payload.
	appSecret := "test-secret"
	params := url.Values{
		"appkey": []string{"myapp"},
		"sign":   []string{"some-random-value"},
	}
	expectedSign := hmacSHA256Hex("appkey=myapp", appSecret)

	if !VerifySign(appSecret, params, expectedSign) {
		t.Fatal("sign field should be excluded from payload before hashing")
	}
}

// =============================================================================
// VerifyTimestamp tests
// =============================================================================

func TestVerifyTimestamp_Now(t *testing.T) {
	ts := msStr(time.Now())
	if !VerifyTimestamp(ts) {
		t.Fatalf("current timestamp %s must pass", ts)
	}
}

func TestVerifyTimestamp_NineMinutesAgo(t *testing.T) {
	ts := msStr(time.Now().Add(-9 * time.Minute))
	if !VerifyTimestamp(ts) {
		t.Fatal("timestamp 9 min ago must be within the 10-min window")
	}
}

func TestVerifyTimestamp_ElevenMinutesAgo_Rejected(t *testing.T) {
	ts := msStr(time.Now().Add(-11 * time.Minute))
	if VerifyTimestamp(ts) {
		t.Fatal("timestamp 11 min ago must be rejected")
	}
}

func TestVerifyTimestamp_ElevenMinutesFuture_Rejected(t *testing.T) {
	ts := msStr(time.Now().Add(11 * time.Minute))
	if VerifyTimestamp(ts) {
		t.Fatal("timestamp 11 min in the future must be rejected")
	}
}

func TestVerifyTimestamp_InvalidFormat(t *testing.T) {
	cases := []string{"not-a-number", "", "abc123", "3.14"}
	for _, c := range cases {
		if VerifyTimestamp(c) {
			t.Fatalf("invalid timestamp %q must be rejected", c)
		}
	}
}

// =============================================================================
// GeneratePostSign tests
// =============================================================================

func TestGeneratePostSign_Deterministic(t *testing.T) {
	s1 := GeneratePostSign(`{"code":"abc123"}`, "1712100000000", "test-secret")
	s2 := GeneratePostSign(`{"code":"abc123"}`, "1712100000000", "test-secret")
	if s1 != s2 {
		t.Fatal("GeneratePostSign must be deterministic")
	}
}

func TestGeneratePostSign_EmptyBody(t *testing.T) {
	// Token refresh uses an empty body — must not panic and must return non-empty hex
	sign := GeneratePostSign("", "1712100000000", "test-secret")
	if sign == "" {
		t.Fatal("GeneratePostSign with empty body must return a non-empty hex string")
	}
}

func TestGeneratePostSign_DifferentSecrets(t *testing.T) {
	s1 := GeneratePostSign(`{"code":"abc"}`, "1712100000000", "secret-a")
	s2 := GeneratePostSign(`{"code":"abc"}`, "1712100000000", "secret-b")
	if s1 == s2 {
		t.Fatal("different secrets must produce different signatures")
	}
}

func TestGeneratePostSign_DifferentTimestamps(t *testing.T) {
	s1 := GeneratePostSign(`{"code":"abc"}`, "1000000000000", "secret")
	s2 := GeneratePostSign(`{"code":"abc"}`, "9999999999999", "secret")
	if s1 == s2 {
		t.Fatal("different timestamps must produce different signatures")
	}
}

// =============================================================================
// helper
// =============================================================================

// msStr formats t as a Unix millisecond timestamp string.
func msStr(t time.Time) string {
	return fmt.Sprintf("%d", t.UnixMilli())
}

// hmacSHA256Hex computes HMAC-SHA256(payload, secret) and returns the hex-encoded result.
func hmacSHA256Hex(payload, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
