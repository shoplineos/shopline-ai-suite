<?php
/**
 * sign_test.php — Unit tests for SHOPLINE signature utilities (PHP)
 *
 * Run with: php sign_test.php
 *
 * Covers:
 *   - verifySign: valid signature, wrong secret, tampered param, sign field excluded
 *   - verifyTimestamp: current time, 9 min ago, 11 min ago (rejected), invalid format
 *   - generatePostSign: deterministic, empty body, different secrets/timestamps
 */

require_once __DIR__ . '/sign.php';

$passed = 0;
$failed = 0;

/**
 * Simple test runner helper.
 *
 * @param string $name    Test description
 * @param bool   $result  Assertion result
 */
function test(string $name, bool $result): void
{
    global $passed, $failed;
    if ($result) {
        echo "  ✅ {$name}\n";
        $passed++;
    } else {
        echo "  ❌ FAIL: {$name}\n";
        $failed++;
    }
}

// Helper: compute HMAC-SHA256 directly for building expected values
function hmac(string $payload, string $secret): string
{
    return hash_hmac('sha256', $payload, $secret);
}

// Helper: build sorted k=v&k=v payload (without "sign")
function buildPayload(array $query): string
{
    $params = array_filter($query, fn($k) => $k !== 'sign', ARRAY_FILTER_USE_KEY);
    ksort($params);
    return implode('&', array_map(fn($k, $v) => "{$k}={$v}", array_keys($params), $params));
}

// =============================================================================
echo "\n[verifySign]\n";

$query = ['appkey' => 'myapp', 'handle' => 'test-store.myshopline.com', 'timestamp' => '1712100000000'];
$sign  = hmac(buildPayload($query), 'test-secret');

test('valid signature must pass',
    verifySign('test-secret', array_merge($query, ['sign' => $sign]), $sign));

test('wrong secret must be rejected',
    !verifySign('wrong-secret', array_merge($query, ['sign' => $sign]), $sign));

$tampered = array_merge($query, ['handle' => 'evil.myshopline.com', 'sign' => $sign]);
test('tampered parameter must be rejected',
    !verifySign('test-secret', $tampered, $sign));

$expectedSign = hmac('appkey=myapp', 'test-secret');
test('"sign" field must be excluded from payload',
    verifySign('test-secret', ['appkey' => 'myapp', 'sign' => 'random-value'], $expectedSign));

// =============================================================================
echo "\n[verifyTimestamp]\n";

$nowMs = (int) round(microtime(true) * 1000);

test('current timestamp must pass',       verifyTimestamp((string) $nowMs));
test('9 min ago must pass',               verifyTimestamp((string) ($nowMs - 9 * 60 * 1000)));
test('11 min ago must be rejected',       !verifyTimestamp((string) ($nowMs - 11 * 60 * 1000)));
test('11 min future must be rejected',    !verifyTimestamp((string) ($nowMs + 11 * 60 * 1000)));
test('non-numeric must be rejected',      !verifyTimestamp('not-a-number'));
test('empty string must be rejected',     !verifyTimestamp(''));

// =============================================================================
echo "\n[generatePostSign]\n";

$body      = json_encode(['code' => 'abc123']);
$timestamp = '1712100000000';
$secret    = 'test-secret';

test('deterministic output',
    generatePostSign($body, $timestamp, $secret) === generatePostSign($body, $timestamp, $secret));

$emptySign = generatePostSign('', $timestamp, $secret);
test('empty body returns non-empty hex', strlen($emptySign) > 0);

test('different secrets produce different signatures',
    generatePostSign($body, $timestamp, 'secret-a') !== generatePostSign($body, $timestamp, 'secret-b'));

test('different timestamps produce different signatures',
    generatePostSign($body, '1000000000000', $secret) !== generatePostSign($body, '9999999999999', $secret));

// =============================================================================
echo "\n";
echo "Results: {$passed} passed, {$failed} failed\n";
exit($failed > 0 ? 1 : 0);
