package auth

import (
	"encoding/base64"
	"strings"
	"testing"

	jwtv5 "github.com/golang-jwt/jwt/v5"
)

func TestGenerateSessionToken_ReturnsValidJWT(t *testing.T) {
	token, err := GenerateSessionToken("appkey1", "my-secret", "store.myshopline.com", 42, "MyApp")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// JWT must have three dot-separated segments.
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("expected 3 JWT segments, got %d", len(parts))
	}
}

func TestGenerateSessionToken_ClaimsAreCorrect(t *testing.T) {
	appKey, appSecret := "appkey1", "my-secret"
	handle := "store.myshopline.com"
	var storeID int64 = 42
	appName := "MyApp"

	tokenStr, err := GenerateSessionToken(appKey, appSecret, handle, storeID, appName)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	signingKey := []byte(base64.StdEncoding.EncodeToString([]byte(appSecret)))
	claims := &LoginClaims{}
	_, err = jwtv5.ParseWithClaims(tokenStr, claims, func(t *jwtv5.Token) (interface{}, error) {
		return signingKey, nil
	}, jwtv5.WithAudience(appKey))
	if err != nil {
		t.Fatalf("JWT parse/verify failed: %v", err)
	}

	if claims.Handle != handle {
		t.Errorf("handle: expected %q, got %q", handle, claims.Handle)
	}
	if claims.StoreID != storeID {
		t.Errorf("storeId: expected %d, got %d", storeID, claims.StoreID)
	}
	if claims.AppName != appName {
		t.Errorf("appName: expected %q, got %q", appName, claims.AppName)
	}
}

func TestGenerateSessionToken_DifferentSecretsDifferentTokens(t *testing.T) {
	t1, _ := GenerateSessionToken("appkey", "secret-a", "store.myshopline.com", 1, "App")
	t2, _ := GenerateSessionToken("appkey", "secret-b", "store.myshopline.com", 1, "App")
	if t1 == t2 {
		t.Fatal("tokens signed with different secrets must differ")
	}
}
