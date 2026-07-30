# SHOPLINE App Authorization — Integration Checklist

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

Use this checklist to verify your implementation before go-live.
All items must be checked before considering the integration complete.

---

## Configuration

- [ ] `APP_KEY` is set as an environment variable (not hardcoded in source code)
- [ ] `APP_SECRET` is set as an environment variable and is **never** sent to the frontend
- [ ] `APP_SCOPES` matches exactly the permission scopes applied for on the SHOPLINE Developer Platform
- [ ] `APP_HOME_URL` points to the correct public domain of your deployed service

---

## SHOPLINE Developer Platform Registration

- [ ] App home page URL is registered on the SHOPLINE Developer Platform (points to `/app/homepage`)
- [ ] Authorization callback URL is registered on the SHOPLINE Developer Platform (points to `/app/callback`)
- [ ] Webhook is subscribed to the **App Uninstall** event (points to `/webhook/appstore/callback`)
- [ ] All registered URLs are reachable from the public internet

---

## Endpoint Availability

- [ ] `GET /app/homepage` is deployed and returns a redirect (not a 404 or 500)
- [ ] `GET /app/callback` is deployed and returns a redirect (not a 404 or 500)
- [ ] `POST /webhook/appstore/callback` is deployed and returns 200 OK

---

## Signature Verification

- [ ] Signature verification unit test passes: correct signature → verified
- [ ] Signature verification unit test passes: incorrect signature → rejected
- [ ] Timestamp unit test passes: timestamp within 10 min → accepted
- [ ] Timestamp unit test passes: expired timestamp → rejected

---

## Authorization Flow

- [ ] **Embedded app path tested**: request with `lang` parameter → backend redirects to app home with `uninstalled=true`; frontend navigates to SHOPLINE OAuth page
- [ ] **External app path tested**: request without `lang` parameter → backend redirects directly to SHOPLINE OAuth page
- [ ] **Already installed path tested**: request with installed store → backend redirects to app home with `session_token` set as HttpOnly Secure cookie
- [ ] **Scope mismatch tested**: installed store with outdated scopes → re-authorization triggered

---

## Token Lifecycle

- [ ] Callback endpoint successfully exchanges OAuth code for `accessToken` and `refreshToken`
- [ ] `refreshToken` is persisted to your database (not stored only in memory)
- [ ] `accessToken` is cached with TTL = 90% of token remaining lifetime
- [ ] Token refresh (`POST /admin/oauth/token/refresh`) is implemented and tested
- [ ] Access token is correctly passed to downstream SHOPLINE API calls

---

## Webhook

- [ ] Webhook signature verification is implemented: compute `HMAC-SHA256(rawBody, appSecret)` and compare with `X-Shopline-Hmac-Sha256` header
- [ ] Webhook returns 401 when signature is missing or invalid
- [ ] Webhook signature comparison uses constant-time comparison (not `==`)
- [ ] Uninstall event clears the `accessToken` cache (not just updates the database)
- [ ] Uninstall event updates the install status in your database to `false` / `uninstalled`

---

## Auth Middleware (Separated Architecture)

- [ ] `AuthMiddleware` has been applied to all business API routes (not to `/app/homepage`, `/app/callback`, `/webhook/appstore/callback`)
- [ ] `AppLoader` callback is implemented with a real database query (not the stub)
- [ ] `InstallChecker` callback is implemented with a real database query (not the stub)
- [ ] `ParseToken` unit test passes: valid token + correct secret → returns claims
- [ ] `ParseToken` unit test passes: expired token → returns error
- [ ] `ParseToken` unit test passes: tampered signature → returns error
- [ ] `DecodePayload` unit test passes: valid JWT → returns payload map with `aud` / `handle` / `storeId`
- [ ] Handler correctly retrieves login context from request (e.g. `auth.GetLoginInfo(r.Context())`)

---

## Security

- [ ] `appSecret` is never logged or included in error responses
- [ ] `appSecret` is never included in frontend code, browser storage, or CDN assets
- [ ] Signature comparison uses constant-time comparison (not `==` string equality)
- [ ] All `// TODO: replace with Redis / DB for production` comments have been addressed
- [ ] Rate limiting is applied to all public endpoints (`/app/homepage`, `/app/callback`, `/webhook/appstore/callback`) — default: 600 req/min per IP

---

## Embedded / External OAuth Verification

> These 4 test cases verify that the embedded App Bridge prohibition rule and external fallback work correctly. All must pass before go-live.

- [ ] **Case 1 — Embedded first install (no nested iframe)**
  - Open the app from the SHOPLINE Admin app list (embedded mode, `lang` present).
  - The store has **never** installed this app.
  - Expected: backend redirects to app home with `uninstalled=true`; frontend calls `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)`; the **entire Admin shell** navigates to the OAuth page — **no** second-layer iframe appears inside the Admin.
  - Fail if: the OAuth page renders **inside** the existing iframe (nested iframe / "套娃"), or the page stays blank.

