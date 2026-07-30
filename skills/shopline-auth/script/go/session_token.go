package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	jwtv5 "github.com/golang-jwt/jwt/v5"
)

// sessionTokenExpiry is the validity duration for a session JWT (6 hours).
const sessionTokenExpiry = 6 * time.Hour

// LoginClaims holds the custom claims stored in a session JWT.
// The signing key is derived as base64(appSecret) to match SHOPLINE's convention.
type LoginClaims struct {
	Handle  string `json:"handle"`
	StoreID int64  `json:"storeId"`
	AppName string `json:"appName"`
	jwtv5.RegisteredClaims
}

// ParseToken validates a session JWT and returns the decoded claims.
//
// The signing key is base64(appSecret), matching the convention used by GenerateSessionToken.
// Returns an error if the signature is invalid or the token has expired.
//
// Typical usage in AuthMiddleware:
//  1. Call DecodePayload to extract the appKey (aud claim) without verifying the signature.
//  2. Load the app from your database to retrieve the appSecret.
//  3. Call ParseToken with the appSecret to perform full verification.
func ParseToken(tokenString, appSecret string) (*LoginClaims, error) {
	signingKey := []byte(base64.StdEncoding.EncodeToString([]byte(appSecret)))
	token, err := jwtv5.ParseWithClaims(tokenString, &LoginClaims{}, func(t *jwtv5.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwtv5.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return signingKey, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*LoginClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}

// DecodePayload decodes the JWT payload segment without verifying the signature.
//
// Use this as the first step in JWT authentication to extract the aud (appKey) claim
// before loading the appSecret from your database for full signature verification.
// This avoids a chicken-and-egg problem: you need the appKey to find the secret,
// but you need the secret to verify the token.
func DecodePayload(tokenString string) (map[string]interface{}, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT: expected 3 segments, got %d", len(parts))
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		// Fallback: some encoders omit the URL-safe alphabet — try standard
		raw, err = base64.RawStdEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, fmt.Errorf("JWT payload base64 decode failed: %w", err)
		}
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, fmt.Errorf("JWT payload JSON unmarshal failed: %w", err)
	}
	return payload, nil
}

// GenerateSessionToken creates a signed HS256 session JWT.
//
// Claims included:
//   - handle   : store domain handle
//   - storeId  : numeric SHOPLINE store identifier
//   - appName  : application name
//   - aud      : appKey (used by middleware to look up appSecret)
//   - iat / exp: issued-at and expiry (6 h)
//
// Signing key: base64.StdEncoding(appSecret)
func GenerateSessionToken(appKey, appSecret, handle string, storeID int64, appName string) (string, error) {
	now := time.Now()
	claims := LoginClaims{
		Handle:  handle,
		StoreID: storeID,
		AppName: appName,
		RegisteredClaims: jwtv5.RegisteredClaims{
			Audience:  jwtv5.ClaimStrings{appKey},
			IssuedAt:  jwtv5.NewNumericDate(now),
			ExpiresAt: jwtv5.NewNumericDate(now.Add(sessionTokenExpiry)),
		},
	}
	token := jwtv5.NewWithClaims(jwtv5.SigningMethodHS256, claims)
	signingKey := []byte(base64.StdEncoding.EncodeToString([]byte(appSecret)))
	return token.SignedString(signingKey)
}
