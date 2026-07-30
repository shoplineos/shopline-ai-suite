package com.shopline.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * CallbackController — GET /app/callback handler (Java / Spring Boot)
 *
 * Exchanges the OAuth code for tokens, persists the installation, and
 * redirects the merchant to the app home page.
 */
@Controller
public class CallbackController {

    private static final Logger logger = LoggerFactory.getLogger(CallbackController.class);

    private final AppRepository appRepository;
    private final StoreAppRepository storeAppRepository;
    private final SessionTokenService sessionTokenService;
    private final TokenStore tokenStore;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** Validates that a handle contains only characters safe for subdomain construction. */
    private static final Pattern HANDLE_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9-]*$");

    public CallbackController(
            AppRepository appRepository,
            StoreAppRepository storeAppRepository,
            SessionTokenService sessionTokenService,
            TokenStore tokenStore) {
        this.appRepository = appRepository;
        this.storeAppRepository = storeAppRepository;
        this.sessionTokenService = sessionTokenService;
        this.tokenStore = tokenStore;
    }

    /**
     * Handle GET /app/callback.
     *
     * Steps:
     *  1. Verify HMAC-SHA256 query signature.
     *  2. Verify request timestamp (±10 min).
     *  3. Exchange the authorization code for tokens.
     *  4. Extract storeId from the access token JWT payload.
     *  5. Persist the refresh token (database upsert).
     *  6. Cache the access token (90% of remaining TTL).
     *  7. Generate a session JWT and redirect to the app home page.
     */
    @GetMapping("/app/callback")
    public void callback(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam("appkey") String appKey,
            @RequestParam("code") String code,
            @RequestParam("handle") String handle,
            @RequestParam(value = "lang", defaultValue = "") String lang,
            @RequestParam("timestamp") String timestamp,
            @RequestParam("sign") String sign) throws IOException {

        handle = handle.strip();

        AppConfig app = appRepository.findByAppKey(appKey);
        if (app == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "app_not_found");
            return;
        }

        Map<String, String> queryParams = flattenQueryParams(request.getParameterMap());

        // Step 1: Verify signature
        if (!SignUtil.verifySign(app.getAppSecret(), queryParams, sign)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "signature_verification_failed");
            return;
        }

        // Step 2: Verify timestamp
        if (!SignUtil.verifyTimestamp(timestamp)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "timestamp_expired");
            return;
        }

        // Step 2.5: Validate handle format (defense-in-depth against URL manipulation)
        if (!HANDLE_PATTERN.matcher(handle).matches()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "invalid_handle_format");
            return;
        }

        try {
            // Step 3: Exchange code for tokens
            TokenData tokenData = exchangeToken(handle, app.getAppKey(), app.getAppSecret(), code);

            // Step 4: Extract storeId from JWT payload
            long storeId = extractStoreId(tokenData.getAccessToken());
            if (storeId == 0) throw new RuntimeException("storeId extraction failed");

            // Step 5: Persist refresh token to database
            //
            // TODO: Replace with your real DB upsert.
            //   Required fields: storeId, handle, appKey, refreshToken, expireTime, scopes, isInstall=true
            storeAppRepository.upsert(handle, storeId, app.getAppKey(), tokenData);

            // Step 6: Cache access token (90% of remaining TTL)
            long ttlMs = TokenStore.computeTTL(Instant.parse(tokenData.getExpireTime()));
            if (ttlMs > 0) {
                tokenStore.set(TokenStore.accessTokenKey(handle, app.getAppKey()),
                        tokenData.getAccessToken(), ttlMs);
            }

            // Step 7: Generate session token and redirect.
            // embedded/lang are inferred from the lang query param in the callback request.
            String sessionToken = sessionTokenService.generate(
                    app.getAppKey(), app.getAppSecret(), handle,
                    storeId, app.getAppName());
            String redirectURL = buildAppHomeURL(app.getHomeURL(), app.getAppKey(), handle, lang);
            javax.servlet.http.Cookie cookie = new javax.servlet.http.Cookie("session_token", sessionToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge(6 * 60 * 60); // 6 hours, matching session JWT TTL
            response.addCookie(cookie);
            response.sendRedirect(redirectURL);

        } catch (Exception e) {
            logger.error("[callback] error: {}", e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_BAD_GATEWAY, "oauth_code_exchange_failed");
        }
    }

    /**
     * Calls SHOPLINE's token create API to exchange an OAuth code for tokens.
     *
     * POST https://{handle}.myshopline.com/admin/oauth/token/create
     * Headers: appkey, timestamp, sign
     * Body:    {"code": "<authorization_code>"}
     */
    private TokenData exchangeToken(String handle, String appKey, String appSecret, String code)
            throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("code", code));
        String timestamp = String.valueOf(System.currentTimeMillis());
        String sign = SignUtil.generatePostSign(body, timestamp, appSecret);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://" + handle + ".myshopline.com/admin/oauth/token/create"))
                .header("Content-Type", "application/json")
                .header("appkey", appKey)
                .header("timestamp", timestamp)
                .header("sign", sign)
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(httpRequest,
                HttpResponse.BodyHandlers.ofString());

        @SuppressWarnings("unchecked")
        Map<String, Object> resp = objectMapper.readValue(httpResponse.body(), Map.class);
        if (!Integer.valueOf(200).equals(resp.get("code")) || resp.get("data") == null) {
            throw new RuntimeException("ExchangeToken API error: " + resp.get("message"));
        }
        return objectMapper.convertValue(resp.get("data"), TokenData.class);
    }

    /**
     * Decodes the SHOPLINE access token JWT payload (without signature verification)
     * to extract the numeric storeId claim.
     */
    private long extractStoreId(String accessToken) {
        try {
            String[] parts = accessToken.split("\\.");
            if (parts.length != 3) return 0;
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(payloadBytes, Map.class);
            return Long.parseLong(payload.get("storeId").toString());
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Builds the redirect URL for the app home page.
     *
     * Rules:
     *   - lang present (embedded app) → embedded=1&isFromAppListPage=1&lang=<code>
     *   - lang absent  (external app) → embedded=0&isFromAppListPage=1
     */
    private String buildAppHomeURL(String homeURL, String appKey, String handle, String lang) {
        String base = homeURL + "?appkey=" + encode(appKey) + "&handle=" + encode(handle);
        if (!lang.isEmpty()) {
            return base + "&embedded=1&isFromAppListPage=1&lang=" + encode(firstLang(lang));
        }
        return base + "&embedded=0&isFromAppListPage=1";
    }

    /** Returns the second language code from a comma-separated lang string, or the single value. */
    private String firstLang(String lang) {
        String[] parts = lang.split(",", 2);
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private Map<String, String> flattenQueryParams(Map<String, String[]> multi) {
        Map<String, String> flat = new LinkedHashMap<>();
        multi.forEach((k, v) -> { if (v.length > 0) flat.put(k, v[0]); });
        return flat;
    }
}
