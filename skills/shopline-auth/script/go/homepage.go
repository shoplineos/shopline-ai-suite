package auth

import (
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
)

// HomepageRequest holds the parsed query parameters from GET /app/homepage.
type HomepageRequest struct {
	AppKey    string
	Handle    string
	Lang      string // present for embedded apps; absent for external apps
	Timestamp string
	Sign      string
}

// App holds the minimum configuration required by the authorization flow.
// Load this from your database using the appKey from the query string.
type App struct {
	AppKey      string
	AppSecret   string
	Scopes      string // comma-separated permission scopes, e.g. "read_orders,write_orders"
	HomeURL     string // full URL where users are redirected after auth, e.g. "http://localhost:3000" or "https://my-app.example.com"
	CallbackURL string // full OAuth callback URL that SHOPLINE redirects to, e.g. "https://xxx.trycloudflare.com/app/callback"
	AppName     string
}

// StoreApp represents the installation record for a store–app pair.
// Load this from your database using (appKey, handle).
type StoreApp struct {
	StoreID      int64
	Handle       string
	Scopes       string // comma-separated scopes granted at installation time
	RefreshToken string
	IsInstall    bool
}

// HandleHomepage processes GET /app/homepage.
//
// Decision tree:
//  1. Verify HMAC-SHA256 query signature.
//  2. Verify request timestamp (±10 min).
//     3a. Already installed & scopes match → redirect to app home + sessionToken.
//     3b. Not installed + lang present (embedded app) → redirect to app home with
//     uninstalled=true so the frontend can navigate to the OAuth page.
//     3c. Not installed + lang absent (external app) → redirect directly to the
//     SHOPLINE OAuth authorization page.
func HandleHomepage(w http.ResponseWriter, r *http.Request, app App, storeApp *StoreApp) {
	q := r.URL.Query()
	req := HomepageRequest{
		AppKey:    q.Get("appkey"),
		Handle:    strings.TrimSpace(q.Get("handle")),
		Lang:      q.Get("lang"),
		Timestamp: q.Get("timestamp"),
		Sign:      q.Get("sign"),
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

	// Step 3: Determine redirect target based on installation state.
	// Scope check uses strict equality: if the app's required scopes differ from
	// what was granted at install time (e.g. after a scope upgrade), re-authorization
	// is triggered even if the store was previously installed.
	installed := storeApp != nil && storeApp.IsInstall &&
		scopesEqual(storeApp.Scopes, app.Scopes)

	callbackURL := app.CallbackURL

	if installed {
		// 3a. Already installed: generate a session token and redirect to app home.
		sessionToken, err := GenerateSessionToken(
			app.AppKey, app.AppSecret, req.Handle,
			storeApp.StoreID, app.AppName,
		)
		redirectURL := buildAppHomeURL(app.HomeURL, app.AppKey, req.Handle, req.Lang)
		if err == nil {
			http.SetCookie(w, &http.Cookie{
				Name:     "session_token",
				Value:    sessionToken,
				Path:     "/",
				MaxAge:   6 * 60 * 60, // 6 hours, matching session JWT TTL
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteLaxMode,
			})
		}
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	if req.Lang != "" {
		// 3b. Embedded app, not installed: redirect to app home with uninstalled=true
		// so the frontend can use App Bridge toAdminPage(ADMIN_SECTION.OAUTH) to navigate
		// the entire Admin shell to the OAuth authorization page.
		langCode := firstLang(req.Lang)
		redirectURL := fmt.Sprintf(
			"%s?appkey=%s&handle=%s&embedded=1&lang=%s&uninstalled=true&scope=%s&redirectUri=%s",
			app.HomeURL,
			url.QueryEscape(app.AppKey),
			url.QueryEscape(req.Handle),
			url.QueryEscape(langCode),
			url.QueryEscape(app.Scopes),
			url.QueryEscape(callbackURL),
		)
		if host := q.Get("host"); host != "" {
			redirectURL += "&host=" + url.QueryEscape(host)
		}
		http.Redirect(w, r, redirectURL, http.StatusFound)
		return
	}

	// 3c. External app, not installed: redirect directly to SHOPLINE OAuth page.
	oauthURL := fmt.Sprintf(
		"https://%s.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=%s&responseType=code&scope=%s&redirectUri=%s",
		req.Handle,
		app.AppKey,
		url.QueryEscape(app.Scopes),
		url.QueryEscape(callbackURL),
	)
	http.Redirect(w, r, oauthURL, http.StatusFound)
}

// scopesEqual returns true when the installed scope set exactly matches the required set.
//
// Strict equality is intentional: if the app's required scopes have changed (e.g. a new
// permission was added), the store must re-authorize even if all old scopes are still present.
// Both inputs are comma-separated strings; order is ignored.
func scopesEqual(installed, required string) bool {
	parse := func(s string) []string {
		parts := strings.Split(s, ",")
		out := make([]string, 0, len(parts))
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				out = append(out, p)
			}
		}
		sort.Strings(out)
		return out
	}
	a, b := parse(installed), parse(required)
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// buildAppHomeURL constructs the redirect URL for the app home page.
//
// Rules:
//   - lang present (embedded app) → embedded=1&isFromAppListPage=1&lang=<code>
//   - lang absent  (external app) → embedded=0&isFromAppListPage=1
func buildAppHomeURL(homeURL, appKey, handle, lang string) string {
	base := fmt.Sprintf("%s?appkey=%s&handle=%s", homeURL, url.QueryEscape(appKey), url.QueryEscape(handle))
	if lang != "" {
		return base + "&embedded=1&isFromAppListPage=1&lang=" + url.QueryEscape(firstLang(lang))
	}
	return base + "&embedded=0&isFromAppListPage=1"
}

// firstLang returns the second language code when the lang field is comma-separated,
// or the single value otherwise. SHOPLINE sends "en,zh-CN" for bilingual setups.
func firstLang(lang string) string {
	parts := strings.SplitN(lang, ",", 2)
	if len(parts) == 2 {
		return strings.TrimSpace(parts[1])
	}
	return strings.TrimSpace(parts[0])
}
