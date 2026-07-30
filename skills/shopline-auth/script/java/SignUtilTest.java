package com.shopline.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SignUtilTest — Unit tests for SHOPLINE signature utilities (Java / JUnit 5)
 *
 * Run with: mvn test  or  gradle test
 *
 * Covers:
 *   - verifySign: valid signature, wrong secret, tampered param, sign field excluded
 *   - verifyTimestamp: current time, 9 min ago, 11 min ago (rejected), invalid format
 *   - generatePostSign: deterministic, empty body, different secrets/timestamps
 */
class SignUtilTest {

    // =========================================================================
    // Helpers
    // =========================================================================

    /** Build the sorted k=v&k=v payload string (excluding "sign") — mirrors SignUtil logic. */
    private String buildPayload(Map<String, String> params) {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        sorted.remove("sign");
        StringBuilder sb = new StringBuilder();
        sorted.forEach((k, v) -> {
            if (sb.length() > 0) sb.append('&');
            sb.append(k).append('=').append(v);
        });
        return sb.toString();
    }

    private Map<String, String> queryOf(String... kvPairs) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kvPairs.length - 1; i += 2) {
            m.put(kvPairs[i], kvPairs[i + 1]);
        }
        return m;
    }

    // =========================================================================
    // verifySign
    // =========================================================================

    @Test
    @DisplayName("Valid signature must pass")
    void verifySign_validSignature() {
        Map<String, String> params = queryOf(
            "appkey", "myapp",
            "handle", "test-store.myshopline.com",
            "timestamp", "1712100000000"
        );
        String sign = SignUtil.hmacSha256Hex(buildPayload(params), "test-secret");
        params.put("sign", sign);

        assertTrue(SignUtil.verifySign("test-secret", params, sign));
    }

    @Test
    @DisplayName("Wrong secret must be rejected")
    void verifySign_wrongSecret() {
        Map<String, String> params = queryOf(
            "appkey", "myapp",
            "handle", "test-store.myshopline.com",
            "timestamp", "1712100000000"
        );
        String sign = SignUtil.hmacSha256Hex(buildPayload(params), "correct-secret");
        params.put("sign", sign);

        assertFalse(SignUtil.verifySign("wrong-secret", params, sign));
    }

    @Test
    @DisplayName("Tampered parameter must be rejected")
    void verifySign_tamperedParam() {
        Map<String, String> params = queryOf(
            "appkey", "myapp",
            "handle", "test-store.myshopline.com",
            "timestamp", "1712100000000"
        );
        String sign = SignUtil.hmacSha256Hex(buildPayload(params), "test-secret");
        params.put("sign", sign);

        // Tamper after signing
        params.put("handle", "evil.myshopline.com");

        assertFalse(SignUtil.verifySign("test-secret", params, sign));
    }

    @Test
    @DisplayName("sign field must be excluded from payload computation")
    void verifySign_signFieldExcluded() {
        Map<String, String> params = queryOf("appkey", "myapp", "sign", "random-value");
        String expected = SignUtil.hmacSha256Hex("appkey=myapp", "test-secret");

        assertTrue(SignUtil.verifySign("test-secret", params, expected));
    }

    // =========================================================================
    // verifyTimestamp
    // =========================================================================

    @Test
    @DisplayName("Current timestamp must pass")
    void verifyTimestamp_now() {
        assertTrue(SignUtil.verifyTimestamp(String.valueOf(System.currentTimeMillis())));
    }

    @Test
    @DisplayName("Timestamp 9 min ago must pass (within 10-min window)")
    void verifyTimestamp_nineMinutesAgo() {
        long ts = System.currentTimeMillis() - 9 * 60 * 1000L;
        assertTrue(SignUtil.verifyTimestamp(String.valueOf(ts)));
    }

    @Test
    @DisplayName("Timestamp 11 min ago must be rejected")
    void verifyTimestamp_elevenMinutesAgo_rejected() {
        long ts = System.currentTimeMillis() - 11 * 60 * 1000L;
        assertFalse(SignUtil.verifyTimestamp(String.valueOf(ts)));
    }

    @Test
    @DisplayName("Timestamp 11 min in the future must be rejected")
    void verifyTimestamp_elevenMinutesFuture_rejected() {
        long ts = System.currentTimeMillis() + 11 * 60 * 1000L;
        assertFalse(SignUtil.verifyTimestamp(String.valueOf(ts)));
    }

    @Test
    @DisplayName("Non-numeric timestamp must be rejected")
    void verifyTimestamp_invalidFormat() {
        assertFalse(SignUtil.verifyTimestamp("not-a-number"));
        assertFalse(SignUtil.verifyTimestamp(""));
    }

    // =========================================================================
    // generatePostSign
    // =========================================================================

    @Test
    @DisplayName("generatePostSign must be deterministic")
    void generatePostSign_deterministic() {
        String s1 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "1712100000000", "secret");
        String s2 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "1712100000000", "secret");
        assertEquals(s1, s2);
    }

    @Test
    @DisplayName("Empty body must return non-empty hex (used by token refresh)")
    void generatePostSign_emptyBody() {
        String sign = SignUtil.generatePostSign("", "1712100000000", "secret");
        assertFalse(sign.isEmpty());
    }

    @Test
    @DisplayName("Different secrets must produce different signatures")
    void generatePostSign_differentSecrets() {
        String s1 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "1712100000000", "secret-a");
        String s2 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "1712100000000", "secret-b");
        assertNotEquals(s1, s2);
    }

    @Test
    @DisplayName("Different timestamps must produce different signatures")
    void generatePostSign_differentTimestamps() {
        String s1 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "1000000000000", "secret");
        String s2 = SignUtil.generatePostSign("{\"code\":\"abc\"}", "9999999999999", "secret");
        assertNotEquals(s1, s2);
    }
}
