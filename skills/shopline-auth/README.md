# SHOPLINE App Authorization Skill

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

## What Is This Skill?

`shopline-auth` is a plug-in authorization skill that helps developers complete SHOPLINE public app OAuth authorization in **under 30 minutes**, without reading the full developer documentation from scratch.

The skill provides:
- Complete working implementations in **5 languages**: Go · JavaScript (Node.js) · PHP · Python · Java
- **2 architecture templates**: monolithic (frontend + backend together) and separated (independent frontend + backend API)
- Ready-to-use modules for signature verification, token caching, session JWT generation, and auth middleware
- A clear list of **8 TODO stubs** — the only parts you need to replace with your real database/Redis logic

---

## Directory Structure

```
skills/shopline-auth/
├── references/
│   ├── protocol.md              Endpoint contracts, signature rules, token lifecycle
│   ├── language-adapters.md     Per-language adapter skeletons
│   └── acceptance-checklist.md  Acceptance criteria
│
├── script/                        Atomic modules per language
│   ├── go/
│   │   ├── sign.go              VerifySign · GeneratePostSign · VerifyTimestamp
│   │   ├── token_store.go       TokenStorage interface · MemoryTokenStore · GetAccessToken
│   │   ├── session_token.go     GenerateSessionToken · ParseToken · DecodePayload
│   │   ├── middleware.go        AuthMiddleware · GetLoginInfo · GetHandle · GetStoreID
│   │   ├── homepage.go          HandleHomepage · buildAppHomeURL · scopesEqual
│   │   ├── callback.go          HandleCallback · ExchangeToken · RefreshToken
│   │   └── webhook.go           HandleWebhook
│   ├── js/                      (same file set, Express/Node.js)
│   │                            embedded-auth.js  ← Embedded app OAuth via App Bridge
│   ├── php/                     (same file set, native PHP)
│   ├── python/                  (same file set, Flask)
│   └── java/                    (same file set, Spring Boot)
│
├── assets/
│   ├── integrated/              Monolithic template (Express, SSR)
│   └── separated/               Separated template
│       ├── backend/main.go      Go backend entry point (wired endpoints + middleware example)
│       └── frontend/            JS helper for session token handling
│
├── README.md                    ← You are here (integration guide + full reference)
└── checklist.md                 38-item acceptance checklist
```

---

## Prerequisites

Before you begin, make sure the following conditions are met:

