package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testAppSecret = "test-webhook-secret"

func newStore(handle, appKey, token string) *TokenStore {
	s := NewTokenStore()
	s.Set(AccessTokenKey(handle, appKey), token, time.Minute)
	return s
}

// signBody computes the HMAC-SHA256 hex signature for the given body and secret.
func signBody(body, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	return hex.EncodeToString(mac.Sum(nil))
}

// newSignedRequest creates an httptest request with a valid X-Shopline-Hmac-Sha256 header.
func newSignedRequest(body, secret string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/webhook/appstore/callback", strings.NewReader(body))
	req.Header.Set("X-Shopline-Hmac-Sha256", signBody(body, secret))
	return req
}

// =============================================================================
// Signature verification tests
// =============================================================================

func TestHandleWebhook_MissingSignature_Returns401(t *testing.T) {
	store := NewTokenStore()
	body := `{"handle":"mystore","appkey":"myapp","operate":"uninstall"}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/appstore/callback", strings.NewReader(body))
	// No X-Shopline-Hmac-Sha256 header
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("missing signature: expected 401, got %d", rec.Code)
	}
}

func TestHandleWebhook_InvalidSignature_Returns401(t *testing.T) {
	store := NewTokenStore()
	body := `{"handle":"mystore","appkey":"myapp","operate":"uninstall"}`
	req := httptest.NewRequest(http.MethodPost, "/webhook/appstore/callback", strings.NewReader(body))
	req.Header.Set("X-Shopline-Hmac-Sha256", "invalid-signature-value")
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("invalid signature: expected 401, got %d", rec.Code)
	}
}

func TestHandleWebhook_WrongSecret_Returns401(t *testing.T) {
	store := NewTokenStore()
	body := `{"handle":"mystore","appkey":"myapp","operate":"uninstall"}`
	req := newSignedRequest(body, "wrong-secret")
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("wrong secret: expected 401, got %d", rec.Code)
	}
}

// =============================================================================
// HandleWebhook tests (with valid signature)
// =============================================================================

func TestHandleWebhook_UninstallClearsTokenAndCallsMarkFn(t *testing.T) {
	store := newStore("mystore", "myapp", "tok")
	markCalled := false

	body := `{"handle":"mystore","appkey":"myapp","operate":"uninstall"}`
	req := newSignedRequest(body, testAppSecret)
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, func(handle, appKey string) error {
		markCalled = true
		if handle != "mystore" || appKey != "myapp" {
			t.Errorf("unexpected args: handle=%q appKey=%q", handle, appKey)
		}
		return nil
	})

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if !markCalled {
		t.Fatal("markUninstalled callback must be called")
	}
	_, ok := store.Get(AccessTokenKey("mystore", "myapp"))
	if ok {
		t.Fatal("access token must be removed from cache after uninstall")
	}
}

func TestHandleWebhook_UninstallMarkFnError_Returns500(t *testing.T) {
	store := NewTokenStore()
	body := `{"handle":"mystore","appkey":"myapp","operate":"uninstall"}`
	req := newSignedRequest(body, testAppSecret)
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, func(handle, appKey string) error {
		return errors.New("db error")
	})

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when markUninstalled fails, got %d", rec.Code)
	}
}

func TestHandleWebhook_UnknownOperate_Returns200(t *testing.T) {
	store := NewTokenStore()
	body := `{"handle":"mystore","appkey":"myapp","operate":"some_future_event"}`
	req := newSignedRequest(body, testAppSecret)
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("unknown operate: expected 200 acknowledgement, got %d", rec.Code)
	}
}

func TestHandleWebhook_InvalidJSON_Returns400(t *testing.T) {
	store := NewTokenStore()
	body := "not json"
	req := newSignedRequest(body, testAppSecret)
	rec := httptest.NewRecorder()

	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("invalid JSON: expected 400, got %d", rec.Code)
	}
}

func TestHandleWebhook_NilMarkFn_DoesNotPanic(t *testing.T) {
	store := newStore("s", "a", "tok")
	body := `{"handle":"s","appkey":"a","operate":"uninstall"}`
	req := newSignedRequest(body, testAppSecret)
	rec := httptest.NewRecorder()

	// markUninstalled = nil should be handled gracefully.
	HandleWebhook(rec, req, testAppSecret, store, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("nil mark fn: expected 200, got %d", rec.Code)
	}
}
