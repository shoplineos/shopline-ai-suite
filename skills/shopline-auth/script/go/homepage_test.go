package auth

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
	"time"
)

// sortedPayload replicates the signing payload logic from sign.go for test helpers.
func sortedPayload(params url.Values) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		if k != "sign" {
			keys = append(keys, k)
		}
	}
	// Simple insertion sort (test helper, not performance-critical).
	for i := 1; i < len(keys); i++ {
		for j := i; j > 0 && keys[j] < keys[j-1]; j-- {
			keys[j], keys[j-1] = keys[j-1], keys[j]
		}
	}
	var sb string
	for i, k := range keys {
		if i > 0 {
			sb += "&"
		}
		sb += k + "=" + params.Get(k)
	}
	return sb
}

func nowMS() string {
	return strconv.FormatInt(time.Now().UnixMilli(), 10)
}

func makeApp() App {
	return App{
		AppKey:    "testapp",
		AppSecret: "test-secret",
		Scopes:    "read_orders,write_orders",
		HomeURL:   "my-app.example.com",
		AppName:   "TestApp",
	}
}

// =============================================================================
// HandleHomepage tests
// =============================================================================

func TestHandleHomepage_BadSignature(t *testing.T) {
	app := makeApp()
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"store.myshopline.com"},
		"timestamp": {nowMS()},
		"sign":      {"badsign"},
	}
	req := httptest.NewRequest(http.MethodGet, "/app/homepage?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleHomepage(rec, req, app, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("bad signature: expected 401, got %d", rec.Code)
	}
}

func TestHandleHomepage_ExpiredTimestamp(t *testing.T) {
	app := makeApp()
	oldTS := strconv.FormatInt(time.Now().Add(-20*time.Minute).UnixMilli(), 10)
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"store.myshopline.com"},
		"timestamp": {oldTS},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), app.AppSecret))
	req := httptest.NewRequest(http.MethodGet, "/app/homepage?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleHomepage(rec, req, app, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expired timestamp: expected 401, got %d", rec.Code)
	}
}

func TestHandleHomepage_InstalledRedirectsHome(t *testing.T) {
	app := makeApp()
	storeApp := &StoreApp{
		StoreID:   42,
		Handle:    "store.myshopline.com",
		Scopes:    "read_orders,write_orders",
		IsInstall: true,
	}
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"store.myshopline.com"},
		"timestamp": {nowMS()},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), app.AppSecret))
	req := httptest.NewRequest(http.MethodGet, "/app/homepage?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleHomepage(rec, req, app, storeApp)
	if rec.Code != http.StatusFound {
		t.Fatalf("installed: expected 302 redirect, got %d", rec.Code)
	}
	loc := rec.Header().Get("Location")
	if loc == "" {
		t.Fatal("expected Location header on redirect")
	}
}

func TestHandleHomepage_NotInstalled_Embedded_RedirectsWithUninstalled(t *testing.T) {
	app := makeApp()
	params := url.Values{
		"appkey":    {"testapp"},
		"handle":    {"store.myshopline.com"},
		"lang":      {"en,zh-CN"},
		"timestamp": {nowMS()},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), app.AppSecret))
	req := httptest.NewRequest(http.MethodGet, "/app/homepage?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleHomepage(rec, req, app, nil) // nil storeApp = not installed
	if rec.Code != http.StatusFound {
		t.Fatalf("not installed+embedded: expected 302 redirect, got %d", rec.Code)
	}
	loc := rec.Header().Get("Location")
	if loc == "" {
		t.Fatal("expected Location header")
	}
	parsed, _ := url.Parse(loc)
	if parsed.Query().Get("uninstalled") != "true" {
		t.Fatalf("expected uninstalled=true in redirect URL, got: %s", loc)
	}
}

func TestHandleHomepage_NotInstalled_External_RedirectsToOAuth(t *testing.T) {
	app := makeApp()
	params := url.Values{
		"appkey": {"testapp"},
		"handle": {"store.myshopline.com"},
		// No "lang" param → external app
		"timestamp": {nowMS()},
	}
	params.Set("sign", hmacSHA256Hex(sortedPayload(params), app.AppSecret))
	req := httptest.NewRequest(http.MethodGet, "/app/homepage?"+params.Encode(), nil)
	rec := httptest.NewRecorder()
	HandleHomepage(rec, req, app, nil)
	if rec.Code != http.StatusFound {
		t.Fatalf("not installed+external: expected 302 redirect, got %d", rec.Code)
	}
	loc := rec.Header().Get("Location")
	if loc == "" {
		t.Fatal("expected Location header")
	}
	// Should redirect to the SHOPLINE OAuth authorize page.
	parsed, _ := url.Parse(loc)
	if parsed.Path != "/admin/oauth/authorize" {
		t.Fatalf("expected OAuth authorize path, got: %s", parsed.Path)
	}
}

// =============================================================================
// firstLang tests
// =============================================================================

func TestFirstLang_SingleValue(t *testing.T) {
	if got := firstLang("en"); got != "en" {
		t.Fatalf("expected en, got %q", got)
	}
}

func TestFirstLang_CommaSeparated_ReturnsSecond(t *testing.T) {
	// SHOPLINE sends "en,zh-CN"; we prefer the second (locale-specific) value.
	if got := firstLang("en,zh-CN"); got != "zh-CN" {
		t.Fatalf("expected zh-CN, got %q", got)
	}
}

func TestFirstLang_WithSpaces(t *testing.T) {
	if got := firstLang("en , zh-CN"); got != "zh-CN" {
		t.Fatalf("expected zh-CN, got %q", got)
	}
}
