package auth

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// handlePattern validates that a handle contains only characters safe for subdomain construction.
// Allowed: alphanumeric and hyphens; must start with an alphanumeric character.
var handlePattern = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9-]*$`)

// CallbackRequest holds the parsed query parameters from GET /app/callback.
type CallbackRequest struct {
	AppKey    string
	Code      string // OAuth authorization code issued by SHOPLINE
	Handle    string
	Timestamp string
	Sign      string
	Lang      string
}

// TokenResponse is the JSON body returned by SHOPLINE's token create/refresh APIs.
type TokenResponse struct {
	Code    int        `json:"code"`
	Message string     `json:"message"`
	Data    *TokenData `json:"data"`
}

// TokenData holds the token fields returned by SHOPLINE.
type TokenData struct {
	AccessToken       string `json:"accessToken"`
	ExpireTime        string `json:"expireTime"` // format: "2006-01-02T15:04:05.000Z"
	Scope             string `json:"scope"`
	RefreshToken      string `json:"refreshToken"`
	RefreshExpireTime string `json:"refreshExpireTime"`
}

// HandleCallback processes GET /app/callback.
//
// Steps:
//  1. Verify HMAC-SHA256 query signature.
//  2. Verify request timestamp (±10 min).
//  3. Exchange the authorization code for access + refresh tokens.
//  4. Persist the refresh token (update your database here).
//  5. Cache the access token (90% of its remaining TTL).
//  6. Generate a session JWT and redirect the user to the app home page.
//
// Parameters:
//   - store: the TokenStore used to cache the access token.
//   - persistRefreshToken: callback to save the refresh token to your database.
//   - getStoreID: callback to resolve the numeric store ID from a handle.
func HandleCallback(
	w http.ResponseWriter,
	r *http.Request,
	app App,
	store *TokenStore,
	persistRefreshToken func(handle string, storeID int64, data TokenData) error,
	getStoreID func(handle string) (int64, error),
) {
	q := r.URL.Query()
	req := CallbackRequest{
		AppKey:    q.Get("appkey"),
		Code:      q.Get("code"),
		Handle:    strings.TrimSpace(q.Get("handle")),
		Timestamp: q.Get("timestamp"),
		Sign:      q.Get("sign"),
		Lang:      q.Get("lang"),
	}

	// Step 1: Verify query signature
	if !VerifySign(app.AppSecret, q, req.Sign) {
		http.Error(w, `{"error":"signature_verification_failed"}`, http.StatusUnauthorized)
		return
	}

	// Step 2: Verify timestamp
	if !VerifyTimestamp(req.Timestamp) {
		http.Error(w, `{"error":"timestamp_expired"}`, http.StatusUnauthorized)
		return
	}

	// Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
	if !handlePattern.MatchString(req.Handle) {
		http.Error(w, `{"error":"invalid_handle_format"}`, http.StatusBadRequest)
		return
	}

	// Step 3: Exchange authorization code for tokens
	tokenData, err := ExchangeToken(req.Handle, app.AppKey, app.AppSecret, req.Code)
	if err != nil {
		http.Error(w, `{"error":"oauth_code_exchange_failed"}`, http.StatusBadGateway)
		return
	}

	// Step 4: Resolve store ID from the access token JWT payload
	storeID, err := extractStoreIDFromJWT(tokenData.AccessToken)
	if err != nil || storeID == 0 {
		// Fallback: resolve via external lookup
		if getStoreID != nil {
			storeID, err = getStoreID(req.Handle)
		}
		if err != nil || storeID == 0 {
			http.Error(w, `{"error":"store_id_resolution_failed"}`, http.StatusInternalServerError)
			return
		}
	}

	// Step 5: Persist refresh token to your database
	//
	// TODO: Replace the no-op below with your real database upsert.
	//   Required fields: storeID, handle, appKey, refreshToken, expireTime, scopes, isInstall=true
	if persistRefreshToken != nil {
		if err := persistRefreshToken(req.Handle, storeID, *tokenData); err != nil {
			http.Error(w, `{"error":"persist_token_failed"}`, http.StatusInternalServerError)
			return
		}
	}

	// Step 6: Cache access token (TTL = 90% of remaining lifetime)
	expiry, _ := time.Parse(time.RFC3339, tokenData.ExpireTime)
	ttl := ComputeTTL(expiry)
	if ttl > 0 {
		store.Set(AccessTokenKey(req.Handle, app.AppKey), tokenData.AccessToken, ttl)
	}

	// Step 7: Generate session token and redirect to app home.
	// embedded/lang parameters are determined by whether this is an embedded or external app,
	// inferred from the presence of the lang query parameter in the callback request.
	sessionToken, _ := GenerateSessionToken(
		app.AppKey, app.AppSecret, req.Handle, storeID, app.AppName,
	)
	redirectURL := buildAppHomeURL(app.HomeURL, app.AppKey, req.Handle, req.Lang)
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		MaxAge:   6 * 60 * 60, // 6 hours, matching session JWT TTL
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

// shoplineHTTPClient is a dedicated HTTP client with a 10-second timeout
// to prevent requests from hanging indefinitely if SHOPLINE's API is slow.
var shoplineHTTPClient = &http.Client{Timeout: 10 * time.Second}

// ExchangeToken calls SHOPLINE's token create API to exchange an OAuth code for tokens.
//
// POST https://{handle}.myshopline.com/admin/oauth/token/create
// Headers: appkey, timestamp, sign (HMAC-SHA256 of body+timestamp)
// Body:    {"code": "<authorization_code>"}
func ExchangeToken(handle, appKey, appSecret, code string) (*TokenData, error) {
	reqBody, _ := json.Marshal(map[string]string{"code": code})
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sign := GeneratePostSign(string(reqBody), timestamp, appSecret)

	reqURL := fmt.Sprintf("https://%s.myshopline.com/admin/oauth/token/create", handle)
	httpReq, _ := http.NewRequest(http.MethodPost, reqURL, bytes.NewReader(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("appkey", appKey)
	httpReq.Header.Set("timestamp", timestamp)
	httpReq.Header.Set("sign", sign)

	resp, err := shoplineHTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("ExchangeToken HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("ExchangeToken unmarshal failed: %w", err)
	}
	if tokenResp.Code != 200 || tokenResp.Data == nil {
		return nil, fmt.Errorf("ExchangeToken API error: code=%d message=%s", tokenResp.Code, tokenResp.Message)
	}
	return tokenResp.Data, nil
}

// extractStoreIDFromJWT decodes the SHOPLINE access token JWT payload (without
// signature verification) to extract the numeric storeId claim.
func extractStoreIDFromJWT(accessToken string) (int64, error) {
	parts := strings.Split(accessToken, ".")
	if len(parts) != 3 {
		return 0, fmt.Errorf("invalid JWT format")
	}
	payload, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil {
		// Try RawURLEncoding as fallback
		payload, err = base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return 0, fmt.Errorf("JWT payload decode failed: %w", err)
		}
	}
	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return 0, fmt.Errorf("JWT claims unmarshal failed: %w", err)
	}
	storeIDStr, ok := claims["storeId"].(string)
	if !ok {
		return 0, fmt.Errorf("storeId claim missing or not a string")
	}
	return strconv.ParseInt(storeIDStr, 10, 64)
}

// RefreshToken calls SHOPLINE's token refresh API to get a new access token.
//
// POST https://{handle}.myshopline.com/admin/oauth/token/refresh
// Headers: appkey, timestamp, sign (HMAC-SHA256 of ""+timestamp = HMAC of timestamp)
// Body:    (empty)
func RefreshToken(handle, appKey, appSecret string) (*TokenData, error) {
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sign := GeneratePostSign("", timestamp, appSecret) // empty body

	reqURL := fmt.Sprintf("https://%s.myshopline.com/admin/oauth/token/refresh", handle)
	httpReq, _ := http.NewRequest(http.MethodPost, reqURL, http.NoBody)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("appkey", appKey)
	httpReq.Header.Set("timestamp", timestamp)
	httpReq.Header.Set("sign", sign)

	resp, err := shoplineHTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("RefreshToken HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("RefreshToken unmarshal failed: %w", err)
	}
	if tokenResp.Code != 200 || tokenResp.Data == nil {
		return nil, fmt.Errorf("RefreshToken API error: code=%d message=%s", tokenResp.Code, tokenResp.Message)
	}
	return tokenResp.Data, nil
}

// GetAccessTokenWithStorage returns a valid access token using the provided
// TokenStorage and TokenFetcher. See token_store.go for the full contract.
//
// Example — call SHOPLINE refresh API on miss:
//
//	token, err := GetAccessTokenWithStorage(
//	    AccessTokenKey(handle, appKey),
//	    myStorage,
//	    func() (string, time.Time, error) {
//	        data, err := RefreshToken(handle, appKey, appSecret)
//	        if err != nil { return "", time.Time{}, err }
//	        expiry, _ := time.Parse(time.RFC3339, data.ExpireTime)
//	        return data.AccessToken, expiry, nil
//	    },
//	)
func GetAccessTokenWithStorage(key string, storage TokenStorage, fetch TokenFetcher) (string, error) {
	return GetAccessToken(key, storage, fetch)
}
