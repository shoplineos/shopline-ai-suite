package com.shopline.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * SessionTokenService — Session JWT generation and verification (Java / Spring Boot)
 *
 * Creates and validates HS256 JWTs used by the frontend to authenticate API calls.
 * The signing key is Base64(appSecret) to match the Go/JS/PHP/Python convention.
 *
 * Dependency (add to pom.xml or build.gradle):
 *   <!-- io.jsonwebtoken:jjwt-api, jjwt-impl, jjwt-jackson -->
 *   implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
 *   runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.12.6'
 *   runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.12.6'
 */
@Service
public class SessionTokenService {

    /** Session token validity (6 hours in milliseconds). */
    private static final long SESSION_EXPIRY_MS = 6L * 60 * 60 * 1000;

    /**
     * Generates a signed HS256 session JWT.
     *
     * Claims included:
     *   - handle   : store domain handle
     *   - storeId  : numeric SHOPLINE store identifier
     *   - appName  : application name
     *   - aud      : appKey (used by middleware to look up appSecret)
     *   - iat / exp: issued-at and expiry (6 h)
     *
     * Signing key: Base64.getEncoder().encodeToString(appSecret.getBytes(UTF-8))
     *
     * @param appKey    Application key (stored in the aud claim)
     * @param appSecret Application secret (used to derive the signing key)
     * @param handle    Store domain handle
     * @param storeId   Numeric SHOPLINE store identifier
     * @param appName   Application display name
     * @return Signed JWT string
     */
    public String generate(String appKey, String appSecret,
                           String handle, long storeId, String appName) {
        byte[] signingKey = signingKey(appSecret);
        long now = System.currentTimeMillis();

        Map<String, Object> claims = new HashMap<>();
        claims.put("handle",  handle);
        claims.put("storeId", storeId);
        claims.put("appName", appName);

        return Jwts.builder()
                .setClaims(claims)
                .setAudience(appKey)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + SESSION_EXPIRY_MS))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(signingKey),
                        SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Parses and verifies a session JWT.
     *
     * Use this as the second step in JwtAuthFilter after decodePayload has
     * identified the appKey and the appSecret has been loaded from your database.
     *
     * @param token     JWT string from the Authorization header
     * @param appSecret Application secret used to derive the signing key
     * @return Verified Claims object
     * @throws io.jsonwebtoken.JwtException if the signature is invalid or the token has expired
     */
    public Claims parse(String token, String appSecret) {
        byte[] signingKey = signingKey(appSecret);
        return Jwts.parserBuilder()
                .setSigningKey(io.jsonwebtoken.security.Keys.hmacShaKeyFor(signingKey))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Decodes the JWT payload segment without verifying the signature.
     *
     * Use this as the first step in JwtAuthFilter to extract the aud (appKey) claim
     * before loading the appSecret from your database for full verification.
     *
     * @param token JWT string
     * @return Raw payload as a map
     * @throws IllegalArgumentException if the token format is invalid
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> decodePayload(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT: expected 3 segments, got " + parts.length);
        }
        byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(payloadBytes, Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("JWT payload JSON decode failed: " + e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------

    /** Derives the HMAC signing key as Base64(appSecret.getBytes(UTF-8)). */
    private byte[] signingKey(String appSecret) {
        String encoded = Base64.getEncoder().encodeToString(appSecret.getBytes(StandardCharsets.UTF_8));
        return encoded.getBytes(StandardCharsets.UTF_8);
    }
}
