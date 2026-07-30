<?php
/**
 * homepage.php — GET /app/homepage handler (PHP)
 *
 * Entry point for the SHOPLINE OAuth authorization flow.
 */

require_once __DIR__ . '/sign.php';
require_once __DIR__ . '/session_token.php';

/**
 * Handles GET /app/homepage.
 *
 * Decision tree:
 *  1. Verify HMAC-SHA256 query signature.
 *  2. Verify request timestamp (±10 min).
 *  3a. Already installed & scopes match → redirect to app home + sessionToken.
 *  3b. Not installed + lang present (embedded app) → redirect to app home with uninstalled=true.
 *  3c. Not installed + lang absent (external app) → redirect to SHOPLINE OAuth page.
 *
 * @param array      $app      Application config keys: appKey, appSecret, scopes, homeURL, callbackURL, appName, id
 *                             homeURL: full URL of the frontend (e.g. "http://localhost:3000")
 *                             callbackURL: full URL of the backend callback endpoint (e.g. "https://xxx.trycloudflare.com/app/callback")
 * @param array|null $storeApp Installation record: storeID, scopes, isInstall, refreshToken
 *                             Pass null if the store has never installed the app.
 */
function handleHomepage(array $app, ?array $storeApp): void
{
    $q         = $_GET;
    $appKey    = $q['appkey']    ?? '';
    $handle    = trim($q['handle']    ?? '');
    $lang      = $q['lang']      ?? '';
    $timestamp = $q['timestamp'] ?? '';
    $sign      = $q['sign']      ?? '';

    // Step 1: Verify query signature
    if (!verifySign($app['appSecret'], $q, $sign)) {
        http_response_code(401);
        echo json_encode(['error' => 'signature_verification_failed']);
        exit;
    }

    // Step 2: Verify timestamp
    if (!verifyTimestamp($timestamp)) {
        http_response_code(401);
        echo json_encode(['error' => 'timestamp_expired']);
        exit;
    }

    // Scope check uses strict equality: if required scopes have changed, re-authorization
    // is triggered even for previously installed stores.
    $installed = $storeApp !== null
        && $storeApp['isInstall']
        && scopesEqual($storeApp['scopes'], $app['scopes']);

    $callbackURL = $app['callbackURL'];

    if ($installed) {
        // 3a. Already installed: generate session token and redirect to app home.
        $sessionToken = generateSessionToken(
            $app['appKey'],
            $app['appSecret'],
            $handle,
            $storeApp['storeID'],
            $app['appName']
        );
        $redirectURL = buildAppHomeURL($app['homeURL'], $app['appKey'], $handle, $lang);
        setcookie('session_token', $sessionToken, [
            'expires'  => time() + 6 * 60 * 60, // 6 hours, matching session JWT TTL
            'path'     => '/',
            'secure'   => true,
            'httponly'  => true,
            'samesite' => 'Lax',
        ]);
        header("Location: {$redirectURL}", true, 302);
        exit;
    }

    if ($lang !== '') {
        // 3b. Embedded app, not installed: redirect to app home with uninstalled=true.
        // Frontend uses App Bridge toAdminPage(ADMIN_SECTION.OAUTH) to navigate.
        $langCode    = firstLang($lang);
        $redirectURL = "{$app['homeURL']}"
            . "?appkey=" . urlencode($app['appKey'])
            . "&handle=" . urlencode($handle)
            . "&embedded=1"
            . "&lang=" . urlencode($langCode)
            . "&uninstalled=true"
            . "&scope=" . urlencode($app['scopes'])
            . "&redirectUri=" . urlencode($callbackURL);
        $host = $_GET['host'] ?? '';
        if ($host !== '') {
            $redirectURL .= "&host=" . urlencode($host);
        }
        header("Location: {$redirectURL}", true, 302);
        exit;
    }

    // 3c. External app, not installed: redirect to SHOPLINE OAuth page.
    $oauthURL = "https://{$handle}.myshopline.com/admin/oauth-web/#/oauth/authorize"
        . "?appKey={$app['appKey']}"
        . "&responseType=code"
        . "&scope=" . urlencode($app['scopes'])
        . "&redirectUri=" . urlencode($callbackURL);
    header("Location: {$oauthURL}", true, 302);
    exit;
}

/**
 * Returns true when the installed scope set exactly matches the required set.
 *
 * Strict equality is intentional: if required scopes change (e.g. a new permission
 * is added), the store must re-authorize even if all old scopes are still present.
 */
function scopesEqual(string $installed, string $required): bool
{
    $parse = static function (string $s): array {
        $parts = array_filter(array_map('trim', explode(',', $s)));
        sort($parts);
        return array_values($parts);
    };
    return $parse($installed) === $parse($required);
}

/**
 * Builds the redirect URL for the app home page.
 *
 * Rules:
 *   - lang present (embedded app) → embedded=1&isFromAppListPage=1&lang=<code>
 *   - lang absent  (external app) → embedded=0&isFromAppListPage=1
 */
function buildAppHomeURL(string $homeURL, string $appKey, string $handle, string $lang): string
{
    $base = "{$homeURL}?appkey=" . urlencode($appKey) . "&handle=" . urlencode($handle);
    if ($lang !== '') {
        return $base . '&embedded=1&isFromAppListPage=1&lang=' . urlencode(firstLang($lang));
    }
    return $base . '&embedded=0&isFromAppListPage=1';
}

/** Returns the second language code from a comma-separated lang string, or the single value. */
function firstLang(string $lang): string
{
    $parts = explode(',', $lang, 2);
    return isset($parts[1]) ? trim($parts[1]) : trim($parts[0]);
}
