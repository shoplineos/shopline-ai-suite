package com.shopline.auth;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.TreeMap;

/**
 * SignUtil — SHOPLINE OAuth signature utilities (Java)
 *
 * Implements HMAC-SHA256 signing for GET (homepage/callback) and
 * POST (token create/refresh) requests, plus timestamp validation.
 */
public class SignUtil {

    /** Maximum allowed time drift between request timestamp and server time (ms). */
    private static final long MAX_TIMESTAMP_DRIFT_MS = 10L * 60 * 1000; // 10 minutes

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Verifies the HMAC-SHA256 signature of a SHOPLINE GET request.
     *
     * Algorithm:
     *  1. Remove the "sign" key from the query parameters.
     *  2. Sort remaining keys alphabetically (ascending) using TreeMap.
     *  3. Concatenate as "key1=value1&key2=value2...".
     *  4. Compute HMAC-SHA256(payload, appSecret) → hex string.
     *  5. Compare with receivedSign using MessageDigest.isEqual (constant-time).
     *
     * @param appSecret    Application secret key
     * @param queryParams  Map of query parameters (e.g., from HttpServletRequest)
     * @param receivedSign The "sign" value from the request
     * @return true if the signature is valid
     */
    public static boolean verifySign(String appSecret, Map<String, String> queryParams, String receivedSign) {
        // Copy params without the "sign" key, sorted alphabetically via TreeMap
        TreeMap<String, String> sorted = new TreeMap<>();
        queryParams.forEach((k, v) -> {
            if (!"sign".equals(k)) sorted.put(k, v);
        });

        // Build payload string: key1=value1&key2=value2
        StringBuilder sb = new StringBuilder();
        sorted.forEach((k, v) -> {
            if (sb.length() > 0) sb.append('&');
            sb.append(k).append('=').append(v);
        });

        String expectedSign = hmacSha256Hex(sb.toString(), appSecret);

        // Constant-time comparison
        return MessageDigest.isEqual(
                expectedSign.getBytes(StandardCharsets.UTF_8),
                receivedSign.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Generates the HMAC-SHA256 signature for a SHOPLINE POST request.
     *
     * Used when calling SHOPLINE's OAuth token APIs (create / refresh).
     * source = requestBodyString + timestamp, signed with appSecret.
     *
     * @param body       JSON-serialized request body (empty string for token refresh)
     * @param timestamp  Unix millisecond timestamp string
     * @param appSecret  Application secret key
     * @return Hex-encoded HMAC-SHA256 signature
     */
    public static String generatePostSign(String body, String timestamp, String appSecret) {
        String source = body + timestamp;
        return hmacSha256Hex(source, appSecret);
    }

    /**
     * Checks whether the given Unix-millisecond timestamp string is within
     * the allowed drift window (±10 min) of the current server time.
     *
     * @param timestampStr Unix timestamp in milliseconds (as a string)
     * @return true if within the allowed window
     */
    public static boolean verifyTimestamp(String timestampStr) {
        try {
            long ts = Long.parseLong(timestampStr);
            long diff = System.currentTimeMillis() - ts;
            return Math.abs(diff) <= MAX_TIMESTAMP_DRIFT_MS;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Computes HMAC-SHA256(message, key) and returns a hex-encoded string.
     *
     * @param message The message to sign
     * @param key     The HMAC key
     * @return Hex-encoded signature
     */
    static String hmacSha256Hex(String message, String key) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(raw);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC-SHA256 computation failed", e);
        }
    }

    /**
     * Verifies the HMAC-SHA256 signature of a SHOPLINE webhook POST request.
     *
     * SHOPLINE sends the signature in the "X-Shopline-Hmac-Sha256" HTTP header.
     * The signature is computed as HMAC-SHA256(requestBody, appSecret), hex-encoded.
     *
     * @param appSecret    Application secret key
     * @param body         Raw request body string
     * @param receivedSign Value of X-Shopline-Hmac-Sha256 header
     * @return true if the signature is valid
     */
    public static boolean verifyWebhookSign(String appSecret, String body, String receivedSign) {
        if (receivedSign == null || receivedSign.isEmpty()) {
            return false;
        }
        String expectedSign = hmacSha256Hex(body, appSecret);
        return MessageDigest.isEqual(
                expectedSign.getBytes(StandardCharsets.UTF_8),
                receivedSign.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