- [ ] **Case 2 — Scope change re-authorization (no nested iframe)**
  - The store has already installed the app, but the app's required `APP_SCOPES` have been updated (added a new permission).
  - Open the app from the SHOPLINE Admin (embedded mode).
  - Expected: backend detects scope mismatch → same redirect as Case 1 → App Bridge OAuth redirect; user sees the OAuth consent screen at the Admin top level, **not** nested inside an iframe.
  - Fail if: `window.location.href` is used, causing the OAuth page to load inside the iframe.

- [ ] **Case 3 — Post-callback refresh / re-entry (no auth loop)**
  - Complete a successful OAuth callback (code exchanged, session token set).
  - Refresh the page (F5 / Cmd+R) or close and re-open the app from the SHOPLINE Admin.
  - Expected: the app loads normally with the existing `session_token` cookie; **no** OAuth redirect is triggered again.
  - Fail if: each refresh or re-entry triggers a new OAuth redirect, creating an infinite authorization loop.

- [ ] **Case 4 — External (non-embedded) mode still works**
  - Access `/app/homepage` **without** the `lang` parameter (simulating an external / non-embedded app).
  - The store has **not** installed the app.
  - Expected: backend redirects directly to `https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?...`; the full-page browser navigates to the SHOPLINE OAuth page normally.
  - Fail if: an App Bridge redirect is attempted (App Bridge is not available outside the Admin iframe), or the redirect fails silently.

---

## Production Readiness

- [ ] Local in-memory token store has been replaced with Redis or equivalent
- [ ] Refresh token is stored in a persistent database with a backup strategy
- [ ] Service is deployed with HTTPS (required for SHOPLINE callbacks)
- [ ] Error responses do not leak internal implementation details

---

---

<a id="中文"></a>

# 中文

上线前用此清单验证你的实现。所有条目完成后方可视为接入完成。

---

## 配置项

- [ ] `APP_KEY` 通过环境变量配置（未硬编码在源代码中）
- [ ] `APP_SECRET` 通过环境变量配置，且**绝不**发送到前端
- [ ] `APP_SCOPES` 与 SHOPLINE 开发者平台上申请的权限范围完全一致
- [ ] `APP_HOME_URL` 指向已部署服务的正确公网域名

---

## SHOPLINE 开发者平台注册

- [ ] 应用首页 URL 已在 SHOPLINE 开发者平台注册（指向 `/app/homepage`）
- [ ] 授权回调地址已在 SHOPLINE 开发者平台注册（指向 `/app/callback`）
- [ ] Webhook 已订阅**应用卸载**事件（指向 `/webhook/appstore/callback`）
- [ ] 所有已注册的 URL 均可从公网访问

---

## 端点可用性

- [ ] `GET /app/homepage` 已部署并返回重定向（非 404 或 500）
- [ ] `GET /app/callback` 已部署并返回重定向（非 404 或 500）
- [ ] `POST /webhook/appstore/callback` 已部署并返回 200 OK

---

## 签名验证

- [ ] 签名验证单元测试通过：正确签名 → 验证通过
- [ ] 签名验证单元测试通过：错误签名 → 被拒绝
- [ ] 时间戳单元测试通过：10 分钟内的时间戳 → 被接受
- [ ] 时间戳单元测试通过：过期时间戳 → 被拒绝

---

## 授权流程

- [ ] **内嵌应用路径已测试**：携带 `lang` 参数的请求 → 后端重定向到应用首页并附带 `uninstalled=true`；前端跳转至 SHOPLINE OAuth 授权页
- [ ] **外跳应用路径已测试**：不携带 `lang` 参数的请求 → 后端直接重定向到 SHOPLINE OAuth 授权页
- [ ] **已安装路径已测试**：已安装的店铺请求 → 后端重定向到应用首页并设置 HttpOnly Secure cookie `session_token`
- [ ] **Scope 不匹配已测试**：已安装但 scope 已过期的店铺 → 触发重新授权

---

## Token 生命周期

- [ ] Callback 端点成功将 OAuth code 换取 `accessToken` 和 `refreshToken`
- [ ] `refreshToken` 已持久化到数据库（未仅存储在内存中）
- [ ] `accessToken` 已缓存，TTL = token 剩余有效期的 90%
- [ ] Token 刷新（`POST /admin/oauth/token/refresh`）已实现并测试
- [ ] access token 被正确传递给下游 SHOPLINE API 调用

---

## Webhook

