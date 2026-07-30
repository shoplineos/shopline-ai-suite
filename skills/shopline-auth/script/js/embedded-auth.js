/**
 * embedded-auth.js — Embedded App OAuth via SHOPLINE App Bridge
 *
 * In an embedded app, direct window.location.href navigation does NOT work
 * for OAuth redirects because the app runs inside the SHOPLINE Admin iframe.
 * App Bridge provides Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...) which
 * communicates with the SHOPLINE Admin parent frame and navigates the entire
 * Admin shell — not just the iframe — to the OAuth authorization page.
 *
 * Prerequisites:
 *   npm install @shoplineos/app-bridge esbuild
 *
 * IMPORTANT: This file uses `import ... from '@shoplineos/app-bridge'` which
 * browsers cannot resolve directly. You MUST bundle it with esbuild before
 * serving to the browser:
 *   npx esbuild embedded-auth.js --bundle --format=iife --outfile=public/js/embedded-auth.js
 *
 * Usage (call once, before any rendering):
 *   import { initEmbeddedAuth } from './embedded-auth';
 *   initEmbeddedAuth();
 *
 * Expected URL parameters (injected by backend GET /app/homepage, case 3b):
 *   uninstalled=true   App is not installed; OAuth redirect is required
 *   appkey             Application key
 *   scope              Comma-separated OAuth permission scopes
 *   redirectUri        URL-encoded backend /app/callback address
 */

import Client, { shared, Redirect, ADMIN_SECTION } from '@shoplineos/app-bridge';

/**
 * Reads current URL parameters and triggers an App Bridge OAuth redirect if needed.
 *
 * This function is a no-op unless `uninstalled=true` is present in the URL, so it
 * is safe to call unconditionally on every page load.
 */
export function initEmbeddedAuth() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('uninstalled') !== 'true') {
    return; // Not an uninstalled redirect; nothing to do.
  }

  const appKey      = params.get('appkey')      ?? '';
  const scope       = params.get('scope')       ?? '';
  const redirectUri = params.get('redirectUri') ?? '';

  if (!appKey || !scope || !redirectUri) {
    console.error('[embedded-auth] Missing required params: appkey, scope, redirectUri');
    return;
  }

  // Initialize App Bridge.
  // shared.getHost() first checks document.referrer, then falls back to reading
  // the `handle` query param and building "{handle}.myshopline.com".
  // The backend must pass through `handle` (and optionally `host`) in the redirect URL.
  const app = Client.createApp({
    appKey,
    host: shared.getHost(),
  });

  // Trigger the OAuth redirect via App Bridge.
  // This communicates with the SHOPLINE Admin parent frame so the entire Admin
  // shell navigates to the OAuth page — not just the iframe content.
  const redirect = Redirect.create(app);
  redirect.toAdminPage(ADMIN_SECTION.OAUTH, {
    oauthInfo: {
      appKey,
      scope,
      redirectUri: decodeURIComponent(redirectUri), // Decode the URL-encoded callback address
    },
  });
}
