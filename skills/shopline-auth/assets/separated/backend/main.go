// main.go — Separated architecture backend entry point (Go)
//
// Exposes only the three required SHOPLINE OAuth endpoints.
// All signing and token exchange are performed here; the appSecret
// is NEVER sent to or accessible by the frontend.
//
// Usage:
//  1. Copy .env.example to .env and fill in your credentials.
//  2. go run main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"

	// TODO: 项目初始化后，将此 import 路径替换为您的实际模块路径。
	// 例如: auth "github.com/your-company/your-project/internal/auth"
	// After project init, replace the import path below with your actual module path.
	auth "github.com/shoplineos/shopline-ai-suite/skills/shopline-auth/script/go"
)

func main() {
	// Load .env file — Go does NOT read .env automatically
	if err := godotenv.Load(); err != nil {
		log.Println("[warn] .env file not found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	store := auth.NewTokenStore()

	mux := http.NewServeMux()

	// CORS middleware wraps all handlers (for separated architecture)
	corsOrigin := os.Getenv("CORS_ORIGIN")

	// Rate limiters — prevent abuse on public endpoints
	appLimiter := auth.NewRateLimiter(600, time.Minute)     // /app/* : 600 req/min per IP
	webhookLimiter := auth.NewRateLimiter(600, time.Minute) // /webhook/* : 600 req/min per IP

	// GET /app/homepage — entry point for the SHOPLINE OAuth flow
	mux.Handle("/app/homepage", appLimiter.Wrap(corsMiddleware(corsOrigin, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app := loadApp()
		storeApp := loadStoreApp(app, r.URL.Query().Get("handle"))
		auth.HandleHomepage(w, r, app, storeApp)
	}))))

	// GET /app/callback — receives OAuth code, exchanges for tokens
	mux.Handle("/app/callback", appLimiter.Wrap(corsMiddleware(corsOrigin, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app := loadApp()
		auth.HandleCallback(w, r, app, store,
			func(handle string, storeID int64, data auth.TokenData) error {
				// TODO: Upsert to your database
				log.Printf("[callback] persist token handle=%s storeID=%d\n", handle, storeID)
				return nil
			},
			func(handle string) (int64, error) {
				// TODO: Lookup storeID from your external service
				return 0, fmt.Errorf("getStoreID not implemented")
			},
		)
	}))))

	// POST /webhook/appstore/callback — lifecycle events (install/uninstall)
	mux.Handle("/webhook/appstore/callback", webhookLimiter.Wrap(corsMiddleware(corsOrigin, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		auth.HandleWebhook(w, r, os.Getenv("APP_SECRET"), store, func(handle, appKey string) error {
			// TODO: Update isInstall = false in your database
			log.Printf("[webhook] uninstall handle=%s appKey=%s\n", handle, appKey)
			return nil
		})
	}))))

	// Health check endpoint (no auth required)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// -------------------------------------------------------------------------
	// Business API routes — protected by AuthMiddleware
	//
	// AuthMiddleware validates the session JWT passed by the frontend in the
	// Authorization: Bearer <token> header and injects LoginInfo into context.
	//
	// TODO: Replace loadAppByKey and checkInstall with real database queries.
	// -------------------------------------------------------------------------
	loader := func(appKey string) (*auth.App, error) {
		// TODO: Query your app table: SELECT * FROM app WHERE app_key = ?
		a := loadApp()
		if a.AppKey != appKey {
			return nil, nil
		}
		return &a, nil
	}
	checker := func(handle string, appKey string) (int64, bool, error) {
		// TODO: Query your store_app table:
		//   SELECT store_id, is_install FROM store_app WHERE handle = ? AND app_key = ?
		log.Printf("[auth] checking install handle=%s appKey=%s", handle, appKey)
		return 0, false, fmt.Errorf("InstallChecker not implemented")
	}

	// Example: GET /api/orders — requires a valid session JWT
	mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, _ := auth.GetLoginInfo(r.Context())
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"handle":  info.Handle,
			"storeId": info.StoreID,
			"orders":  []string{}, // TODO: fetch real orders using GetAccessToken
		})
	})))

	log.Printf("[shopline-auth] separated backend listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

// loadApp reads app configuration from environment variables.
// TODO: Replace with a real database lookup if supporting multiple apps.
func loadApp() auth.App {
	backendURL := os.Getenv("BACKEND_URL")
	return auth.App{
		AppKey:      os.Getenv("APP_KEY"),
		AppSecret:   os.Getenv("APP_SECRET"),
		Scopes:      os.Getenv("APP_SCOPES"),
		HomeURL:     os.Getenv("FRONTEND_URL"),    // where users are redirected after auth
		CallbackURL: backendURL + "/app/callback", // OAuth callback URL for SHOPLINE
		AppName:     os.Getenv("APP_NAME"),
	}
}

// loadStoreApp retrieves the installation record for a given (app, handle) pair.
// TODO: Replace with a real database query.
func loadStoreApp(app auth.App, handle string) *auth.StoreApp {
	return nil // nil → treated as not installed
}

// corsMiddleware adds CORS headers for the specified origin.
// Required when the frontend is served from a different domain.
func corsMiddleware(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
