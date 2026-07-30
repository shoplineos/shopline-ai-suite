/**
 * shopline-auth.js — Unified frontend authentication script (separated architecture)
 *
 * Uses @shoplineos/app-bridge npm package (bundled by esbuild).
 *
 * Build:
 *   npx esbuild src/shopline-auth.js --bundle --format=iife --outfile=public/js/shopline-auth.js
 *
 * Scenarios:
 *   1. uninstalled=true → App Bridge toAdminPage(ADMIN_SECTION.OAUTH) redirect
 *   2. authenticated    → provide authenticatedFetch() (session_token is in HttpOnly cookie)
 *   3. otherwise        → no-op
 *
 * Prerequisites:
 *   npm install @shoplineos/app-bridge esbuild
 *
 * NOTE: This is the SOURCE file (src/shopline-auth.js). The actual file served
 * at public/js/shopline-auth.js is the esbuild bundle output. Do NOT load
 * the CDN app-bridge.js in index.html — it is already bundled here.
 */
import Client, { shared, Redirect, ADMIN_SECTION } from '@shoplineos/app-bridge';

(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);

  // -------------------------------------------------------------------------
  // Case 1: Embedded app — not installed → App Bridge OAuth redirect
  // -------------------------------------------------------------------------
  if (params.get('uninstalled') === 'true') {
    var appKey      = params.get('appkey')      || '';
    var scope       = params.get('scope')       || '';
    var redirectUri = params.get('redirectUri') || '';

    if (!appKey || !scope || !redirectUri) {
      console.error('[shopline-auth] Missing required params: appkey, scope, redirectUri');
      return;
    }

    var app = Client.createApp({
      appKey: appKey,
      host: shared.getHost(),
    });

    var redirect = Redirect.create(app);
    redirect.toAdminPage(ADMIN_SECTION.OAUTH, {
      oauthInfo: {
        appKey: appKey,
        scope: scope,
        redirectUri: decodeURIComponent(redirectUri),
      },
    });

    return;
  }

  // -------------------------------------------------------------------------
  // Case 2: Authenticated — session_token is stored in HttpOnly Secure cookie
  // The cookie is automatically sent by the browser with every same-origin
  // request; JavaScript cannot (and should not) read it directly.
  // -------------------------------------------------------------------------

  // authenticatedFetch uses credentials: 'include' so the browser attaches
  // the session_token cookie automatically. No Authorization header needed.
  window.authenticatedFetch = function (url, options) {
    options = options || {};
    options.credentials = 'include';

    return fetch(url, options).then(function (response) {
      var reauth = response.headers.get('X-SHOPLINE-API-Request-Failure-Reauthorize');
      if (reauth === '1' || reauth === 'true') {
        var handle = params.get('handle') || '';
        var appkey = params.get('appkey') || '';
        var embedded = params.get('embedded') === '1' || !!params.get('lang');

        if (embedded) {
          // PROHIBITION: embedded context must NOT use window.location.href / window.open
          // for OAuth — must use App Bridge to break out of iframe.
          var scope = params.get('scope') || '';
          var redirectUri = params.get('redirectUri') || '';
          var app = Client.createApp({
            appKey: appkey,
            host: shared.getHost(),
          });
          var rd = Redirect.create(app);
          rd.toAdminPage(ADMIN_SECTION.OAUTH, {
            oauthInfo: {
              appKey: appkey,
              scope: scope,
              redirectUri: decodeURIComponent(redirectUri),
            },
          });
        } else {
          window.location.href = '/app/homepage?handle=' + encodeURIComponent(handle) + '&appkey=' + encodeURIComponent(appkey);
        }
      }
      return response;
    });
  };
})();
