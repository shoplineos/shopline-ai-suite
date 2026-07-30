package auth

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// RateLimiter implements a per-IP sliding window rate limiter.
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	max      int           // max requests per window
	window   time.Duration // window duration
}

type visitor struct {
	tokens    int
	windowEnd time.Time
}

// NewRateLimiter creates a rate limiter that allows max requests per window per IP.
//
// Example:
//
//	limiter := auth.NewRateLimiter(30, time.Minute)  // 30 req/min
//	mux.Handle("/app/homepage", limiter.Wrap(handler))
func NewRateLimiter(max int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		max:      max,
		window:   window,
	}
	// Periodically clean up expired entries to prevent memory leak.
	go rl.cleanup()
	return rl
}

// Allow checks whether the given IP is within the rate limit.
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[ip]
	if !exists || now.After(v.windowEnd) {
		rl.visitors[ip] = &visitor{tokens: 1, windowEnd: now.Add(rl.window)}
		return true
	}
	if v.tokens >= rl.max {
		return false
	}
	v.tokens++
	return true
}

// Wrap returns an http.Handler that rejects requests exceeding the rate limit
// with HTTP 429 Too Many Requests.
func (rl *RateLimiter) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !rl.Allow(ip) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("Retry-After", "60")
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// clientIP extracts the client IP from X-Forwarded-For, X-Real-Ip, or RemoteAddr.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP (client IP before proxies).
		if i := len(xff); i > 0 {
			for j := 0; j < len(xff); j++ {
				if xff[j] == ',' {
					return xff[:j]
				}
			}
			return xff
		}
	}
	if xri := r.Header.Get("X-Real-Ip"); xri != "" {
		return xri
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// cleanup removes expired visitor entries every 2× the window duration.
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.window * 2)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, v := range rl.visitors {
			if now.After(v.windowEnd) {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}