1. You have registered an application on the [SHOPLINE Developer Platform](https://developers.shopline.com) and obtained your **appKey** and **appSecret**.
2. You have selected **Public App** as the application type and filled in the app home page URL and callback URL on the developer platform.
3. You have the runtime environment installed for your chosen language.
4. Your application server is reachable from the public internet (SHOPLINE must be able to reach your callback endpoints).

---

## Quick Start

1. **Read** `references/protocol.md` to understand the endpoint contracts and signing algorithm.
2. **Choose an architecture**:
   - Monolithic → copy `assets/integrated/` and follow the [Step-by-Step Guide](#step-by-step-guide-english) below
   - **Separated** (recommended) → copy `assets/separated/` and follow the [Step-by-Step Guide](#step-by-step-guide-english) below
3. **Copy** the files from `script/<your-language>/` into your project.
4. **Replace** every `// TODO` stub — see [Developer TODOs](#developer-todos-english) below.
5. **Verify** against `checklist.md` before going live.

### Only Need a Specific Module

Copy the relevant file directly from `script/<language>/`:

| Need | File |
|------|------|
| Signature verification / generation | `sign.*` |
| Token cache (with TTL) | `token_store.*` |
| Session JWT generation | `session_token.*` |
| Homepage endpoint logic | `homepage.*` |
| Callback endpoint logic | `callback.*` |
| Webhook uninstall handling | `webhook.*` |
| **Embedded app OAuth via App Bridge** | **`script/js/embedded-auth.js`** |

> **Embedded app note**: For apps running inside the SHOPLINE Admin iframe, the frontend **must** use `script/js/embedded-auth.js` (or the equivalent logic in `assets/separated/frontend/auth.js`) to initiate OAuth. `window.location.href` does **not** break out of the iframe — App Bridge's `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)` is the only correct approach.

---

<a id="step-by-step-guide-english"></a>

## Step-by-Step Integration Guide

### Step 1: Choose an Architecture

| Architecture | When to use | Reference directory |
|---|---|---|
| **Integrated (all-in-one)** | Small projects, rapid prototypes, SSR frameworks (e.g., Express + template engine) | `assets/integrated/` |
| **Separated (frontend + backend)** | React / Vue / Next.js frontend + standalone backend API | `assets/separated/` |

> **Important**: Regardless of architecture, `appSecret` must only exist on the backend. It must never be exposed to the frontend.

### Step 2: Choose a Language and Copy the Code

Select the implementation for your language from the `script/` directory:

| Language | Directory | Dependencies |
|---|---|---|
| Go | `script/go/` | `github.com/golang-jwt/jwt/v5` |
| JavaScript (Node.js) | `script/js/` | `express`, `axios`, `jsonwebtoken` |
| PHP | `script/php/` | `firebase/php-jwt` |
| Python | `script/python/` | `flask`, `requests`, `PyJWT` |
| Java | `script/java/` | `spring-web`, `jackson-databind` |

Copy the files from your chosen language directory into your project and replace all stub functions marked with `TODO`.

> **Embedded apps (JS only)**: If your app runs inside the SHOPLINE Admin iframe, also copy `script/js/embedded-auth.js` into your frontend project and install the App Bridge package:
> ```bash
> npm install @shoplineos/app-bridge
> ```

### Step 3: Configure Environment Variables

Copy the `.env.example` file from your chosen architecture directory to `.env` and fill in the real values:

```bash
APP_KEY=your_app_key        # From SHOPLINE Developer Platform
APP_SECRET=your_app_secret  # From SHOPLINE Developer Platform (backend only)
APP_NAME=my-shopline-app
APP_SCOPES=read_orders,write_orders
APP_HOME_URL=my-app.example.com
```

> The value of `APP_SCOPES` must exactly match the permission scopes you applied for on the developer platform.

### Step 4: Implement the Required Endpoints

You need to expose three endpoints — see the [Endpoint Reference](#endpoint-reference-english) section below for full details.

| Endpoint | Method | Responsibility |
|----------|--------|----------------|
| `/app/homepage` | GET | Signature check → installation check → embedded/external redirect |
| `/app/callback` | GET | Exchange code for token → extract storeId → sessionToken → redirect |
| `/webhook/appstore/callback` | POST | Uninstall event → clear token cache → update DB installation status |

### Step 5: Register on the SHOPLINE Developer Platform

Log in to the SHOPLINE Developer Platform and complete the following configuration:

1. **App home page URL**: Enter the full public URL of your `GET /app/homepage` endpoint.
   - Example: `https://my-app.example.com/app/homepage`
2. **Authorization callback URL**: Enter the full public URL of your `GET /app/callback` endpoint.
   - Example: `https://my-app.example.com/app/callback`
3. **Webhook**: Subscribe to the **App Uninstall** event and enter the full public URL of your `POST /webhook/appstore/callback` endpoint.

### Step 6: Implement Token Storage (Production)

The `token_store` module in the code defaults to in-memory caching (for demonstration only).

For production, replace it with persistent storage:

| Storage type | Notes |
|---|---|
| **Redis** | Recommended for accessToken caching (set TTL = 90% of token remaining lifetime) |
| **Relational database** | Store refreshToken and installation records (handle, storeId, scopes) |

Search the code for all `// TODO: replace` comments and replace them as instructed.

### Step 7: Set Up the Auth Middleware (Required for Separated Architecture)

After the authorization flow completes, the frontend stores the `sessionToken` and sends it with every API request via the `Authorization: Bearer <token>` header. The backend must verify this token to safely retrieve the current store context.

See the [Auth Middleware Reference](#auth-middleware-reference-english) section below for implementation details.

> **Note**: The three endpoints `/app/homepage`, `/app/callback`, and `/webhook/appstore/callback` do **not** need the auth middleware — they have their own signature verification.

### Step 8: Test the Authorization Flow

1. **Start your service** and ensure all three endpoints are reachable from the internet.
2. In the SHOPLINE Admin (test store), find your app and click **Install**.
3. SHOPLINE will request `/app/homepage` — check your logs to confirm that signature verification passes.
4. After the merchant grants authorization, SHOPLINE will request `/app/callback` — confirm that the token exchange succeeds in your logs.
5. Verify that the final redirect URL contains a valid `token` parameter (the session token).
6. Simulate an uninstall event and confirm that the webhook endpoint is called and the token cache is cleared.

**Expected completion time: ≤ 30 minutes** (from copying the code to the first successful callback).

---

<a id="endpoint-reference-english"></a>

## Endpoint Reference

### `GET /app/homepage`

Entry point of the OAuth flow. Called by SHOPLINE when a merchant opens your app.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `appkey` | string | ✓ | Your application key, issued by SHOPLINE Developer Platform |
| `handle` | string | ✓ | Store domain handle — the subdomain of the merchant's store (e.g. `my-store` from `my-store.myshopline.com`) |
| `timestamp` | string | ✓ | Unix millisecond timestamp of the request (string form of `Date.now()`) |
| `sign` | string | ✓ | HMAC-SHA256 signature — computed from all other query params sorted alphabetically, joined as `key=value&...`, signed with `appSecret` |
| `lang` | string | — | **Absent** for external (standalone) apps. **Present** for embedded apps. May be comma-separated (e.g. `en,zh-CN`) — always take the **second** code as the display language |

#### Redirect Logic

After passing signature and timestamp checks, the handler determines the redirect target:

| Condition | Redirect Target | Key URL Params |
|-----------|----------------|----------------|
| Already installed + scopes match | App home page | `embedded=1`, `isFromAppListPage=1`, `lang=<code>` + HttpOnly Secure cookie `session_token` |
| Not installed + `lang` present (embedded app) | App home page with install prompt | `embedded=1`, `isFromAppListPage=1`, `lang=<code>`, `uninstalled=true`, `redirectUri=<callbackURL>`, `scope=<scopes>` |
| Not installed + `lang` absent (external app) | SHOPLINE OAuth page directly | `appkey`, `scope`, `redirectUri` |

#### Redirect URL Parameter Reference

| Parameter | Value | Description |
|-----------|-------|-------------|
| `embedded` | `1` or `0` | `1` = embedded app (rendered inside SHOPLINE admin); `0` = external/standalone app |
| `isFromAppListPage` | `1` | Always set to `1`; tells the SHOPLINE frontend this redirect originated from the app list |
| `lang` | e.g. `zh-CN` | Display language code. Taken from the second segment of the comma-separated `lang` param |
| `token` | JWT string | Session JWT for the frontend to use in subsequent API calls (see [Session JWT](#session-jwt-english)) |
| `uninstalled` | `true` | Signals the frontend that the store is not installed; the frontend should navigate to the SHOPLINE OAuth authorization page |
| `redirectUri` | URL-encoded string | Callback URL where SHOPLINE sends the authorization code after the merchant authorizes |
| `scope` | URL-encoded string | Comma-separated permission scopes required by the app |

---

### `GET /app/callback`

Called by SHOPLINE after the merchant authorizes the app. Exchanges the one-time code for tokens.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `appkey` | string | ✓ | Same as homepage |
| `handle` | string | ✓ | Same as homepage |
| `timestamp` | string | ✓ | Same as homepage |
| `sign` | string | ✓ | Same signing algorithm as homepage |
| `code` | string | ✓ | **One-time** OAuth authorization code issued by SHOPLINE. Must be exchanged promptly (codes expire quickly) |
| `lang` | string | — | Same as homepage — determines `embedded=1/0` in the final redirect |

#### Processing Steps

```
1. Verify signature (same HMAC-SHA256 algorithm as homepage)
2. Verify timestamp (±10 min window)
3. Exchange code → POST /admin/oauth/token/create → accessToken + refreshToken
4. Extract storeId from accessToken JWT payload
5. Upsert store_app record in your database  ← TODO #3
6. Cache accessToken in Redis (TTL = 90% of remaining lifetime)
7. Generate sessionToken → set HttpOnly Secure cookie (session_token), redirect to app home
```

---

### `POST /webhook/appstore/callback`

Receives lifecycle events (install / uninstall) from SHOPLINE.

#### Request Body (JSON)

| Field | Type | Description |
|-------|------|-------------|
| `appkey` | string | Your application key |
| `handle` | string | Store domain handle |
| `operate` | string | Event type: `"uninstall"` or `"install"` |
| `store_id` | string | SHOPLINE store ID (**string**, not number) |
| `merchant_id` | string | SHOPLINE merchant ID |
| `name` | string | Store display name |
| `email` | string | Merchant email address |
| `timestamp` | int64 | Unix millisecond timestamp |
| `timezone` | string | Store timezone (e.g. `"Asia/Shanghai"`) |
| `country_code` | string | Store country code (e.g. `"CN"`) |
| `has_extension` | bool | Whether the store has active extensions |

#### Processing Steps

```
On "uninstall":
  1. Delete accessToken from cache (key: oauth:access_token:{handle}:{appKey})
  2. Set is_install = false in store_app table  ← TODO #4

On "install" / unknown:
  Acknowledge with 200 OK and take no action
  (installation state is already persisted by /app/callback)
```

---

<a id="developer-todos-english"></a>

## Developer TODOs

These are the **only 8 places** you need to replace with your own database / Redis logic. Everything else is complete.

---

### TODO 1 — `loadApp(appKey)` · Used in: homepage, callback, webhook

Load your `App` record from the database by `appKey`.

```sql
SELECT id, app_key, app_secret, scopes, home_url, app_name
FROM app
WHERE app_key = ?
```

**Expected return type** (across all languages):

| Field | Type | Description |
|-------|------|-------------|
| `appKey` / `app_key` | string | SHOPLINE app key |
| `appSecret` / `app_secret` | string | SHOPLINE app secret (**server-side only, never expose**) |
| `scopes` | string | Comma-separated required scopes (e.g. `"read_orders,write_orders"`) |
| `homeURL` / `home_url` | string | App home page host (e.g. `"my-app.example.com"`) |
| `appName` / `app_name` | string | App display name |

---

### TODO 2 — `loadStoreApp(appKey, handle)` · Used in: homepage

Load the installation record for a specific store–app pair.

```sql
SELECT store_id, handle, scopes, is_install, refresh_token
FROM store_app
WHERE app_key = ? AND handle = ?
```

**Expected return type:**

| Field | Type | Description |
|-------|------|-------------|
| `storeID` / `store_id` | int64 | Numeric SHOPLINE store identifier |
| `handle` | string | Store domain handle |
| `scopes` | string | Comma-separated scopes granted at installation time |
| `isInstall` / `is_install` | bool | Current installation status |
| `refreshToken` / `refresh_token` | string | OAuth refresh token (used to renew accessToken) |

Return `nil` / `null` / `None` if no record exists — the handler will treat this as "not installed."

---

### TODO 3 — `persistRefreshToken(handle, storeID, tokenData)` · Used in: callback

Upsert the installation record after the OAuth code exchange succeeds.

```sql
INSERT INTO store_app (store_id, handle, app_key, refresh_token, expire_time, scopes, is_install)
VALUES (?, ?, ?, ?, ?, ?, true)
ON CONFLICT (handle, app_key) DO UPDATE SET
    store_id      = EXCLUDED.store_id,
    refresh_token = EXCLUDED.refresh_token,
    expire_time   = EXCLUDED.expire_time,
    scopes        = EXCLUDED.scopes,
    is_install    = true
```

**`tokenData` fields provided by the SHOPLINE API:**

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | Short-lived access token (cache in Redis, do not persist) |
| `refreshToken` | string | Long-lived refresh token (**persist in DB**) |
| `expireTime` | string | Access token expiry (ISO 8601 or datetime string) |
| `refreshExpireTime` | string | Refresh token expiry |
| `scope` | string | Comma-separated scopes granted |

---

### TODO 4 — `markUninstalled(handle, appKey)` · Used in: webhook

Update the installation status when a merchant uninstalls the app.

```sql
UPDATE store_app
SET is_install = false
WHERE handle = ?
  AND app_key = ?
```

---

### TODO 5 — `AppLoader(appKey)` · Used in: middleware

Same database query as TODO 1. Provide it as a callback to `AuthMiddleware`:

```go
// Go
loader := func(appKey string) (*auth.App, error) {
    // SELECT id, app_key, app_secret, ... FROM app WHERE app_key = ?
    return db.FindAppByAppKey(appKey)
}
```

```js
// JavaScript
const loader = async (appKey) => db.query('SELECT * FROM app WHERE app_key = ?', [appKey]);
```

```python
# Python
def load_app(app_key: str) -> dict | None:
    return db.fetch_one('SELECT * FROM app WHERE app_key = %s', (app_key,))
```

```php
// PHP
$appLoader = fn($appKey) => $db->fetchApp($appKey);
```

---

### TODO 6 — `InstallChecker(handle, appKey)` · Used in: middleware

Verify that the store has the app installed and return the `storeId`:

```sql
SELECT store_id, is_install
FROM store_app
WHERE handle = ? AND app_key = ?
```

```go
// Go
checker := func(handle string, appKey string) (int64, bool, error) {
    row, err := db.FindStoreApp(handle, appKey)
    if err != nil || row == nil { return 0, false, err }
    return row.StoreID, row.IsInstall, nil
}
```

---

### TODO 7 — `TokenStorage` · Used in: all languages, production only

The default `MemoryTokenStore` works only for single-process development. Replace it for production:

| Storage Backend | When to Use |
|----------------|-------------|
| **Redis** (recommended) | Multi-instance deployments — access token shared across processes |
| **Database** | If you already have DB infrastructure; add `access_token` + `expire_at` columns to `store_app` |
| **Custom** | Implement `Get(key) / Set(key, value, ttl) / Delete(key)` and pass it in |

**Redis example (Go):**
```go
type RedisTokenStorage struct{ client *redis.Client }

func (r *RedisTokenStorage) Get(key string) (string, bool) {
    val, err := r.client.Get(ctx, key).Result()
    return val, err == nil && val != ""
}
func (r *RedisTokenStorage) Set(key, value string, ttl time.Duration) {
    r.client.Set(ctx, key, value, ttl)
}
func (r *RedisTokenStorage) Delete(key string) { r.client.Del(ctx, key) }
```

---

### TODO 8 — `TokenFetcher` · Used in: GetAccessToken

When the cache misses, provide a function to obtain a fresh access token:

| Strategy | When to Use |
|----------|-------------|
| Call SHOPLINE refresh API directly | Most common; use `RefreshToken(handle, appKey, appSecret)` |
| Read `refreshToken` from DB, then call SHOPLINE API | When you want full auditability |
| Read `accessToken` directly from DB | Only if you have a scheduled job that pre-refreshes tokens |

```go
// Go — Strategy A
token, err := auth.GetAccessTokenWithStorage(
    auth.AccessTokenKey(handle, appKey),
    myRedisStorage,
    func() (string, time.Time, error) {
        data, err := auth.RefreshToken(handle, appKey, appSecret)
        if err != nil { return "", time.Time{}, err }
        expiry, _ := time.Parse(time.RFC3339, data.ExpireTime)
        return data.AccessToken, expiry, nil
    },
)
```

---

## Session JWT Reference

<a id="session-jwt-english"></a>

The session JWT is generated by the backend after a successful OAuth callback, then passed to the frontend via the redirect URL (`?token=<jwt>`). The frontend stores it and sends it in the `Authorization: Bearer <token>` header on all subsequent API calls.

### Claims

| Claim | Type | Description |
|-------|------|-------------|
| `handle` | string | Store domain handle |
| `storeId` | number | Numeric SHOPLINE store identifier |
| `appName` | string | Application display name |
| `aud` | string | Application key — used by `AuthMiddleware` to look up the `appSecret` without scanning all apps |
| `iat` | number | Issued-at (Unix seconds) |
| `exp` | number | Expires-at (= `iat + 21600`, i.e. 6 hours) |

**Signing algorithm:** HS256
**Signing key:** `base64(appSecret)` using standard encoding (not URL-safe)

### Why `aud = appKey`?

The middleware faces a chicken-and-egg problem: it needs the `appSecret` to verify the JWT, but the `appSecret` lives in the database indexed by `appKey`. By embedding `appKey` in the `aud` claim, the middleware can:
1. Decode the payload **without verifying** the signature to read `aud`
2. Look up `appSecret` from the database using `aud`
3. Perform full signature verification with the retrieved `appSecret`

---

## Token Cache Key Reference

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `oauth:access_token:{handle}:{appKey}` | Cached access token for a store–app pair | 90% of token's remaining lifetime |
| `oauth:refresh_lock:{handle}:{appKey}` | Distributed lock preventing concurrent token refreshes | 5 seconds |
| `oauth:create_lock:{handle}:{appKey}` | Distributed lock preventing duplicate OAuth code exchanges | 5 seconds |

> **90% TTL rule:** If the token expires in 1 hour, it is cached for 54 minutes. This ensures the token is refreshed before it actually expires, preventing API calls from failing due to stale tokens.

---

## Data Model Reference

### `app` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Internal auto-increment primary key |
| `app_key` | VARCHAR | SHOPLINE app key (unique) |
| `app_secret` | VARCHAR | SHOPLINE app secret (**never expose client-side**) |
| `scopes` | VARCHAR | Comma-separated required scopes |
| `home_url` | VARCHAR | App home page host (without `https://`) |
| `app_name` | VARCHAR | App display name |

### `store_app` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Internal auto-increment primary key |
| `store_id` | BIGINT | Numeric SHOPLINE store identifier |
| `handle` | VARCHAR | Store domain handle |
| `app_key` | VARCHAR | FK → `app.app_key` |
| `is_install` | BOOLEAN | Current installation status |
| `refresh_token` | VARCHAR | OAuth refresh token (persist; used to renew access tokens) |
| `expire_time` | VARCHAR/DATETIME | Access token expiry (from SHOPLINE API) |
| `scopes` | VARCHAR | Scopes granted at installation time |

Unique constraint: `(handle, app_key)`

---

<a id="auth-middleware-reference-english"></a>

## Auth Middleware Reference

Protects your business API routes. Apply it to all routes that require an authenticated store session.

> **Do NOT apply** `AuthMiddleware` to `/app/homepage`, `/app/callback`, or `/webhook/appstore/callback` — these endpoints have their own signature-based authentication.

### Go

```go
mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker,
    http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        info, _ := auth.GetLoginInfo(r.Context())
        // info.Handle, info.StoreID, info.AppKey, info.AppName
    }),
))
```

### JavaScript (Express)

```js
const { authMiddleware } = require('./middleware');
app.get('/api/orders', authMiddleware(loader, checker), (req, res) => {
    const { handle, storeID } = req.loginInfo;
});
```

### PHP

```php
require_once __DIR__ . '/middleware.php';
$loginInfo = requireAuth($appLoader, $installChecker);
// $loginInfo['handle'], ['storeID'], ['appKey']
```

### Python (Flask)

```python
from middleware import require_auth

@app.route("/api/orders")
@require_auth(app_loader=load_app, install_checker=check_install)
def orders(login_info):
    handle = login_info["handle"]
```

### Java (Spring Boot)

```java
// Register in SecurityFilterChain:
http.addFilterBefore(new JwtAuthFilter(appRepo, storeAppRepo, sessionTokenService),
    UsernamePasswordAuthenticationFilter.class);

// In your controller:
LoginInfo info = (LoginInfo) request.getAttribute("loginInfo");
```

---

## Signature Algorithm Reference

### GET Request Signature Verification (homepage / callback)

```
1. Remove the "sign" field from the query parameters.
2. Sort the remaining parameters alphabetically by key (ascending).
3. Concatenate as "key1=value1&key2=value2...".
4. HMAC-SHA256(payload, appSecret) → hex string.
5. Compare with the received sign using constant-time comparison.
```

### POST Request Signature (token create / refresh)

```
source = requestBody + timestamp
sign   = HMAC-SHA256(source, appSecret) → hex string
```

**Timestamp window**: ±10 minutes (Unix milliseconds)

---

## Security Constraints

- `appSecret` must **only** exist on the backend. It must never appear in logs, error responses, frontend code, or CDN assets.
- Signature comparison uses **constant-time comparison** (not `==`) to prevent timing attacks.
- The timestamp window is **±10 minutes**. Ensure your server clock is NTP-synchronized.
- On uninstall, you must **both** clear the token cache **and** update the database. Doing only one is non-compliant.
- **Embedded apps must use App Bridge for OAuth redirect**: when `embedded=1` (i.e., the `lang` parameter was present in the original homepage request), the frontend must call `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)` from `@shoplineos/app-bridge`. Using `window.location.href` in the embedded context only navigates the iframe, not the SHOPLINE Admin shell, and will leave the user in a broken authorization state.
- **[PROHIBITION] Embedded context (`embedded=1` or `lang` parameter present): `window.location.href` and `window.open` are FORBIDDEN for initiating OAuth redirects or any navigation that must break out of the iframe.** The only permitted approach is `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)` from `@shoplineos/app-bridge`. This applies to all code paths including re-authorization triggered by `X-SHOPLINE-API-Request-Failure-Reauthorize`. Violating this rule will leave users stuck in a broken iframe state.
- This Skill only handles the authorization flow and does not include any business plugin logic.

---

## FAQ

**Q: What should I do if signature verification fails?**
A: Check that parameters are sorted correctly, the appSecret matches, and the "sign" field is properly excluded before computing the payload.

**Q: What if the timestamp is rejected as expired?**
A: Requests have a 10-minute window. Check that your server clock is synchronized with NTP.

**Q: What is the difference between embedded and external apps?**
A: Determined by whether the request carries a `lang` parameter. With `lang`: embedded app — the backend redirects to the app home page and the frontend navigates to the OAuth page. Without `lang`: external app — the backend redirects directly to the SHOPLINE OAuth authorization page.

**Q: Why can't I use `window.location.href` to redirect to the OAuth page in an embedded app?**
A: Embedded apps run inside an iframe within the SHOPLINE Admin shell. `window.location.href` only navigates the iframe content; the outer Admin shell does not follow the redirect, so the OAuth page never loads for the user. You must use `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)` from `@shoplineos/app-bridge`, which sends a message to the parent frame and causes the entire Admin shell to navigate to the OAuth page.

---

---

<a id="中文"></a>

# 中文

## 这是什么

`shopline-auth` 是一个即插即用的授权 Skill，帮助开发者在 **30 分钟内**完成 SHOPLINE 公有应用 OAuth 授权接入，无需从头阅读全量开发者文档。

Skill 提供：
- **5 种语言**的完整可运行实现：Go · JavaScript (Node.js) · PHP · Python · Java
- **2 套架构模板**：前后端一体（Monolithic）和前后端分离（Separated）
- 签名验证、Token 缓存、Session JWT 生成、鉴权中间件等开箱即用模块
- 明确的 **8 个 TODO 存根** — 只有这些地方需要你替换为真实的数据库 / Redis 逻辑

---

## 目录结构

```
skills/shopline-auth/
├── references/
│   ├── protocol.md              端点契约、签名规则、Token 生命周期
│   ├── language-adapters.md     各语言适配器骨架示例
│   └── acceptance-checklist.md  验收标准
│
├── script/                        各语言原子模块
│   ├── go/
│   │   ├── sign.go              VerifySign · GeneratePostSign · VerifyTimestamp
│   │   ├── token_store.go       TokenStorage 接口 · MemoryTokenStore · GetAccessToken
│   │   ├── session_token.go     GenerateSessionToken · ParseToken · DecodePayload
│   │   ├── middleware.go        AuthMiddleware · GetLoginInfo · GetHandle · GetStoreID
│   │   ├── homepage.go          HandleHomepage · buildAppHomeURL · scopesEqual
│   │   ├── callback.go          HandleCallback · ExchangeToken · RefreshToken
│   │   └── webhook.go           HandleWebhook
│   ├── js/                      （同上，Express/Node.js）
│   │                            embedded-auth.js  ← 内嵌应用 App Bridge 授权跳转
│   ├── php/                     （同上，原生 PHP）
│   ├── python/                  （同上，Flask）
│   └── java/                    （同上，Spring Boot）
│
├── assets/
│   ├── integrated/              前后端一体模板（Express，SSR）
│   └── separated/               前后端分离模板
│       ├── backend/main.go      Go 后端入口（已接线端点 + 中间件示例）
│       └── frontend/            前端 JS 辅助工具
│
├── README.md                    ← 当前文件（接入指南 + 完整参考）
└── checklist.md                 38 项验收清单
```

---

## 前置条件

在开始之前，请确认以下条件已满足：

1. 已在 [SHOPLINE 开发者平台](https://developers.shopline.com) 注册应用，获得 **appKey** 和 **appSecret**。
2. 已选择应用类型（**公有应用**），并在开发者平台填写应用首页 URL 和回调 URL。
3. 本地或服务器已安装所选语言的运行环境。
4. 应用服务可从公网访问（SHOPLINE 需要回调至你的服务器）。

---

## 快速开始

1. **阅读** `references/protocol.md`，了解端点契约和签名算法。
2. **选择架构**：
   - 前后端一体 → 复制 `assets/integrated/`，参照下方[分步接入指南](#分步接入指南)
   - **前后端分离**（推荐）→ 复制 `assets/separated/`，参照下方[分步接入指南](#分步接入指南)
3. **复制** `script/<你的语言>/` 中的文件到你的项目。
4. **替换**所有 `// TODO` 存根 — 见下方[开发者 TODO 清单](#开发者-todo-清单)。
5. 上线前对照 `checklist.md` 逐项验收。

### 只需要某个功能模块

直接从 `script/<语言>/` 复制对应文件：

| 需求 | 文件 |
|------|------|
| 签名验证 / 生成 | `sign.*` |
| Token 缓存（含 TTL） | `token_store.*` |
| Session JWT 生成 | `session_token.*` |
| Homepage 端点逻辑 | `homepage.*` |
| Callback 端点逻辑 | `callback.*` |
| Webhook 卸载处理 | `webhook.*` |
| **内嵌应用 App Bridge 授权跳转** | **`script/js/embedded-auth.js`** |

> **内嵌应用说明**：运行在 SHOPLINE Admin iframe 内的应用，前端**必须**使用 `script/js/embedded-auth.js`（或 `assets/separated/frontend/auth.js` 中的等效逻辑）发起 OAuth 授权。直接使用 `window.location.href` 只会在 iframe 内跳转，无法突破 iframe 限制——只有 App Bridge 的 `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)` 才能正确发起授权。

---

<a id="分步接入指南"></a>

## 分步接入指南

### 第一步：选择架构

| 架构 | 适用场景 | 参考目录 |
|------|---------|---------|
| **前后端一体** | 小型项目、快速原型、SSR 框架（如 Express + 模板引擎） | `assets/integrated/` |
| **前后端分离** | React/Vue/Next.js 前端 + 独立后端 API | `assets/separated/` |

> **重要**：无论哪种架构，`appSecret` 都必须仅存在于后端，绝不能暴露给前端。

### 第二步：选择语言并复制代码

从 `script/` 目录中选择对应语言的实现：

| 语言 | 目录 | 依赖 |
|------|------|------|
| Go | `script/go/` | `github.com/golang-jwt/jwt/v5` |
| JavaScript (Node.js) | `script/js/` | `express`, `axios`, `jsonwebtoken` |
| PHP | `script/php/` | `firebase/php-jwt` |
| Python | `script/python/` | `flask`, `requests`, `PyJWT` |
| Java | `script/java/` | `spring-web`, `jackson-databind` |

将所选语言目录中的文件复制到你的项目，替换其中标有 `TODO` 的存根函数。

> **内嵌应用（仅 JS）**：如果应用运行在 SHOPLINE Admin iframe 内，还需将 `script/js/embedded-auth.js` 复制到前端项目，并安装 App Bridge：
> ```bash
> npm install @shoplineos/app-bridge
> ```

### 第三步：配置环境变量

复制对应架构目录下的 `.env.example` 到 `.env`，并填入真实值：

```bash
APP_KEY=your_app_key        # 从 SHOPLINE 开发者平台获取
APP_SECRET=your_app_secret  # 从 SHOPLINE 开发者平台获取（仅后端使用）
APP_NAME=my-shopline-app
APP_SCOPES=read_orders,write_orders
APP_HOME_URL=my-app.example.com
```

> `APP_SCOPES` 的值需与开发者平台申请的权限范围完全一致。

### 第四步：实现必要端点

你需要暴露以下三个端点 — 完整参数和逻辑见下方[端点详细说明](#端点详细说明)。

| 端点 | 方法 | 职责 |
|------|------|------|
| `/app/homepage` | GET | 签名校验 → 安装检查 → 内嵌/外跳重定向 |
| `/app/callback` | GET | code 换 token → storeId 提取 → sessionToken → 重定向 |
| `/webhook/appstore/callback` | POST | 卸载事件 → 清 token 缓存 → 更新 DB 安装状态 |

### 第五步：在 SHOPLINE 开发者平台注册

登录 SHOPLINE 开发者平台，完成以下配置：

1. **应用首页 URL**：填写 `GET /app/homepage` 端点的完整公网地址。
   - 示例：`https://my-app.example.com/app/homepage`
2. **授权回调地址**：填写 `GET /app/callback` 端点的完整公网地址。
   - 示例：`https://my-app.example.com/app/callback`
3. **Webhook**：订阅 `应用卸载` 事件，填写 `POST /webhook/appstore/callback` 的完整地址。

### 第六步：实现 Token 存储（生产环境）

代码中的 `token_store` 默认使用本地内存缓存（仅用于演示）。

生产环境中请替换为持久化存储：

| 存储类型 | 说明 |
|---------|------|
| **Redis** | 推荐用于 accessToken 缓存（设置 TTL = token 有效期的 90%） |
| **关系型数据库** | 存储 refreshToken 和安装关系（handle、storeId、scopes） |

查找代码中所有 `// TODO: replace` 注释并按提示替换。

### 第七步：接入鉴权中间件（前后端分离架构必做）

授权流程完成后，前端会将 `sessionToken` 存储并在每次 API 请求时通过 `Authorization: Bearer <token>` 头传给后端。后端需要验证该 Token 才能安全获取当前店铺上下文。

详细实现见下方[鉴权中间件接入说明](#鉴权中间件接入说明)。

> **注意**：`/app/homepage`、`/app/callback`、`/webhook/appstore/callback` 三个端点**不需要**接入鉴权中间件，它们有各自的签名校验。

### 第八步：测试授权流程

1. **启动服务**并确保三个端点可从公网访问。
2. 在 SHOPLINE 后台（测试店铺）找到你的应用并点击 **安装**。
3. SHOPLINE 将请求 `/app/homepage`，检查日志确认签名验证通过。
4. 商家授权后，SHOPLINE 将请求 `/app/callback`，检查日志确认 token 换取成功。
5. 确认最终重定向 URL 中包含有效的 `token` 参数（sessionToken）。
6. 模拟卸载事件，确认 Webhook 端点被调用，token 缓存被清除。

**预期完成时间：≤ 30 分钟**（从复制代码到首次回调成功）。

---

<a id="端点详细说明"></a>

## 端点详细说明

### `GET /app/homepage`

OAuth 流程的入口。商家打开你的应用时由 SHOPLINE 调用。

#### 查询参数

| 参数 | 类型 | 是否必填 | 说明 |
|------|------|:-------:|------|
| `appkey` | string | ✓ | 你的应用 Key，由 SHOPLINE 开发者平台颁发 |
| `handle` | string | ✓ | 店铺域名句柄 — 商家店铺的子域名（如 `my-store.myshopline.com` 中的 `my-store`）|
| `timestamp` | string | ✓ | 请求的 Unix 毫秒时间戳（`Date.now()` 的字符串形式）|
| `sign` | string | ✓ | HMAC-SHA256 签名 — 将所有其他参数按字母升序排列，拼接为 `key=value&...`，用 `appSecret` 签名 |
| `lang` | string | — | **外跳应用**此参数缺失；**内嵌应用**此参数存在。值可能为逗号分隔（如 `en,zh-CN`）— 始终取**第二个**语言代码作为显示语言 |

#### 重定向逻辑

通过签名和时间戳校验后，handler 根据安装状态决定重定向目标：

| 条件 | 重定向目标 | 关键 URL 参数 |
|------|-----------|-------------|
| 已安装 + scope 一致 | 应用首页 | `embedded=1`、`isFromAppListPage=1`、`lang=<code>` + HttpOnly Secure cookie `session_token` |
| 未安装 + `lang` 存在（内嵌应用）| 应用首页（带安装提示） | `embedded=1`、`isFromAppListPage=1`、`lang=<code>`、`uninstalled=true`、`redirectUri=<callbackURL>`、`scope=<scopes>` |
| 未安装 + `lang` 缺失（外跳应用）| SHOPLINE OAuth 授权页 | `appkey`、`scope`、`redirectUri` |

#### 重定向 URL 参数说明

| 参数 | 取值 | 说明 |
|------|------|------|
| `embedded` | `1` 或 `0` | `1` = 内嵌应用（在 SHOPLINE 后台 iframe 内渲染）；`0` = 外跳/独立应用 |
| `isFromAppListPage` | `1` | 固定为 `1`，告知 SHOPLINE 前端此次重定向来自应用列表页 |
| `lang` | 如 `zh-CN` | 显示语言代码，取 `lang` 参数逗号分隔后的第二段 |
| `token` | JWT 字符串 | Session JWT，前端用于后续 API 调用的身份凭证（见 [Session JWT 说明](#session-jwt-说明)）|
| `uninstalled` | `true` | 通知前端该店铺未安装，前端应跳转至 SHOPLINE OAuth 授权页 |
| `redirectUri` | URL 编码字符串 | 商家授权后 SHOPLINE 回调的 callback URL |
| `scope` | URL 编码字符串 | 应用申请的权限范围（逗号分隔）|

---

### `GET /app/callback`

商家授权完成后由 SHOPLINE 调用，用 code 换取 token。

#### 查询参数

| 参数 | 类型 | 是否必填 | 说明 |
|------|------|:-------:|------|
| `appkey` | string | ✓ | 同 homepage |
| `handle` | string | ✓ | 同 homepage |
| `timestamp` | string | ✓ | 同 homepage |
| `sign` | string | ✓ | 签名算法同 homepage |
| `code` | string | ✓ | SHOPLINE 颁发的**一次性** OAuth 授权码。必须尽快换取（code 有效期极短）|
| `lang` | string | — | 同 homepage — 决定最终重定向中 `embedded=1/0` 的取值 |

#### 处理步骤

```
1. 校验签名（HMAC-SHA256，算法同 homepage）
2. 校验时间戳（±10 分钟窗口）
3. code 换 token → POST /admin/oauth/token/create → accessToken + refreshToken
4. 从 accessToken JWT payload 中解析 storeId
5. 在数据库中 Upsert store_app 记录  ← TODO #3
6. 将 accessToken 缓存到 Redis（TTL = 剩余有效期的 90%）
7. 生成 sessionToken → 设置 HttpOnly Secure cookie (session_token)，重定向到应用首页
```

---

### `POST /webhook/appstore/callback`

接收 SHOPLINE 推送的生命周期事件（安装 / 卸载）。

#### 请求体（JSON）

| 字段 | 类型 | 说明 |
|------|------|------|
| `appkey` | string | 你的应用 Key |
| `handle` | string | 店铺域名句柄 |
| `operate` | string | 事件类型：`"uninstall"` 或 `"install"` |
| `store_id` | string | SHOPLINE 店铺 ID（**字符串**，非数字）|
| `merchant_id` | string | SHOPLINE 商家 ID |
| `name` | string | 店铺显示名称 |
| `email` | string | 商家邮箱 |
| `timestamp` | int64 | Unix 毫秒时间戳 |
| `timezone` | string | 店铺时区（如 `"Asia/Shanghai"`）|
| `country_code` | string | 店铺国家代码（如 `"CN"`）|
| `has_extension` | bool | 店铺是否有活跃扩展 |

#### 处理步骤

```
收到 "uninstall"：
  1. 删除缓存中的 accessToken（key：oauth:access_token:{handle}:{appKey}）
  2. 将 store_app 表中 is_install 设为 false  ← TODO #4

收到 "install" / 未知事件：
  返回 200 OK，不做任何处理
  （安装关系已由 /app/callback 持久化）
```

---

## 开发者 TODO 清单

这是你唯一需要替换的 **8 个位置**，其他代码已全部实现。

---

### TODO 1 — `loadApp(appKey)` · 使用位置：homepage、callback、webhook

从数据库按 `appKey` 加载 `App` 记录。

```sql
SELECT id, app_key, app_secret, scopes, home_url, app_name
FROM app
WHERE app_key = ?
```

**返回值字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `appKey` / `app_key` | string | SHOPLINE 应用 Key |
| `appSecret` / `app_secret` | string | SHOPLINE 应用 Secret（**仅后端持有，严禁暴露**）|
| `scopes` | string | 逗号分隔的所需权限（如 `"read_orders,write_orders"`）|
| `homeURL` / `home_url` | string | 应用首页 host（如 `"my-app.example.com"`，不含 `https://`）|
| `appName` / `app_name` | string | 应用显示名称 |

---

### TODO 2 — `loadStoreApp(appKey, handle)` · 使用位置：homepage

加载特定店铺和应用的安装记录。

```sql
SELECT store_id, handle, scopes, is_install, refresh_token
FROM store_app
WHERE app_key = ? AND handle = ?
```

**返回值字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `storeID` / `store_id` | int64 | SHOPLINE 数字店铺 ID |
| `handle` | string | 店铺域名句柄 |
| `scopes` | string | 安装时授权的 scope（逗号分隔）|
| `isInstall` / `is_install` | bool | 当前安装状态 |
| `refreshToken` / `refresh_token` | string | OAuth 刷新 Token（用于续期 accessToken）|

若无记录则返回 `nil` / `null` / `None`，handler 会视为"未安装"。

---

### TODO 3 — `persistRefreshToken(handle, storeID, tokenData)` · 使用位置：callback

OAuth code 换 token 成功后，Upsert 安装记录。

```sql
INSERT INTO store_app (store_id, handle, app_key, refresh_token, expire_time, scopes, is_install)
VALUES (?, ?, ?, ?, ?, ?, true)
ON CONFLICT (handle, app_key) DO UPDATE SET
    store_id      = EXCLUDED.store_id,
    refresh_token = EXCLUDED.refresh_token,
    expire_time   = EXCLUDED.expire_time,
    scopes        = EXCLUDED.scopes,
    is_install    = true
```

**SHOPLINE API 返回的 `tokenData` 字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `accessToken` | string | 短期访问 Token（缓存到 Redis，不持久化）|
| `refreshToken` | string | 长期刷新 Token（**必须持久化到 DB**）|
| `expireTime` | string | accessToken 过期时间（ISO 8601 或 datetime 字符串）|
| `refreshExpireTime` | string | refreshToken 过期时间 |
| `scope` | string | 实际授权的 scope（逗号分隔）|

---

### TODO 4 — `markUninstalled(handle, appKey)` · 使用位置：webhook

商家卸载应用时更新安装状态。

```sql
UPDATE store_app
SET is_install = false
WHERE handle = ?
  AND app_key = ?
```

---

### TODO 5 — `AppLoader(appKey)` · 使用位置：middleware

与 TODO 1 查询相同，作为回调函数传入 `AuthMiddleware`：

```go
// Go
loader := func(appKey string) (*auth.App, error) {
    return db.FindAppByAppKey(appKey)
}
```

```js
// JavaScript
const loader = async (appKey) => db.query('SELECT * FROM app WHERE app_key = ?', [appKey]);
```

```python
# Python
def load_app(app_key: str) -> dict | None:
    return db.fetch_one('SELECT * FROM app WHERE app_key = %s', (app_key,))
```

```php
// PHP
$appLoader = fn($appKey) => $db->fetchApp($appKey);
```

---

### TODO 6 — `InstallChecker(handle, appKey)` · 使用位置：middleware

校验店铺是否已安装应用，并返回 `storeId`：

```sql
SELECT store_id, is_install
FROM store_app
WHERE handle = ? AND app_key = ?
```

```go
// Go
checker := func(handle string, appKey string) (int64, bool, error) {
    row, err := db.FindStoreApp(handle, appKey)
    if err != nil || row == nil { return 0, false, err }
    return row.StoreID, row.IsInstall, nil
}
```

---

### TODO 7 — `TokenStorage` · 使用位置：所有语言，生产环境必须替换

默认的 `MemoryTokenStore` 仅适用于单进程开发环境。生产环境请替换：

| 存储方案 | 适用场景 |
|---------|---------|
| **Redis**（推荐）| 多实例部署 — accessToken 跨进程共享 |
| **关系型数据库** | 已有 DB 基础设施；在 `store_app` 表中增加 `access_token` + `expire_at` 字段 |
| **自定义** | 实现 `Get(key) / Set(key, value, ttl) / Delete(key)` 三个方法即可 |

**Redis 示例（Go）：**
```go
type RedisTokenStorage struct{ client *redis.Client }

func (r *RedisTokenStorage) Get(key string) (string, bool) {
    val, err := r.client.Get(ctx, key).Result()
    return val, err == nil && val != ""
}
func (r *RedisTokenStorage) Set(key, value string, ttl time.Duration) {
    r.client.Set(ctx, key, value, ttl)
}
func (r *RedisTokenStorage) Delete(key string) { r.client.Del(ctx, key) }
```

---

### TODO 8 — `TokenFetcher` · 使用位置：GetAccessToken

缓存未命中时，提供一个获取新 accessToken 的函数：

| 策略 | 说明 |
|------|------|
| 直接调 SHOPLINE refresh API | 最常见；使用 `RefreshToken(handle, appKey, appSecret)` |
| 先从 DB 读 refreshToken，再调 SHOPLINE API | 需要完整审计日志时使用 |
| 直接从 DB 读 accessToken | 仅适用于已有定时刷新任务、DB 中始终保有有效 token 的场景 |

```go
// Go — 策略 A
token, err := auth.GetAccessTokenWithStorage(
    auth.AccessTokenKey(handle, appKey),
    myRedisStorage,
    func() (string, time.Time, error) {
        data, err := auth.RefreshToken(handle, appKey, appSecret)
        if err != nil { return "", time.Time{}, err }
        expiry, _ := time.Parse(time.RFC3339, data.ExpireTime)
        return data.AccessToken, expiry, nil
    },
)
```

---

## Session JWT 说明

<a id="session-jwt-说明"></a>

Session JWT 由后端在 OAuth callback 成功后生成，通过重定向 URL 中的 `?token=<jwt>` 参数传递给前端。前端保存后，在所有后续 API 请求的 `Authorization: Bearer <token>` 头中携带。

### Claims 字段

| Claim | 类型 | 说明 |
|-------|------|------|
| `handle` | string | 店铺域名句柄 |
| `storeId` | number | SHOPLINE 数字店铺 ID |
| `appName` | string | 应用显示名称 |
| `aud` | string | 应用 Key — `AuthMiddleware` 用它查询 `appSecret`，无需全表扫描 |
| `iat` | number | 签发时间（Unix 秒）|
| `exp` | number | 过期时间（= `iat + 21600`，即 6 小时后）|

**签名算法：** HS256
**签名密钥：** `base64(appSecret)`，使用标准编码（非 URL-safe）

### 为什么 `aud = appKey`？

中间件面临一个"鸡和蛋"问题：验证 JWT 需要 `appSecret`，而 `appSecret` 在数据库中按 `appKey` 索引。通过将 `appKey` 放入 `aud` claim，中间件可以：
1. **不验签**解码 payload，读取 `aud`
2. 用 `aud` 从数据库查出 `appSecret`
3. 用 `appSecret` 进行完整签名验证

---

## Token 缓存 Key 说明

| Key 格式 | 用途 | TTL |
|---------|------|-----|
| `oauth:access_token:{handle}:{appKey}` | 店铺-应用对的 accessToken 缓存 | Token 剩余有效期的 90% |
| `oauth:refresh_lock:{handle}:{appKey}` | 分布式锁，防止并发刷新 Token | 5 秒 |
| `oauth:create_lock:{handle}:{appKey}` | 分布式锁，防止重复换 code | 5 秒 |

> **90% TTL 规则：** 若 Token 1 小时后过期，则缓存 54 分钟。确保 Token 在实际过期前完成刷新，避免 API 调用因 Token 过期而失败。

---

## 数据模型说明

### `app` 表

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT | 内部自增主键 |
| `app_key` | VARCHAR | SHOPLINE 应用 Key（唯一）|
| `app_secret` | VARCHAR | SHOPLINE 应用 Secret（**严禁客户端暴露**）|
| `scopes` | VARCHAR | 逗号分隔的所需权限 |
| `home_url` | VARCHAR | 应用首页 host（不含 `https://`）|
| `app_name` | VARCHAR | 应用显示名称 |

### `store_app` 表

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT | 内部自增主键 |
| `store_id` | BIGINT | SHOPLINE 数字店铺 ID |
| `handle` | VARCHAR | 店铺域名句柄 |
| `app_key` | VARCHAR | 外键 → `app.app_key` |
| `is_install` | BOOLEAN | 当前安装状态 |
| `refresh_token` | VARCHAR | OAuth 刷新 Token（必须持久化；用于续期 accessToken）|
| `expire_time` | VARCHAR/DATETIME | accessToken 过期时间（来自 SHOPLINE API）|
| `scopes` | VARCHAR | 安装时授权的 scope |

唯一约束：`(handle, app_key)`

---

<a id="鉴权中间件接入说明"></a>

## 鉴权中间件接入说明

保护你的业务 API 路由。应用到所有需要已登录店铺上下文的路由上。

> **注意：** `/app/homepage`、`/app/callback`、`/webhook/appstore/callback` 三个端点**不需要**接入鉴权中间件 — 它们有各自的签名校验。

### Go

```go
mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker,
    http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        info, _ := auth.GetLoginInfo(r.Context())
        // info.Handle, info.StoreID, info.AppKey, info.AppName
    }),
))
```

### JavaScript（Express）

```js
const { authMiddleware } = require('./middleware');
app.get('/api/orders', authMiddleware(loader, checker), (req, res) => {
    const { handle, storeID } = req.loginInfo;
});
```

### PHP

```php
require_once __DIR__ . '/middleware.php';
$loginInfo = requireAuth($appLoader, $installChecker);
// $loginInfo['handle'], ['storeID'], ['appKey']
```

### Python（Flask）

```python
from middleware import require_auth

@app.route("/api/orders")
@require_auth(app_loader=load_app, install_checker=check_install)
def orders(login_info):
    handle = login_info["handle"]
```

### Java（Spring Boot）

```java
// 在 SecurityFilterChain 中注册：
http.addFilterBefore(new JwtAuthFilter(appRepo, storeAppRepo, sessionTokenService),
    UsernamePasswordAuthenticationFilter.class);

// 在 Controller 中使用：
LoginInfo info = (LoginInfo) request.getAttribute("loginInfo");
```

---

## 签名算法说明

### GET 请求签名验证（homepage / callback）

```
1. 从 query 参数中移除 "sign" 字段
2. 将剩余参数按 key 字母升序排列
3. 拼接为 "key1=value1&key2=value2..."
4. HMAC-SHA256(payload, appSecret) → hex 字符串
5. 与请求中的 sign 进行常量时间比较
```

### POST 请求签名（token create / refresh）

```
source = requestBody + timestamp
sign   = HMAC-SHA256(source, appSecret) → hex 字符串
```

**时间戳窗口**：±10 分钟（Unix 毫秒）

---

## 安全约束

- `appSecret` **只能存在于后端**。严禁出现在日志、错误响应、前端代码或 CDN 资源中。
- 签名比较使用**常量时间比较**（而非 `==`）以防止时序攻击。
- 时间戳窗口为 **±10 分钟**，确保服务器时钟已 NTP 同步。
- 卸载事件必须**同时**清除 Token 缓存并更新数据库，只做其中一项不符合规范。
- **内嵌应用必须通过 App Bridge 发起授权**：当请求含有 `lang` 参数（即 `embedded=1`）时，前端必须调用 `@shoplineos/app-bridge` 的 `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)`。在内嵌场景下使用 `window.location.href` 只会在 iframe 内跳转，整个 SHOPLINE Admin 外壳不会感知，用户将陷入无法完成授权的死循环。
- **【禁止项】内嵌场景（`embedded=1` 或存在 `lang` 参数）下，严禁使用 `window.location.href` / `window.open` 发起 OAuth 跳转或任何需要突破 iframe 的导航。** 唯一允许的方式是 `@shoplineos/app-bridge` 的 `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)`。此规则适用于所有代码路径，包括由 `X-SHOPLINE-API-Request-Failure-Reauthorize` 触发的重新授权流程。违反此规则将导致用户卡在 iframe 死循环中无法完成授权。
- 本 Skill 只处理授权流程，不包含任何业务插件逻辑。

---

## 常见问题

**Q: 签名验证失败怎么办？**
A: 检查参数排序是否正确、appSecret 是否匹配、sign 字段是否被正确排除。

**Q: 时间戳过期怎么办？**
A: 请求有 10 分钟的时间窗口，检查服务器时钟是否与 NTP 同步。

**Q: 内嵌应用和外跳应用有什么区别？**
A: 请求中是否携带 `lang` 参数。携带则为内嵌应用（后端重定向到首页，由前端跳转授权页）；不携带则为外跳应用（后端直接重定向至授权页）。

**Q: 为什么内嵌应用不能用 `window.location.href` 跳转到授权页？**
A: 内嵌应用运行在 SHOPLINE Admin 的 iframe 中，`window.location.href` 只改变 iframe 自身的 URL，外层 Admin 壳不会响应，导致 OAuth 授权页永远无法呈现给用户。必须使用 `@shoplineos/app-bridge` 的 `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)`，它通过 postMessage 与父框架通信，让整个 Admin 壳跳转到授权页。
