/**
 * sign.test.js — Unit tests for SHOPLINE signature utilities (Node.js)
 *
 * Run with: node --test sign.test.js
 * Or with Jest: npx jest sign.test.js
 *
 * Covers:
 *   - verifySign: valid signature, wrong secret, tampered param, sign field excluded
 *   - verifyTimestamp: current time, 9 min ago, 11 min ago (rejected), invalid format
 *   - generatePostSign: deterministic, empty body, different secrets/timestamps
 */

const { strict: assert } = require('assert');
const crypto = require('crypto');
const { verifySign, generatePostSign, verifyTimestamp } = require('./sign');

// =============================================================================
// Helpers
// =============================================================================

/** Compute HMAC-SHA256 the same way sign.js does, for building expected values. */
function hmac(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Build the sorted k=v&k=v payload string (without "sign"). */
function buildPayload(query) {
  return Object.keys(query)
    .filter(k => k !== 'sign')
    .sort()
    .map(k => `${k}=${query[k]}`)
    .join('&');
}

// =============================================================================
// verifySign tests
// =============================================================================

{
  const query = { appkey: 'myapp', handle: 'test-store.myshopline.com', timestamp: '1712100000000' };
  const sign  = hmac(buildPayload(query), 'test-secret');

  // ✅ Valid signature must pass
  assert.ok(verifySign('test-secret', { ...query, sign }, sign),
    'valid signature must pass');

  // ❌ Wrong secret must fail
  assert.ok(!verifySign('wrong-secret', { ...query, sign }, sign),
    'wrong secret must be rejected');

  // ❌ Tampered parameter must fail
  const tampered = { ...query, handle: 'evil.myshopline.com', sign };
  assert.ok(!verifySign('test-secret', tampered, sign),
    'tampered parameter must be rejected');

  // ✅ "sign" field must be excluded from payload computation
  const signWithSignField = { appkey: 'myapp', sign: 'random-value' };
  const expectedSign = hmac('appkey=myapp', 'test-secret');
  assert.ok(verifySign('test-secret', signWithSignField, expectedSign),
    '"sign" field must be excluded before hashing');
}

// =============================================================================
// verifyTimestamp tests
// =============================================================================

{
  const now = Date.now();

  // ✅ Current timestamp must pass
  assert.ok(verifyTimestamp(String(now)), 'current timestamp must pass');

  // ✅ 9 minutes ago must pass (within 10-min window)
  assert.ok(verifyTimestamp(String(now - 9 * 60 * 1000)), '9 min ago must pass');

  // ❌ 11 minutes ago must fail
  assert.ok(!verifyTimestamp(String(now - 11 * 60 * 1000)), '11 min ago must be rejected');

  // ❌ 11 minutes in the future must fail
  assert.ok(!verifyTimestamp(String(now + 11 * 60 * 1000)), '11 min future must be rejected');

  // ❌ Invalid formats must fail
  assert.ok(!verifyTimestamp('not-a-number'), 'non-numeric must be rejected');
  assert.ok(!verifyTimestamp(''),             'empty string must be rejected');
}

// =============================================================================
// generatePostSign tests
// =============================================================================

{
  const body      = JSON.stringify({ code: 'abc123' });
  const timestamp = '1712100000000';
  const secret    = 'test-secret';

  // ✅ Deterministic output
  assert.strictEqual(
    generatePostSign(body, timestamp, secret),
    generatePostSign(body, timestamp, secret),
    'generatePostSign must be deterministic'
  );

  // ✅ Empty body must not throw and must return non-empty hex (used by token refresh)
  const emptySign = generatePostSign('', timestamp, secret);
  assert.ok(emptySign.length > 0, 'empty body must return non-empty hex');

  // ❌ Different secrets must produce different signatures
  const s1 = generatePostSign(body, timestamp, 'secret-a');
  const s2 = generatePostSign(body, timestamp, 'secret-b');
  assert.notStrictEqual(s1, s2, 'different secrets must produce different signatures');

  // ❌ Different timestamps must produce different signatures
  const s3 = generatePostSign(body, '1000000000000', secret);
  const s4 = generatePostSign(body, '9999999999999', secret);
  assert.notStrictEqual(s3, s4, 'different timestamps must produce different signatures');
}

console.log('✅ All sign.test.js assertions passed');
