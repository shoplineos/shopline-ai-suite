<?php
/**
 * callback.php — GET /app/callback handler (PHP)
 *
 * Exchanges the OAuth code for tokens, persists the installation, and
 * redirects the merchant to the app home page.
 */

require_once __DIR__ . '/sign.php';
require_once __DIR__ . '/token_store.php';
require_once __DIR__ . '/session_token.php';
require_once __DIR__ . '/homepage.php'; // provides buildAppHomeURL()

/**
 * Handles GET /app/callback.
 *
 * Steps:
 *  1. Verify HMAC-SHA256 query signature.
 *  2. Verify request timestamp (±10 min).
 *  3. Exchange the authorization code for tokens.
 *  4. Extract storeID from the access token JWT payload.
 *  5. Persist the refresh token (database callback).
 *  6. Cache the access token (90% of remaining TTL).
 *  7. Generate a session JWT and redirect to the app home page.
 *
 * @param array    $app                 App config: appKey, appSecret, scopes, homeURL, appName, id
 * @param callable $persistRefreshToken fn(string $handle, int $storeID, array $tokenData): void
 */
function handleCallback(array $app, callable $persistRefreshToken): void
{
    $q         = $_GET;
    $handle    = trim($q['handle']    ?? '');
    $code      = $q['code']      ?? '';
    $lang      = $q['lang']      ?? '';
    $timestamp = $q['timestamp'] ?? '';
    $sign      = $q['sign']      ?? '';

    // Step 1: Verify signature
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

    // Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
    if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]*$/', $handle)) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_handle_format']);
        exit;
    }

    // Step 3: Exchange authorization code for tokens
    $tokenData = exchangeToken($handle, $app['appKey'], $app['appSecret'], $code);
    if ($tokenData === null) {
        http_response_code(502);
        echo json_encode(['error' => 'oauth_code_exchange_failed']);
        exit;
    }

    // Step 4: Extract storeID from JWT payload
    $storeID = extractStoreID($tokenData['accessToken']);
    if ($storeID === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'store_id_resolution_failed']);
        exit;
    }

    // Step 5: Persist refresh token to database
    //
    // TODO: Replace the callback below with your real DB upsert.
    //   Required fields: storeID, handle, appKey, refreshToken, expireTime, scopes, isInstall=true
    $persistRefreshToken($handle, $storeID, $tokenData);

    // Step 6: Cache access token (90% of remaining TTL)
    $ttlMs = TokenStore::computeTTL($tokenData['expireTime']);
    if ($ttlMs > 0) {
        TokenStore::set(
            TokenStore::accessTokenKey($handle, $app['appKey']),
            $tokenData['accessToken'],
            $ttlMs
        );
    }

    // Step 7: Generate session token and redirect.
    // embedded/lang are inferred from the lang query param in the callback request.
    $sessionToken = generateSessionToken(
        $app['appKey'],
        $app['appSecret'],
        $handle,
        $storeID,
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

/**
 * Calls SHOPLINE's token create API to exchange an OAuth code for tokens.
 *
 * @param string $handle
 * @param string $appKey
 * @param string $appSecret
 * @param string $code
 * @return array|null TokenData array, or null on failure
 */
function exchangeToken(string $handle, string $appKey, string $appSecret, string $code): ?array
{
    $body      = json_encode(['code' => $code]);
    $timestamp = (string) (int) round(microtime(true) * 1000);
    $sign      = generatePostSign($body, $timestamp, $appSecret);
    $url       = "https://{$handle}.myshopline.com/admin/oauth/token/create";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "appkey: {$appKey}",
            "timestamp: {$timestamp}",
            "sign: {$sign}",
        ],
    ]);
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        error_log("[callback] curl error: $curlError");
        return null;
    }

    $data = json_decode($response, true);
    if (($data['code'] ?? 0) !== 200 || empty($data['data'])) {
        return null;
    }
    return $data['data'];
}

/**
 * Decodes the SHOPLINE access token JWT payload to extract the storeId.
 *
 * @param string $accessToken JWT string
 * @return int Numeric store ID, or 0 on failure
 */
function extractStoreID(string $accessToken): int
{
    $parts = explode('.', $accessToken);
    if (count($parts) !== 3) return 0;
    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    return (int) ($payload['storeId'] ?? 0);
}
