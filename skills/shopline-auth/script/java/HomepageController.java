package com.shopline.auth;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.List;

/**
 * HomepageController — GET /app/homepage handler (Java / Spring Boot)
 *
 * Entry point for the SHOPLINE OAuth authorization flow.
 */
@Controller
public class HomepageController {

    private final AppRepository appRepository;
    private final StoreAppRepository storeAppRepository;
    private final SessionTokenService sessionTokenService;

    /** Validates that a handle contains only characters safe for subdomain construction. */
    private static final Pattern HANDLE_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9-]*$");

    public HomepageController(
            AppRepository appRepository,
            StoreAppRepository storeAppRepository,
            SessionTokenService sessionTokenService) {
        this.appRepository = appRepository;
        this.storeAppRepository = storeAppRepository;
        this.sessionTokenService = sessionTokenService;
    }

    /**
     * Handle GET /app/homepage.
     *
     * Decision tree:
     *  1. Verify HMAC-SHA256 query signature.
     *  2. Verify request timestamp (±10 min).
     *  3a. Already installed & scopes match → redirect to app home + sessionToken.
     *  3b. Not installed + lang present (embedded app) → redirect to app home with uninstalled=true.
     *  3c. Not installed + lang absent (external app) → redirect to SHOPLINE OAuth page.
     */
    @GetMapping("/app/homepage")
    public void homepage(
            HttpServletRequest request,
            HttpServletResponse response,
            @RequestParam("appkey") String appKey,
            @RequestParam("handle") String handle,
            @RequestParam(value = "lang", defaultValue = "") String lang,
            @RequestParam("timestamp") String timestamp,
            @RequestParam("sign") String sign) throws IOException {

        handle = handle.strip();

        // Load app configuration from database
        AppConfig app = appRepository.findByAppKey(appKey);
        if (app == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "app_not_found");
            return;
        }

        // Build a flat query-parameter map from the request URL
        Map<String, String> queryParams = flattenQueryParams(request.getParameterMap());

        // Step 1: Verify query signature
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

        // Step 3: Check installation state.
        // Scope check uses strict equality: if required scopes change (e.g. a new permission
        // is added), the store must re-authorize even if all old scopes are still present.
        StoreApp storeApp = storeAppRepository.findByAppKeyAndHandle(app.getAppKey(), handle);
        boolean installed = storeApp != null
                && storeApp.isInstall()
                && scopesEqual(storeApp.getScopes(), app.getScopes());

        String callbackURL = app.getCallbackURL();

        if (installed) {
            // 3a. Already installed
            String sessionToken = sessionTokenService.generate(
                    app.getAppKey(), app.getAppSecret(), handle,
                    storeApp.getStoreId(), app.getAppName());
            String redirectURL = buildAppHomeURL(app.getHomeURL(), app.getAppKey(), handle, lang);
            javax.servlet.http.Cookie cookie = new javax.servlet.http.Cookie("session_token", sessionToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge(6 * 60 * 60); // 6 hours, matching session JWT TTL
            response.addCookie(cookie);
            response.sendRedirect(redirectURL);
            return;
        }

        if (!lang.isEmpty()) {
            // 3b. Embedded app, not installed: redirect to app home with uninstalled=true.
            // Frontend uses App Bridge toAdminPage(ADMIN_SECTION.OAUTH) to navigate.
            String langCode = firstLang(lang);
            String redirectURL = app.getHomeURL()
                    + "?appkey=" + encode(app.getAppKey())
                    + "&handle=" + encode(handle)
                    + "&embedded=1"
                    + "&lang=" + encode(langCode)
                    + "&uninstalled=true"
                    + "&scope=" + encode(app.getScopes())
                    + "&redirectUri=" + encode(callbackURL);
            String host = request.getParameter("host");
            if (host != null && !host.isEmpty()) {
                redirectURL += "&host=" + encode(host);
            }
            response.sendRedirect(redirectURL);
            return;
        }

        // 3c. External app, not installed
        String oauthURL = "https://" + handle + ".myshopline.com/admin/oauth-web/#/oauth/authorize"
                + "?appKey=" + app.getAppKey()
                + "&responseType=code"
                + "&scope=" + encode(app.getScopes())
                + "&redirectUri=" + encode(callbackURL);
        response.sendRedirect(oauthURL);
    }

    /**
     * Returns true when the installed scope set exactly matches the required set.
     *
     * Strict equality is intentional: if required scopes change (e.g. a new permission
     * is added), the store must re-authorize even if all old scopes are still present.
     */
    private boolean scopesEqual(String installed, String required) {
        List<String> a = Arrays.stream(installed.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).sorted().collect(Collectors.toList());
        List<String> b = Arrays.stream(required.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).sorted().collect(Collectors.toList());
        return a.equals(b);
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

    /** Flattens a multi-value parameter map to a single-value map (first value only). */
    private Map<String, String> flattenQueryParams(Map<String, String[]> multi) {
        Map<String, String> flat = new LinkedHashMap<>();
        multi.forEach((k, v) -> { if (v.length > 0) flat.put(k, v[0]); });
        return flat;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
