<?php
/**
 * session_token.php — Session JWT generation (PHP)
 *
 * Creates HS256 JWTs for the frontend. Requires the firebase/php-jwt package:
 *   composer require firebase/php-jwt
 */

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/** Session token validity (6 hours in seconds). */
const SESSION_EXPIRY_SECONDS = 6 * 3600;

/**
 * Generates a signed HS256 session JWT.
 *
 * Claims:
 *   - handle   : store domain handle
 *   - storeId  : numeric SHOPLINE store identifier
 *   - appName  : application name
 *   - aud      : appKey
 *   - iat / exp: issued-at and expiry (6 h)
 *
 * Signing key: base64_encode(appSecret) — matches the Go/Java convention.
 *
 * @param string $appKey
 * @param string $appSecret
 * @param string $handle
 * @param int    $storeID
 * @param string $appName
 * @return string Signed JWT string
 */
function generateSessionToken(
    string $appKey,
    string $appSecret,
    string $handle,
    int    $storeID,
    string $appName
): string {
    $now = time();
    $payload = [
        'handle'  => $handle,
        'storeId' => $storeID,
        'appName' => $appName,
        'aud'     => $appKey,
        'iat'     => $now,
        'exp'     => $now + SESSION_EXPIRY_SECONDS,
    ];
    $signingKey = base64_encode($appSecret);
    return JWT::encode($payload, $signingKey, 'HS256');
}

/**
 * Parses and verifies a session JWT.
 *
 * Use this as the second step in auth middleware after decodePayload has
 * identified the appKey and the appSecret has been loaded from your database.
 *
 * @param  string $token      JWT string from the Authorization header
 * @param  string $appSecret  Application secret used to derive the signing key
 * @return object             Decoded claims as a stdClass object
 * @throws \Exception         If the signature is invalid or the token has expired
 */
function parseToken(string $token, string $appSecret): object
{
    $signingKey = base64_encode($appSecret);
    return JWT::decode($token, new Key($signingKey, 'HS256'));
}

/**
 * Decodes the JWT payload without verifying the signature.
 *
 * Use this as the first step in auth middleware to extract the aud (appKey) claim
 * before loading the appSecret from your database for full verification.
 *
 * @param  string $token JWT string
 * @return array         Raw payload as an associative array
 * @throws \InvalidArgumentException If the token format is invalid
 */
function decodePayload(string $token): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new \InvalidArgumentException("Invalid JWT: expected 3 segments, got " . count($parts));
    }
    // JWT uses base64url encoding without padding
    $payload = base64_decode(strtr($parts[1], '-_', '+/') . str_repeat('=', (4 - strlen($parts[1]) % 4) % 4));
    $decoded = json_decode($payload, true);
    if ($decoded === null) {
        throw new \InvalidArgumentException("JWT payload JSON decode failed");
    }
    return $decoded;
}
