package com.shopline.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * WebhookController — POST /webhook/appstore/callback handler (Java / Spring Boot)
 *
 * Handles SHOPLINE appstore lifecycle events (install / uninstall).
 */
@RestController
public class WebhookController {

    private static final String OPERATE_UNINSTALL = "uninstall";

    @Value("${shopline.app-secret}")
    private String appSecret;

    private final AppRepository appRepository;
    private final StoreAppRepository storeAppRepository;
    private final TokenStore tokenStore;

    public WebhookController(
            AppRepository appRepository,
            StoreAppRepository storeAppRepository,
            TokenStore tokenStore) {
        this.appRepository = appRepository;
        this.storeAppRepository = storeAppRepository;
        this.tokenStore = tokenStore;
    }

    /**
     * Handle POST /webhook/appstore/callback.
     *
     * Steps:
     *  1. Verify the webhook signature using X-Shopline-Hmac-Sha256 header.
     *  2. Parse the request body JSON.
     *  3. Dispatch based on the "operate" field.
     *  4. On uninstall: delete cached access token and update install status.
     *
     * @param body    Raw request body string (used for signature verification)
     * @param event   Parsed webhook payload map
     * @param request HTTP request (for reading signature header)
     * @return 200 OK on success, 401 on invalid signature
     */
    @PostMapping("/webhook/appstore/callback")
    public ResponseEntity<Void> webhook(
            @RequestBody String body,
            HttpServletRequest request) {
        // Step 1: Verify webhook signature
        String receivedSign = request.getHeader("X-Shopline-Hmac-Sha256");
        if (!SignUtil.verifyWebhookSign(appSecret, body, receivedSign)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Step 2: Parse body
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> event;
        try {
            event = mapper.readValue(body, Map.class);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        String operate = (String) event.getOrDefault("operate", "");
        String handle  = (String) event.getOrDefault("handle",  "");
        String appKey  = (String) event.getOrDefault("appkey",  "");

        switch (operate) {
            case OPERATE_UNINSTALL -> handleUninstall(handle, appKey);
            default -> { /* Unknown operate value: acknowledge and ignore */ }
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Processes the uninstall event.
     *
     * Actions:
     *  1. Delete the cached access token for the uninstalled store.
     *  2. Update the database install status to false.
     *
     * @param handle Store domain handle
     * @param appKey Application key
     */
    private void handleUninstall(String handle, String appKey) {
        // Step 1: Remove cached access token
        tokenStore.delete(TokenStore.accessTokenKey(handle, appKey));

        // Step 2: Update database install status to false
        //
        // TODO: Replace with your real database update.
        //   Set isInstall = false for (handle, appKey) in your store_app table.
        storeAppRepository.markUninstalled(handle, appKey);
    }
}
