package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_Allow(t *testing.T) {
	rl := NewRateLimiter(3, time.Minute)

	for i := 0; i < 3; i++ {
		if !rl.Allow("1.2.3.4") {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}
	if rl.Allow("1.2.3.4") {
		t.Fatal("4th request should be rejected")
	}

	// Different IP should still be allowed.
	if !rl.Allow("5.6.7.8") {
		t.Fatal("different IP should be allowed")
	}
}

func TestRateLimiter_WindowReset(t *testing.T) {
	rl := NewRateLimiter(1, 50*time.Millisecond)

	if !rl.Allow("10.0.0.1") {
		t.Fatal("first request should be allowed")
	}
	if rl.Allow("10.0.0.1") {
		t.Fatal("second request should be rejected")
	}

	time.Sleep(60 * time.Millisecond)

	if !rl.Allow("10.0.0.1") {
		t.Fatal("request after window reset should be allowed")
	}
}

func TestRateLimiter_Wrap(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)

	handler := rl.Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.RemoteAddr = "1.2.3.4:12345"
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rec.Code)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.RemoteAddr = "1.2.3.4:12345"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "60" {
		t.Fatal("expected Retry-After header")
	}
}

func TestClientIP_XForwardedFor(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.1, 10.0.0.1")
	if ip := clientIP(req); ip != "203.0.113.1" {
		t.Fatalf("expected 203.0.113.1, got %s", ip)
	}
}

func TestClientIP_XRealIP(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Real-Ip", "198.51.100.5")
	if ip := clientIP(req); ip != "198.51.100.5" {
		t.Fatalf("expected 198.51.100.5, got %s", ip)
	}
}

func TestClientIP_RemoteAddr(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.1:54321"
	if ip := clientIP(req); ip != "192.0.2.1" {
		t.Fatalf("expected 192.0.2.1, got %s", ip)
	}
}
