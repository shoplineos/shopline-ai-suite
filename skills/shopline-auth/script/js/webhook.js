/**
 * webhook.js — POST /webhook/appstore/callback handler (Node.js / Express)
 *
 * Handles SHOPLINE appstore lifecycle events (install / uninstall).
 * On uninstall: clears the access token cache and marks the app as uninstalled.
 */

const { del: cacheDel, accessTokenKey } = require('./token_store');
const { verifyWebhookSign } = require('./sign');

const OPERATE_UNINSTALL = 'uninstall';

/**
 * Express route handler for POST /webhook/appstore/callback.
 *
 * Steps:
 *  1. Verify the webhook signature using X-Shopline-Hmac-Sha256 header.
 *  2. Parse the request body JSON.
 *  3. Dispatch based on the "operate" field.
 *  4. On uninstall: delete cached access token and call markUninstalled.
 *
 * @param {string}   appSecret       - Application secret key for signature verification
 * @param {Function} markUninstalled - async (handle, appKey) => void  [update DB isInstall=false]
 * @returns {Function} Express middleware function
 */
function webhookHandler(appSecret, markUninstalled) {
  return async (req, res) => {
    // Step 1: Verify webhook signature
    const receivedSign = req.headers['x-shopline-hmac-sha256'] || '';
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body);
    if (!verifyWebhookSign(appSecret, rawBody, receivedSign)) {
      return res.status(401).json({ error: 'invalid_signature' });
    }

    const event = req.body;

    if (!event || !event.operate) {
      return res.status(400).json({ error: 'invalid_webhook_body' });
    }

    try {
      switch (event.operate) {
        case OPERATE_UNINSTALL:
          await handleUninstall(event, markUninstalled);
          break;
        default:
          // Unknown operate value: acknowledge and ignore.
          break;
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('[webhook] error:', err.message);
      res.status(500).json({ error: 'webhook_processing_failed' });
    }
  };
}

/**
 * Handles the uninstall event.
 *
 * Actions:
 *  1. Delete the cached access token for the uninstalled store.
 *  2. Call markUninstalled to update the database.
 *
 * @param {object}   event            - Parsed webhook payload
 * @param {Function} markUninstalled  - async (handle, appKey) => void
 */
async function handleUninstall(event, markUninstalled) {
  const { handle, appkey } = event;

  // Step 1: Remove cached access token
  cacheDel(accessTokenKey(handle, appkey));

  // Step 2: Update database install status to false
  //
  // TODO: Replace the call below with your real database update.
  //   Set isInstall = false for (handle, appKey) in your store_app table.
  if (markUninstalled) {
    await markUninstalled(handle, appkey);
  }
}

module.exports = { webhookHandler };
