package auth

import (
	"encoding/json"
	"net/http"
)

// WebhookEvent is the parsed body of a SHOPLINE appstore webhook callback.
type WebhookEvent struct {
	MerchantID   string `json:"merchant_id"`
	Name         string `json:"name"`
	Handle       string `json:"handle"`
	StoreID      string `json:"store_id"`
	Email        string `json:"email"`
	Operate      string `json:"operate"` // "uninstall" | "install" | ...
	HasExtension bool   `json:"has_extension"`
	CountryCode  string `json:"country_code"`
	Timestamp    int64  `json:"timestamp"`
	Timezone     string `json:"timezone"`
	AppKey       string `json:"appkey"`
}

// operateUninstall is the operate value sent when a merchant uninstalls the app.
const operateUninstall = "uninstall"

// HandleWebhook processes POST /webhook/appstore/callback.
//
// Steps:
//  1. Verify the webhook signature using X-Shopline-Hmac-Sha256 header.
//  2. Read and parse the raw request body.
//  3. Dispatch to the appropriate handler based on the Operate field.
//  4. On uninstall: clear the access token cache and mark the app as uninstalled.
//
// Parameters:
//   - appSecret: the app secret used to verify the webhook HMAC signature.
//   - store: the TokenStore whose entry should be removed on uninstall.
//   - markUninstalled: callback to update your database install status to false.
func HandleWebhook(
	w http.ResponseWriter,
	r *http.Request,
	appSecret string,
	store *TokenStore,
	markUninstalled func(handle string, appKey string) error,
) {
	// Step 1: Verify webhook signature
	valid, body, err := VerifyWebhookSign(appSecret, r)
	if err != nil {
		http.Error(w, `{"error":"read_body_failed"}`, http.StatusBadRequest)
		return
	}
	if !valid {
		http.Error(w, `{"error":"invalid_signature"}`, http.StatusUnauthorized)
		return
	}
	defer r.Body.Close()

	var event WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, `{"error":"invalid_webhook_body"}`, http.StatusBadRequest)
		return
	}

	switch event.Operate {
	case operateUninstall:
		handleUninstall(w, event, store, markUninstalled)
	default:
		// Unknown operate value: acknowledge receipt and do nothing.
		w.WriteHeader(http.StatusOK)
	}
}

// handleUninstall processes the uninstall webhook event.
//
// Actions performed:
//  1. Clear the cached access token for the uninstalled store.
//  2. Call the provided markUninstalled callback to update the database.
func handleUninstall(
	w http.ResponseWriter,
	event WebhookEvent,
	store *TokenStore,
	markUninstalled func(handle, appKey string) error,
) {
	// Step 1: Remove cached access token
	cacheKey := AccessTokenKey(event.Handle, event.AppKey)
	store.Delete(cacheKey)

	// Step 2: Update database install status
	//
	// TODO: Replace the no-op below with your real database update.
	//   Set isInstall = false for (handle, appKey) in your store_app table.
	if markUninstalled != nil {
		if err := markUninstalled(event.Handle, event.AppKey); err != nil {
			http.Error(w, `{"error":"uninstall_update_failed"}`, http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}
