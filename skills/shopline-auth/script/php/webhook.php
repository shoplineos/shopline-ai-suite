<?php
/**
 * webhook.php — POST /webhook/appstore/callback handler (PHP)
 *
 * Handles SHOPLINE appstore lifecycle events (install / uninstall).
 */

require_once __DIR__ . '/token_store.php';
require_once __DIR__ . '/sign.php';

const OPERATE_UNINSTALL = 'uninstall';

/**
 * Handles POST /webhook/appstore/callback.
 *
 * Steps:
 *  1. Verify the webhook signature using X-Shopline-Hmac-Sha256 header.
 *  2. Parse the request body JSON.
 *  3. Dispatch based on the "operate" field.
 *  4. On uninstall: delete cached access token and call $markUninstalled.
 *
 * @param string   $appSecret       Application secret key for signature verification
 * @param callable $markUninstalled fn(string $handle, string $appKey): void
 */
function handleWebhook(string $appSecret, callable $markUninstalled): void
{
    $raw = file_get_contents('php://input');

    // Step 1: Verify webhook signature
    $receivedSign = $_SERVER['HTTP_X_SHOPLINE_HMAC_SHA256'] ?? '';
    if (!verifyWebhookSign($appSecret, $raw, $receivedSign)) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_signature']);
        exit;
    }

    $event = json_decode($raw, true);

    if (!is_array($event) || empty($event['operate'])) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_webhook_body']);
        exit;
    }

    switch ($event['operate']) {
        case OPERATE_UNINSTALL:
            handleUninstall($event, $markUninstalled);
            break;
        default:
            // Unknown operate value: acknowledge and ignore.
            break;
    }

    http_response_code(200);
}

/**
 * Processes the uninstall event.
 *
 * Actions:
 *  1. Delete the cached access token.
 *  2. Call $markUninstalled to update the database.
 *
 * @param array    $event
 * @param callable $markUninstalled fn(string $handle, string $appKey): void
 */
function handleUninstall(array $event, callable $markUninstalled): void
{
    $handle = $event['handle'] ?? '';
    $appKey = $event['appkey'] ?? '';

    // Step 1: Remove cached access token
    TokenStore::delete(TokenStore::accessTokenKey($handle, $appKey));

    // Step 2: Update database install status to false
    //
    // TODO: Replace the call below with your real database update.
    //   Set isInstall = false for (handle, appKey) in your store_app table.
    $markUninstalled($handle, $appKey);
}
