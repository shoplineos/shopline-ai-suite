package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

// =============================================================================
// Types
// =============================================================================

// contextKey is an unexported type for context keys in this package.
type contextKey string

const loginKey contextKey = "appLoginInfo"

// LoginInfo holds the authenticated session context injected by AuthMiddleware.
// Retrieve it in your handlers via GetLoginInfo(r.Context()).
type LoginInfo struct {
	Handle  string
	StoreID int64
	AppKey  string
	AppName string
}

// =============================================================================
// Callbacks — implement these with real database queries
// =============================================================================

// AppLoader loads an App record by its appKey.
// Implement this to query your app table.
//
// Example:
//
//	func(appKey string) (*auth.App, error) {
//	    var a App
//	    err := db.QueryRow(
//	        "SELECT id, app_key, app_secret, scopes, home_url, app_name FROM app WHERE app_key = ?",
//	        appKey,
//	    ).Scan(&a.ID, &a.AppKey, &a.AppSecret, &a.Scopes, &a.HomeURL, &a.AppName)
//	    if err == sql.ErrNoRows { return nil, nil }
//	    return &a, err
//	}
type AppLoader func(appKey string) (*App, error)

// InstallChecker verifies that a store has the app installed and returns its storeID.
// Implement this to query your store_app table.
//
// Example:
//
//	func(handle string, appKey string) (int64, bool, error) {
//	    var storeID int64
//	    var isInstall bool
//	    err := db.QueryRow(
//	        "SELECT store_id, is_install FROM store_app WHERE handle = ? AND app_key = ?",
//	        handle, appKey,
//	    ).Scan(&storeID, &isInstall)
//	    if err == sql.ErrNoRows { return 0, false, nil }
//	    return storeID, isInstall, err
//	}
type InstallChecker func(handle string, appKey string) (storeID int64, installed bool, err error)

// =============================================================================
// AuthMiddleware
// =============================================================================

// AuthMiddleware returns an http.Handler middleware that validates session JWTs
// and injects LoginInfo into the request context.
//
// Authentication steps (matching protocol.md §3):
//  1. Extract the Bearer token from the Authorization header.
//  2. Decode the JWT payload without signature verification to read the aud (appKey) claim.
//  3. Load the app via AppLoader to obtain the appSecret.
//  4. Fully verify the JWT signature and expiry using ParseToken.
//  5. Verify the store–app installation status via InstallChecker.
//  6. Inject LoginInfo into context; call next handler.
//
// Usage — wrap individual routes or a route group:
//
//	loader  := func(appKey string) (*auth.App, error) { /* DB query */ }
//	checker := func(handle string, appKey string) (int64, bool, error) { /* DB query */ }
//
//	mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker, http.HandlerFunc(ordersHandler)))
func AuthMiddleware(loader AppLoader, checker InstallChecker, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, err := authenticateRequest(r, loader, checker)
		if err != nil {
			writeAuthError(w, err.Error())
			return
		}
		ctx := context.WithValue(r.Context(), loginKey, info)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// authenticateRequest performs the full JWT authentication flow.
func authenticateRequest(r *http.Request, loader AppLoader, checker InstallChecker) (LoginInfo, error) {
	// Step 1: Extract token from Authorization header or session_token cookie
	tokenString := ""
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	} else if cookie, err := r.Cookie("session_token"); err == nil && cookie.Value != "" {
		tokenString = cookie.Value
	}
	if tokenString == "" {
		return LoginInfo{}, fmt.Errorf("missing Authorization header or session_token cookie")
	}

	// Step 2: Decode payload without signature check to extract appKey
	payload, err := DecodePayload(tokenString)
	if err != nil {
		return LoginInfo{}, fmt.Errorf("invalid token format")
	}
	appKey := appKeyFromClaims(payload)
	if appKey == "" {
		return LoginInfo{}, fmt.Errorf("token missing aud claim")
	}

	// Step 3: Load app to obtain appSecret
	app, err := loader(appKey)
	if err != nil {
		log.Printf("[auth] failed to load app: %v", err)
		return LoginInfo{}, fmt.Errorf("failed to load app")
	}
	if app == nil {
		return LoginInfo{}, fmt.Errorf("app not found")
	}

	// Step 4: Full signature + expiry verification
	claims, err := ParseToken(tokenString, app.AppSecret)
	if err != nil {
		return LoginInfo{}, fmt.Errorf("invalid or expired token")
	}

	// Step 5: Verify store–app installation
	storeID, installed, err := checker(claims.Handle, app.AppKey)
	if err != nil {
		log.Printf("[auth] failed to check installation: %v", err)
		return LoginInfo{}, fmt.Errorf("failed to check installation")
	}
	if !installed || storeID == 0 {
		return LoginInfo{}, fmt.Errorf("app not installed")
	}

	return LoginInfo{
		Handle:  claims.Handle,
		StoreID: storeID,
		AppKey:  app.AppKey,
		AppName: app.AppName,
	}, nil
}

// =============================================================================
// Context helpers — use these in your business handlers
// =============================================================================

// GetLoginInfo retrieves the authenticated LoginInfo from the request context.
// Returns (LoginInfo{}, false) if the middleware was not applied to the current route.
func GetLoginInfo(ctx context.Context) (LoginInfo, bool) {
	info, ok := ctx.Value(loginKey).(LoginInfo)
	return info, ok
}

// GetHandle returns the store handle from the authenticated request context.
// Returns "" if the middleware was not applied.
func GetHandle(ctx context.Context) string {
	info, _ := ctx.Value(loginKey).(LoginInfo)
	return info.Handle
}

// GetStoreID returns the numeric store ID from the authenticated request context.
// Returns 0 if the middleware was not applied.
func GetStoreID(ctx context.Context) int64 {
	info, _ := ctx.Value(loginKey).(LoginInfo)
	return info.StoreID
}

// GetAppKey returns the appKey from the authenticated request context.
func GetAppKey(ctx context.Context) string {
	info, _ := ctx.Value(loginKey).(LoginInfo)
	return info.AppKey
}

// =============================================================================
// Internal helpers
// =============================================================================

// appKeyFromClaims extracts the appKey from the aud claim of a decoded JWT payload.
// Session tokens generated by GenerateSessionToken use appKey as the audience.
// The aud claim can be a string or a JSON array — both are handled.
func appKeyFromClaims(payload map[string]interface{}) string {
	switch v := payload["aud"].(type) {
	case string:
		return v
	case []interface{}:
		if len(v) > 0 {
			if s, ok := v[0].(string); ok {
				return s
			}
		}
	}
	return ""
}

// writeAuthError writes a structured JSON 401 response.
func writeAuthError(w http.ResponseWriter, message string) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"code":    "AUTH_FAILED",
		"message": message,
	})
}
