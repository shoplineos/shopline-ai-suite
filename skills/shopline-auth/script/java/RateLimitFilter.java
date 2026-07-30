package com.shopline.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RateLimitFilter — Per-IP fixed-window rate limiter (Java / Spring Boot)
 *
 * Default: 600 requests per minute per IP.
 * Returns HTTP 429 Too Many Requests when the limit is exceeded.
 *
 * <p>Registration example (see {@link RateLimitConfig}):
 * <pre>
 *   // Applied to /app/* and /webhook/* URL patterns
 * </pre>
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final int maxRequests;
    private final long windowMs;
    private final ConcurrentHashMap<String, long[]> visitors = new ConcurrentHashMap<>();
    // visitors value: long[]{count, windowEndEpochMs}

    public RateLimitFilter(int maxRequests, long windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = clientIP(request);
        if (!allow(ip)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json; charset=utf-8");
            response.getWriter().write("{\"error\":\"rate_limit_exceeded\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean allow(String ip) {
        long now = System.currentTimeMillis();
        return visitors.compute(ip, (key, entry) -> {
            if (entry == null || now >= entry[1]) {
                return new long[]{1, now + windowMs};
            }
            entry[0]++;
            return entry;
        })[0] <= maxRequests;
    }

    private String clientIP(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            int comma = xff.indexOf(',');
            return comma > 0 ? xff.substring(0, comma).trim() : xff.trim();
        }
        String xri = request.getHeader("X-Real-Ip");
        if (xri != null && !xri.isEmpty()) {
            return xri;
        }
        return request.getRemoteAddr();
    }
}

/**
 * Spring Boot configuration that registers rate limit filters for OAuth and webhook endpoints.
 *
 * Add this class to your Spring Boot application to enable rate limiting.
 */
@Configuration
class RateLimitConfig {

    /** Rate limiter for /app/* endpoints: 600 req/min per IP. */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> appRateLimitFilter() {
        FilterRegistrationBean<RateLimitFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(new RateLimitFilter(600, 60_000));
        reg.addUrlPatterns("/app/*");
        reg.setOrder(1);
        return reg;
    }

    /** Rate limiter for /webhook/* endpoints: 600 req/min per IP. */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> webhookRateLimitFilter() {
        FilterRegistrationBean<RateLimitFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(new RateLimitFilter(600, 60_000));
        reg.addUrlPatterns("/webhook/*");
        reg.setOrder(1);
        return reg;
    }
}
