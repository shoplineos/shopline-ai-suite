<?php
/**
 * sign.php — SHOPLINE OAuth signature utilities (PHP)
 *
 * Implements HMAC-SHA256 signing for GET (homepage/callback) and
 * POST (token create/refresh) requests, plus timestamp validation.
 */

/** Maximum allowed time drift between request timestamp and server time (ms). */
const MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Verifies the HMAC-SHA256 signature of a SHOPLINE GET request.
 *
 * Algorithm:
 *  1. Remove the "sign" key from the query parameters.
 *  2. Sort remaining keys alphabetically (ascending).
 *  3. Concatenate as "key1=value1&key2=value2...".
 *  4. Compute HMAC-SHA256(payload, appSecret) → hex string.
 *  5. Compare with the received sign using hash_equals (constant-time).
 *
 * @param string $appSecret    Application secret key
 * @param array  $query        Parsed query parameters (e.g., $_GET)
 * @param string $receivedSign The "sign" value from the request
 * @return bool
 */
function verifySign(string $appSecret, array $query, string $receivedSign): bool
{
    // Remove the "sign" parameter
    $params = array_filter($query, fn($k) => $k !== 'sign', ARRAY_FILTER_USE_KEY);

    // Sort keys alphabetically
    ksort($params);

    // Build payload string: key1=value1&key2=value2
    $pairs = [];
    foreach ($params as $k => $v) {
        $pairs[] = "{$k}={$v}";
    }
    $payload = implode('&', $pairs);

    // Compute HMAC-SHA256
    $expectedSign = hash_hmac('sha256', $payload, $appSecret);

    // Constant-time comparison
    return hash_equals($expectedSign, $receivedSign);
}

/**
 * Generates the HMAC-SHA256 signature for a SHOPLINE POST request.
 *
 * Used when calling SHOPLINE's OAuth token APIs (create / refresh).
 * source = requestBodyString + timestamp, signed with appSecret.
 *
 * @param string $body      JSON-serialized request body ('' for token refresh)
 * @param string $timestamp Unix millisecond timestamp string
 * @param string $appSecret Application secret key
 * @return string Hex-encoded HMAC-SHA256 signature
 */
function generatePostSign(string $body, string $timestamp, string $appSecret): string
{
    $source = $body . $timestamp;
    return hash_hmac('sha256', $source, $appSecret);
}

/**
 * Checks whether the given Unix-millisecond timestamp is within
 * the allowed drift window (±10 min) of the current server time.
 *
 * @param string|int $timestamp Unix timestamp in milliseconds
 * @return bool
 */
/**
 * Verifies the HMAC-SHA256 signature of a SHOPLINE webhook POST request.
 *
 * SHOPLINE sends the signature in the "X-Shopline-Hmac-Sha256" HTTP header.
 * The signature is computed as HMAC-SHA256(requestBody, appSecret), hex-encoded.
 *
 * @param string $appSecret    Application secret key
 * @param string $body         Raw request body string
 * @param string $receivedSign Value of X-Shopline-Hmac-Sha256 header
 * @return bool
 */
function verifyWebhookSign(string $appSecret, string $body, string $receivedSign): bool
{
    if (empty($receivedSign)) {
        return false;
    }
    $expectedSign = hash_hmac('sha256', $body, $appSecret);
    return hash_equals($expectedSign, $receivedSign);
}

function verifyTimestamp($timestamp): bool
{
    $ts = (int) $timestamp;
    if ($ts === 0) return false;
    $nowMs = (int) round(microtime(true) * 1000);
    return abs($nowMs - $ts) <= MAX_TIMESTAMP_DRIFT_MS;
}
