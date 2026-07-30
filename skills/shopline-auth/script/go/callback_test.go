package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	jwtv5 "github.com/golang-jwt/jwt/v5"
)

// =============================================================================
// extractStoreIDFromJWT tests
// =============================================================================

// makeTestJWT creates a minimal signed JWT that includes the given storeId claim.
func makeTestJWT(storeID string) string {
	claims := jwtv5.MapClaims{
		"storeId": storeID,
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwtv5.NewWithClaims(jwtv5.SigningMethodHS256, claims)
	// Use an arbitrary secret — we only need the token structure, not verified trust.
	signed, _ := token.SignedString([]byte("test-signing-key"))
	return signed
}

func TestExtractStoreIDFromJWT_ValidToken(t *testing.T) {
	jwt := makeTestJWT("12345")
	id, err := extractStoreIDFromJWT(jwt)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if id != 12345 {
		t.Fatalf("expected storeId=12345, got %d", id)
	}
}

func TestExtractStoreIDFromJWT_InvalidFormat(t *testing.T) {
	_, err := extractStoreIDFromJWT("not.a.jwt.with.wrong.parts")
	if err == nil {
		t.Fatal("expected error for malformed JWT (>3 segments)")
	}
}

func TestExtractStoreIDFromJWT_TwoPartToken(t *testing.T) {
	_, err := extractStoreIDFromJWT("header.payload")
	if err == nil {
		t.Fatal("expected error for JWT with only 2 segments")
	}
}

func TestExtractStoreIDFromJWT_MissingStoreIDClaim(t *testing.T) {
	// Build a JWT payload without storeId.
	payload := base64.RawURLEncoding.EncodeToString([]byte(`{"sub":"user"}`))
	token := "header." + payload + ".sig"
	_, err := extractStoreIDFromJWT(token)
	if err == nil {
		t.Fatal("expected error when storeId claim is missing")
	}
}

func TestExtractStoreIDFromJWT_InvalidStoreID(t *testing.T) {
	// storeId is not a valid int64 string.
	payload := base64.RawURLEncoding.EncodeToString([]byte(`{"storeId":"not-a-number"}`))
	token := "header." + payload + ".sig"
	_, err := extractStoreIDFromJWT(token)
	if err == nil {
		t.Fatal("expected error for non-numeric storeId")
	}
}

// =============================================================================
// ExchangeToken tests (with mock HTTP transport)
// =============================================================================

// mockTransport intercepts all HTTP calls and routes them through an in-process handler.
type mockTransport struct {
	handler http.Handler
}

func (m *mockTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	rec := httptest.NewRecorder()
	m.handler.ServeHTTP(rec, req)
	return rec.Result(), nil
}

func withMockHTTP(handler http.Handler, fn func()) {
	orig := shoplineHTTPClient
	shoplineHTTPClient = &http.Client{Transport: &mockTransport{handler}}
	defer func() { shoplineHTTPClient = orig }()
	fn()
}

// makeStoreJWT builds an access token whose payload contains storeId.
func makeStoreJWT(storeID string) string {
	return makeTestJWT(storeID)
}

func TestExchangeToken_Success(t *testing.T) {
	accessToken := makeStoreJWT("99")
	respBody, _ := json.Marshal(TokenResponse{
		Code:    200,
		Message: "ok",
		Data: &TokenData{
			AccessToken:       accessToken,
			ExpireTime:        time.Now().Add(time.Hour).Format(time.RFC3339),
			Scope:             "read_orders",
			RefreshToken:      "refresh-xyz",
			RefreshExpireTime: time.Now().Add(30 * 24 * time.Hour).Format(time.RFC3339),
		},
	})

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(respBody)
	})

	withMockHTTP(handler, func() {
		data, err := ExchangeToken("mystore", "myapp", "mysecret", "auth-code-123")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if data.AccessToken != accessToken {
			t.Errorf("unexpected access token: %q", data.AccessToken)
		}
		if data.RefreshToken != "refresh-xyz" {
			t.Errorf("unexpected refresh token: %q", data.RefreshToken)
		}
	})
}

func TestExchangeToken_APIError(t *testing.T) {
	respBody, _ := json.Marshal(TokenResponse{Code: 401, Message: "unauthorized"})
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(respBody)
	})
	withMockHTTP(handler, func() {
		_, err := ExchangeToken("mystore", "myapp", "mysecret", "bad-code")
		if err == nil {
			t.Fatal("expected error for API 401 response")
		}
	})
}

func TestExchangeToken_MalformedResponse(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("not json"))
	})
	withMockHTTP(handler, func() {
		_, err := ExchangeToken("mystore", "myapp", "mysecret", "code")
		if err == nil {
			t.Fatal("expected error for malformed JSON response")
		}
	})
}

// =============================================================================
// HandleCallback tests
// =============================================================================

func buildCallbackParams(appSecret string) url.Values {
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"mystore"},
		"code":      {"auth-code"},
		"timestamp": {fmt.Sprintf("%d", time.Now().UnixMilli())},
		"lang":      {"en"},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), appSecret))
	return params
}

func TestHandleCallback_BadSignature_Returns401(t *testing.T) {
	app := makeApp()
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"mystore"},
		"code":      {"auth-code"},
		"timestamp": {fmt.Sprintf("%d", time.Now().UnixMilli())},
		"sign":      {"badsign"},
	}
	req := httptest.NewRequest(http.MethodGet, "/app/callback?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleCallback(rec, req, app, NewTokenStore(), nil, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("bad sign: expected 401, got %d", rec.Code)
	}
}

func TestHandleCallback_ExpiredTimestamp_Returns401(t *testing.T) {
	app := makeApp()
	oldTS := fmt.Sprintf("%d", time.Now().Add(-20*time.Minute).UnixMilli())
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"mystore"},
		"code":      {"auth-code"},
		"timestamp": {oldTS},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), app.AppSecret))
	req := httptest.NewRequest(http.MethodGet, "/app/callback?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleCallback(rec, req, app, NewTokenStore(), nil, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expired ts: expected 401, got %d", rec.Code)
	}
}

func TestHandleCallback_SuccessfulFlow_Redirects(t *testing.T) {
	app := makeApp()
	storeJWT := makeStoreJWT("77")
	tokenResp, _ := json.Marshal(TokenResponse{
		Code: 200,
		Data: &TokenData{
			AccessToken:  storeJWT,
			RefreshToken: "rtoken",
			ExpireTime:   time.Now().Add(time.Hour).Format(time.RFC3339),
		},
	})

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(tokenResp)
	})

	params := buildCallbackParams(app.AppSecret)
	persistCalled := false

	withMockHTTP(handler, func() {
		req := httptest.NewRequest(http.MethodGet, "/app/callback?"+params.Encode(), nil)
		rec := httptest.NewRecorder()

		HandleCallback(rec, req, app, NewTokenStore(),
			func(handle string, storeID int64, data TokenData) error {
				persistCalled = true
				if strings.TrimSpace(handle) != "mystore" {
					t.Errorf("unexpected handle: %q", handle)
				}
				return nil
			},
			nil,
		)

		if rec.Code != http.StatusFound {
			t.Fatalf("expected 302 redirect, got %d — body: %s", rec.Code, rec.Body.String())
		}
		if !persistCalled {
			t.Fatal("persistRefreshToken callback must be called")
		}
		loc := rec.Header().Get("Location")
		if !strings.Contains(loc, app.HomeURL) {
			t.Fatalf("redirect should point to homeURL, got: %s", loc)
		}
	})
}
