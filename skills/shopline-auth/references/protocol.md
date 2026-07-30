# Protocol Reference

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

## 1. OAuth Entry Points

### `GET /app/homepage`

- **Input:** `appkey`, `handle`, `timestamp`, `sign`; optional `lang`
- **Steps:**
  1. Resolve the app and load `appSecret` using `appkey`.
  2. Verify the query-parameter signature.
  3. Verify the timestamp offset.
  4. Check the store installation relationship and whether scopes match exactly.
  5. If installed → redirect to the app home page; if not installed → redirect to the SHOPLINE OAuth authorization URL.

### `GET /app/callback`

- **Input:** `appkey`, `code`, `handle`, `timestamp`, `sign`; optional `lang`
- **Steps:**
  1. Resolve the app using `appkey`.
  2. Verify the query-parameter signature and timestamp.
  3. Exchange the OAuth code for a token.
  4. Persist the store installation record and the refresh token.
  5. Generate a session JWT and redirect to the app home page.

### `POST /webhook/appstore/callback`

- **Steps:**
  1. Read the raw request body.
  2. Verify the webhook signature: compute `HMAC-SHA256(rawBody, appSecret)` and compare with the `X-Shopline-Hmac-Sha256` header using constant-time comparison. Return 401 if the signature is missing or invalid.
  3. Parse the JSON request body.
  4. On `"uninstall"`: clear the access token cache and mark the installation status as false.
  5. On `"install"` / unknown events: return 200 OK and take no action.

---

## 2. Signing Rules

### Query Signature (homepage / callback)

1. Remove `sign` from the query parameter map.
2. Sort remaining keys alphabetically (ascending).
3. Concatenate as `key1=value1&key2=value2...`.
4. Compute `HMAC-SHA256(payload, appSecret)`, hex-encode the result.
5. Compare with the received `sign` using **constant-time comparison**.

### POST Signature (OAuth token API)

- Source string: `requestBody + timestamp`
- Header signature: `HMAC-SHA256(source, appSecret)`, hex-encoded

### Webhook Signature

SHOPLINE sends a signature in the `X-Shopline-Hmac-Sha256` HTTP header with every webhook request.

1. Read the **raw request body** (before JSON parsing).
2. Compute `HMAC-SHA256(rawBody, appSecret)`, hex-encode the result.
3. Compare with the `X-Shopline-Hmac-Sha256` header value using **constant-time comparison**.
4. Reject the request with HTTP 401 if the signature is missing or does not match.

### Timestamp

- Reject the request if the absolute offset from the current server time exceeds **10 minutes**.
- The timestamp is a Unix millisecond integer sent as a string.

---

## 3. Session JWT Convention

**Required claims:**

| Claim | Type | Description |
|-------|------|-------------|
| `handle` | string | Store domain handle |
| `storeId` | number | Numeric SHOPLINE store identifier |
| `appName` | string | Application display name |
| `aud` | string | `appKey` — allows the middleware to look up `appSecret` without a full table scan |
| `iat` | number | Issued-at (Unix seconds) |
| `exp` | number | Expires-at (`iat + 21600`, i.e. 6 hours) |

**Signing key:** `base64(appSecret)` using standard encoding (not URL-safe).

**Middleware verification steps:**

1. Extract the Bearer token from the `Authorization` header.
2. Decode the JWT payload **without verifying the signature** to read the `aud` / `appKey` claim.
3. Load `appSecret` from the database using `appKey`.
4. Verify the full token signature and expiry using `appSecret`.
5. Verify that the store has the app installed.
6. Inject the login context into the request context.

---

## 4. Token Lifecycle Convention

**Cache keys:**

| Key | Purpose |
|-----|---------|
| `oauth:access_token:{handle}:{appKey}` | Cached access token |
| `oauth:refresh_lock:{handle}:{appKey}` | Distributed lock for token refresh |
| `oauth:create_lock:{handle}:{appKey}` | Distributed lock for token creation |

**Rules:**

1. Check the cache first.
2. On a miss: acquire the distributed lock, refresh the token exactly once, write back to cache.
3. If the lock is already held: wait and poll the cache until the token appears or the timeout is reached.
4. Cache TTL = **90%** of the token's remaining lifetime.

---

## 5. Minimum Data Model

**App:**

| Field | Type | Description |
|-------|------|-------------|
| `appKey` | string | SHOPLINE app key (used for lookups) |
| `appSecret` | string | SHOPLINE app secret (server-side only) |
| `scopes` | string | Comma-separated required permission scopes |

**StoreApp:**

| Field | Type | Description |
|-------|------|-------------|
| `storeId` | int64 | Numeric SHOPLINE store identifier |
| `handle` | string | Store domain handle |
| `appKey` | string | FK → App.appKey |
| `isInstall` | bool | Current installation status |
| `refreshToken` | string | OAuth refresh token (persist; used to renew access tokens) |
| `expireTime` | string | Access token expiry (from SHOPLINE API) |
| `scopes` | string | Scopes granted at installation time |

**Runtime context (injected by AuthMiddleware):**

| Field | Description |
|-------|-------------|
| `handle` | Store domain handle |
| `storeId` | Numeric store identifier |
| `appKey` | Application key |
| `appName` | Application display name |

---

---

<a id="中文"></a>

# 中文

## 1. OAuth 入口

### `GET /app/homepage`

