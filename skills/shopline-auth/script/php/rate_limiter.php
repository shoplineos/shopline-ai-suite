<?php
/**
 * rate_limiter.php — Per-IP rate limiter (PHP)
 *
 * Provides a simple file-based fixed-window rate limiter.
 * Default: 600 requests per minute per IP.
 *
 * Usage:
 *   require_once __DIR__ . '/rate_limiter.php';
 *   checkRateLimit();  // exits with 429 if exceeded
 */

/**
 * Checks the rate limit for the current client IP.
 * Responds with HTTP 429 and exits if the limit is exceeded.
 *
 * Uses a temporary file per IP for persistence across requests.
 * For production, replace with Redis or Memcached.
 *
 * @param int $maxRequests Maximum requests per window (default: 600)
 * @param int $windowSeconds Window duration in seconds (default: 60)
 */
function checkRateLimit(int $maxRequests = 600, int $windowSeconds = 60): void
{
    $ip = clientIP();
    $key = 'rate_' . md5($ip);
    $file = sys_get_temp_dir() . '/' . $key . '.json';

    $now = time();
    $data = null;

    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $data = json_decode($raw, true);
    }

    if ($data === null || $now >= ($data['windowEnd'] ?? 0)) {
        $data = ['count' => 1, 'windowEnd' => $now + $windowSeconds];
        file_put_contents($file, json_encode($data), LOCK_EX);
        return;
    }

    if ($data['count'] >= $maxRequests) {
        http_response_code(429);
        header('Retry-After: ' . $windowSeconds);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'rate_limit_exceeded']);
        exit;
    }

    $data['count']++;
    file_put_contents($file, json_encode($data), LOCK_EX);
}

/**
 * Extracts client IP from X-Forwarded-For, X-Real-Ip, or REMOTE_ADDR.
 */
function clientIP(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}
