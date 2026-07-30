<?php
/**
 * middleware.php — JWT session auth middleware (PHP)
 *
 * Validates the session JWT passed by the frontend in the Authorization header
 * and makes the login context (handle, storeID, appKey, ...) available to handlers.
 *
 * Authentication steps (matching protocol.md §3):
 *  1. Extract the Bearer token from the Authorization header.
 *  2. Decode payload without verification to read the aud (appKey) claim.
 *  3. Load the app via $appLoader to obtain the appSecret.
 *  4. Fully verify the JWT signature and expiry via parseToken.
 *  5. Verify the store–app installation via $installChecker.
 *  6. Return the LoginInfo array for use in your handler.
 *
 * Usage — call at the top of any protected endpoint:
 *
 *   require_once __DIR__ . '/middleware.php';
 *   require_once __DIR__ . '/session_token.php';
 *
 *   $loginInfo = requireAuth(
 *       fn($appKey) => $db->fetchApp($appKey),           // AppLoader
 *       fn($handle, $appKey) => $db->fetchStoreApp($handle, $appKey)  // InstallChecker
 *   );
 *   // $loginInfo['handle'], ['storeID'], ['appKey'], etc.
 */

require_once __DIR__ . '/session_token.php';

/**
 * Validates the session JWT and returns the authenticated login context.
 * Sends a 401 JSON response and exits on any failure.
 *
 * @param  callable $appLoader
 *   fn(string $appKey): array|null
 *   Load the app record (keys: appKey, appSecret, appName) or return null if not found.
 *
 * @param  callable $installChecker
 *   fn(string $handle, string $appKey): array|null
 *   Load the store_app record (keys: storeID, isInstall) or return null if not found.
 *
 * @return array LoginInfo: ['handle', 'storeID', 'appKey', 'appName']
 */
function requireAuth(callable $appLoader, callable $installChecker): array
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $tokenString = '';
    if ($authHeader !== '') {
        $tokenString = str_starts_with($authHeader, 'Bearer ')
            ? substr($authHeader, 7)
            : $authHeader;
    } elseif (!empty($_COOKIE['session_token'])) {
        $tokenString = $_COOKIE['session_token'];
    }
    if ($tokenString === '') {
        authError('missing Authorization header or session_token cookie');
    }

    // Step 2: Decode payload without verification to extract appKey (aud claim)
    try {
        $payload = decodePayload($tokenString);
    } catch (\Throwable) {
        authError('invalid token format');
    }

    $appKey = getAppKey($payload);
    if ($appKey === null) {
        authError('token missing aud claim');
    }

    // Step 3: Load app to obtain appSecret
    try {
        $app = $appLoader($appKey);
    } catch (\Throwable $e) {
        error_log('[auth] failed to load app: ' . $e->getMessage());
        authError('failed to load app');
    }
    if ($app === null) {
        authError('app not found');
    }

    // Step 4: Full signature + expiry verification
    try {
        $claims = parseToken($tokenString, $app['appSecret']);
    } catch (\Throwable) {
        authError('invalid or expired token');
    }

    // Step 5: Verify store–app installation
    try {
        $storeApp = $installChecker($claims->handle, $app['appKey']);
    } catch (\Throwable $e) {
        error_log('[auth] failed to check installation: ' . $e->getMessage());
        authError('failed to check installation');
    }
    if ($storeApp === null || !$storeApp['isInstall'] || empty($storeApp['storeID'])) {
        authError('app not installed');
    }

    return [
        'handle'  => $claims->handle,
        'storeID' => $storeApp['storeID'],
        'appKey'  => $app['appKey'],
        'appName' => $app['appName'],
    ];
}

/**
 * Extracts the appKey from the aud claim of a decoded JWT payload.
 * aud can be a string or an array.
 *
 * @param  array $payload Decoded JWT payload
 * @return string|null
 */
function getAppKey(array $payload): ?string
{
    $aud = $payload['aud'] ?? null;
    if (is_string($aud)) return $aud;
    if (is_array($aud) && !empty($aud)) return (string) $aud[0];
    return null;
}

/**
 * Sends a 401 JSON error response and exits.
 *
 * @param string $message
 */
function authError(string $message): never
{
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'code' => 'AUTH_FAILED', 'message' => $message]);
    exit;
}