- **输入：** `appkey`、`handle`、`timestamp`、`sign`；可选 `lang`
- **步骤：**
  1. 根据 `appkey` 解析应用并加载 `appSecret`。
  2. 校验查询参数签名。
  3. 校验时间戳偏移。
  4. 检测安装关系和权限范围是否严格一致。
  5. 已安装 → 重定向到应用首页；未安装 → 重定向到 SHOPLINE OAuth 授权 URL。

### `GET /app/callback`

- **输入：** `appkey`、`code`、`handle`、`timestamp`、`sign`；可选 `lang`
- **步骤：**
  1. 根据 `appkey` 解析应用。
  2. 校验查询参数签名和时间戳。
  3. 使用 OAuth code 交换 token。
  4. 持久化店铺安装关系和 refresh token。
  5. 生成 session JWT 并重定向到应用首页。

### `POST /webhook/appstore/callback`

- **步骤：**
  1. 读取原始请求体。
  2. 验证 webhook 签名：计算 `HMAC-SHA256(rawBody, appSecret)`，与请求头 `X-Shopline-Hmac-Sha256` 使用常量时间比较。签名缺失或不匹配时返回 401。
  3. 解析 JSON 请求体。
  4. 收到 `"uninstall"` 时：清除 access token 缓存并将安装状态标记为 false。
  5. 收到 `"install"` / 未知事件时：返回 200 OK，不做任何处理。

---

## 2. 签名规则

### 查询签名（homepage / callback）

1. 从 query map 中移除 `sign`。
2. 将剩余 key 按字母升序排列。
3. 按 `key1=value1&key2=value2...` 形式拼接。
4. 计算 `HMAC-SHA256(payload, appSecret)`，结果进行十六进制编码。
5. 使用**常量时间比较**与请求中收到的 `sign` 对比。

### POST 签名（OAuth token API）

- 源字符串：`request_body + timestamp`
- 请求头签名：`HMAC-SHA256(source, appSecret)`，十六进制编码

### Webhook 签名

SHOPLINE 在每个 webhook 请求的 `X-Shopline-Hmac-Sha256` HTTP 请求头中发送签名。

1. 读取**原始请求体**（JSON 解析之前）。
2. 计算 `HMAC-SHA256(rawBody, appSecret)`，结果进行十六进制编码。
3. 与 `X-Shopline-Hmac-Sha256` 请求头的值使用**常量时间比较**。
4. 如果签名缺失或不匹配，返回 HTTP 401 拒绝请求。

### 时间戳

- 如果与当前服务器时间的绝对偏移超过 **10 分钟**，则拒绝请求。
- 时间戳为 Unix 毫秒整数，以字符串形式传递。

---

## 3. Session JWT 约定

**必需 claims：**

| Claim | 类型 | 说明 |
|-------|------|------|
| `handle` | string | 店铺域名句柄 |
| `storeId` | number | SHOPLINE 数字店铺 ID |
| `appName` | string | 应用显示名称 |
| `aud` | string | `appKey` — 中间件用它查询 `appSecret`，无需全表扫描 |
| `iat` | number | 签发时间（Unix 秒）|
| `exp` | number | 过期时间（`iat + 21600`，即 6 小时后）|

**签名密钥：** `base64(appSecret)`，使用标准编码（非 URL-safe）。

**中间件校验步骤：**

1. 从 `Authorization` 请求头提取 Bearer token。
2. **不验签**解码 JWT payload，读取 `aud` / `appKey` claim。
3. 根据 `appKey` 从数据库加载 `appSecret`。
4. 使用 `appSecret` 校验完整 token 签名和过期时间。
5. 校验店铺与应用的安装关系。
6. 将登录上下文注入 request context。

---

## 4. Token 生命周期约定

**缓存 key：**

| Key | 用途 |
|-----|------|
| `oauth:access_token:{handle}:{appKey}` | 缓存的 access token |
| `oauth:refresh_lock:{handle}:{appKey}` | Token 刷新的分布式锁 |
| `oauth:create_lock:{handle}:{appKey}` | Token 创建的分布式锁 |

**规则：**

1. 先读缓存。
2. 命中失败时：加分布式锁；只刷新一次 token；写回缓存。
3. 如果锁正在被占用：等待并轮询缓存，直到 token 出现或超时。
4. 缓存 TTL = token 剩余有效期的 **90%**。

---

## 5. 最小数据模型

**App：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `appKey` | string | SHOPLINE 应用 Key（用于查询）|
| `appSecret` | string | SHOPLINE 应用 Secret（仅后端持有）|
| `scopes` | string | 逗号分隔的所需权限 |

**StoreApp：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `storeId` | int64 | SHOPLINE 数字店铺 ID |
| `handle` | string | 店铺域名句柄 |
| `appKey` | string | 外键 → App.appKey |
| `isInstall` | bool | 当前安装状态 |
| `refreshToken` | string | OAuth 刷新 Token（需持久化；用于续期 accessToken）|
| `expireTime` | string | accessToken 过期时间（来自 SHOPLINE API）|
| `scopes` | string | 安装时授权的 scope |

**运行时上下文（由 AuthMiddleware 注入）：**

| 字段 | 说明 |
|------|------|
| `handle` | 店铺域名句柄 |
| `storeId` | 数字店铺 ID |
| `appKey` | 应用 Key |
| `appName` | 应用显示名称 |