- [ ] Webhook 签名验证已实现：计算 `HMAC-SHA256(rawBody, appSecret)` 并与 `X-Shopline-Hmac-Sha256` 请求头比较
- [ ] Webhook 在签名缺失或无效时返回 401
- [ ] Webhook 签名比较使用常量时间比较（而非 `==`）
- [ ] 卸载事件清除了 `accessToken` 缓存（而非仅更新数据库）
- [ ] 卸载事件将数据库中的安装状态更新为 `false` / `uninstalled`

---

## 鉴权中间件（前后端分离架构）

- [ ] `AuthMiddleware` 已应用于所有业务 API 路由（未应用于 `/app/homepage`、`/app/callback`、`/webhook/appstore/callback`）
- [ ] `AppLoader` 回调已用真实数据库查询实现（非存根）
- [ ] `InstallChecker` 回调已用真实数据库查询实现（非存根）
- [ ] `ParseToken` 单元测试通过：有效 token + 正确 secret → 返回 claims
- [ ] `ParseToken` 单元测试通过：过期 token → 返回错误
- [ ] `ParseToken` 单元测试通过：篡改签名 → 返回错误
- [ ] `DecodePayload` 单元测试通过：有效 JWT → 返回包含 `aud` / `handle` / `storeId` 的 payload map
- [ ] Handler 正确从请求中获取登录上下文（如 `auth.GetLoginInfo(r.Context())`）

---

## 安全性

- [ ] `appSecret` 从未被记录到日志或包含在错误响应中
- [ ] `appSecret` 从未出现在前端代码、浏览器存储或 CDN 资源中
- [ ] 签名比较使用常量时间比较（而非 `==` 字符串相等）
- [ ] 所有 `// TODO: replace with Redis / DB for production` 注释均已处理
- [ ] 所有公开端点（`/app/homepage`、`/app/callback`、`/webhook/appstore/callback`）已应用速率限制——默认：每 IP 每分钟 600 次

---

## 内嵌 / 外跳 OAuth 验收用例

> 以下 4 个测试用例验证内嵌 App Bridge 禁止规则和外跳兜底逻辑是否正确。上线前必须全部通过。

- [ ] **用例 1 — 内嵌首次安装（不出现二层 iframe）**
  - 从 SHOPLINE Admin 应用列表打开应用（内嵌模式，请求携带 `lang` 参数）。
  - 该店铺**从未**安装过此应用。
  - 预期：后端重定向到应用首页并附带 `uninstalled=true`；前端调用 `Redirect.toAdminPage(ADMIN_SECTION.OAUTH, ...)`；**整个 Admin 外壳**跳转到 OAuth 授权页——Admin 内**不会**出现二层 iframe。
  - 判定失败：OAuth 授权页渲染在已有 iframe **内部**（出现套娃 / 嵌套 iframe），或页面停留空白。

- [ ] **用例 2 — Scope 变化重授权（不出现套娃）**
  - 店铺已安装过应用，但应用所需的 `APP_SCOPES` 已更新（新增了权限）。
  - 从 SHOPLINE Admin 打开应用（内嵌模式）。
  - 预期：后端检测到 scope 不匹配 → 与用例 1 相同的重定向 → App Bridge OAuth 跳转；用户在 Admin 顶层看到 OAuth 授权同意页面，**不是**嵌套在 iframe 内。
  - 判定失败：使用了 `window.location.href`，导致 OAuth 页面加载在 iframe 内部。

- [ ] **用例 3 — 回调后刷新 / 重进（不重复触发授权循环）**
  - 完成一次成功的 OAuth 回调（code 已换取 token，session_token 已设置）。
  - 刷新页面（F5 / Cmd+R）或关闭后从 SHOPLINE Admin 重新打开应用。
  - 预期：应用凭已有的 `session_token` cookie 正常加载；**不会**再次触发 OAuth 跳转。
  - 判定失败：每次刷新或重进都触发新的 OAuth 跳转，形成无限授权循环。

- [ ] **用例 4 — 外跳模式仍可正常授权**
  - **不携带** `lang` 参数访问 `/app/homepage`（模拟外跳 / 非内嵌应用）。
  - 该店铺**未**安装此应用。
  - 预期：后端直接重定向到 `https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?...`；浏览器全页面跳转到 SHOPLINE OAuth 授权页，流程正常完成。
  - 判定失败：尝试了 App Bridge 跳转（Admin iframe 外不可用），或跳转静默失败。

---

## 生产就绪

- [ ] 本地内存 token 缓存已替换为 Redis 或等效方案
- [ ] refresh token 已存储在具有备份策略的持久化数据库中
- [ ] 服务已通过 HTTPS 部署（SHOPLINE 回调要求）
- [ ] 错误响应未泄露内部实现细节
