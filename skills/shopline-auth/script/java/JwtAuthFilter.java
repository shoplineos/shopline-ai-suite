package com.shopline.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * JwtAuthFilter — JWT session auth filter (Java / Spring Boot)
 *
 * Validates the session JWT passed by the frontend in the Authorization header
 * and injects the login context (handle, storeID, appKey, …) into the request
 * as the "loginInfo" attribute for use by downstream handlers.
 *
 * Authentication steps (matching protocol.md §3):
 *  1. Extract the Bearer token from the Authorization header.
 *  2. Decode payload without signature verification to read the aud (appKey) claim.
 *  3. Load the app via AppRepository to obtain the appSecret.
 *  4. Fully verify the JWT signature and expiry via SessionTokenService.parse().
 *  5. Verify the store–app installation via StoreAppRepository.
 *  6. Set request attribute "loginInfo" for downstream controllers.
 *
 * Registration — add to your Spring Security config or WebMvcConfigurer:
 *
 *   @Bean
 *   public JwtAuthFilter jwtAuthFilter(...) { return new JwtAuthFilter(...); }
 *
 *   // In SecurityFilterChain:
 *   http.addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
 *
 * Usage in a controller:
 *
 *   @GetMapping("/api/orders")
 *   public ResponseEntity<?> orders(HttpServletRequest request) {
 *       LoginInfo info = (LoginInfo) request.getAttribute("loginInfo");
 *       // info.getHandle(), info.getStoreId(), info.getAppKey(), ...
 *   }
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final AppRepository appRepository;
    private final StoreAppRepository storeAppRepository;
    private final SessionTokenService sessionTokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthFilter(
            AppRepository appRepository,
            StoreAppRepository storeAppRepository,
            SessionTokenService sessionTokenService) {
        this.appRepository = appRepository;
        this.storeAppRepository = storeAppRepository;
        this.sessionTokenService = sessionTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String tokenString = null;
        if (authHeader != null && !authHeader.isBlank()) {
            tokenString = authHeader.startsWith("Bearer ")
                    ? authHeader.substring(7)
                    : authHeader;
        } else if (request.getCookies() != null) {
            for (javax.servlet.http.Cookie c : request.getCookies()) {
                if ("session_token".equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
                    tokenString = c.getValue();
                    break;
                }
            }
        }
        if (tokenString == null || tokenString.isBlank()) {
            sendAuthError(response, "missing Authorization header or session_token cookie");
            return;
        }

        // Step 2: Decode payload without verification to extract appKey (aud claim)
        Map<String, Object> payload;
        try {
            payload = sessionTokenService.decodePayload(tokenString);
        } catch (IllegalArgumentException e) {
            sendAuthError(response, "invalid token format");
            return;
        }

        String appKey = extractAppKey(payload);
        if (appKey == null) {
            sendAuthError(response, "token missing aud claim");
            return;
        }

        // Step 3: Load app to obtain appSecret
        AppConfig app;
        try {
            app = appRepository.findByAppKey(appKey);
        } catch (Exception e) {
            logger.error("[auth] failed to load app", e);
            sendAuthError(response, "failed to load app");
            return;
        }
        if (app == null) {
            sendAuthError(response, "app not found");
            return;
        }

        // Step 4: Full signature + expiry verification
        Claims claims;
        try {
            claims = sessionTokenService.parse(tokenString, app.getAppSecret());
        } catch (JwtException e) {
            sendAuthError(response, "invalid or expired token");
            return;
        }

        String handle = (String) claims.get("handle");

        // Step 5: Verify store–app installation
        StoreApp storeApp;
        try {
            storeApp = storeAppRepository.findByHandleAndAppKey(handle, app.getAppKey());
        } catch (Exception e) {
            logger.error("[auth] failed to check installation", e);
            sendAuthError(response, "failed to check installation");
            return;
        }
        if (storeApp == null || !storeApp.isInstall() || storeApp.getStoreId() == 0) {
            sendAuthError(response, "app not installed");
            return;
        }

        // Step 6: Inject login context into request attributes
        LoginInfo loginInfo = new LoginInfo(
                handle,
                storeApp.getStoreId(),
                app.getAppKey(),
                app.getAppName()
        );
        request.setAttribute("loginInfo", loginInfo);

        chain.doFilter(request, response);
    }

    // -------------------------------------------------------------------------

    /**
     * Extracts the appKey from the aud claim of a decoded JWT payload.
     * aud can be a String or a List<String>.
     */
    @SuppressWarnings("unchecked")
    private String extractAppKey(Map<String, Object> payload) {
        Object aud = payload.get("aud");
        if (aud instanceof String) return (String) aud;
        if (aud instanceof List) {
            List<?> list = (List<?>) aud;
            if (!list.isEmpty()) return list.get(0).toString();
        }
        return null;
    }

    private void sendAuthError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(
                Map.of("success", false, "code", "AUTH_FAILED", "message", message)
        ));
    }

    // -------------------------------------------------------------------------

    /**
     * LoginInfo — authenticated session context injected into request attributes.
     *
     * Retrieve in your controller:
     *   LoginInfo info = (LoginInfo) request.getAttribute("loginInfo");
     */
    public record LoginInfo(
            String handle,
            long   storeId,
            String appKey,
            String appName
    ) {}
}
