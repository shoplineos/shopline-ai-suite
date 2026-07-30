# Acceptance Checklist

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

Minimal acceptance criteria for the authorization integration. All items must pass before deploying to production.

## OAuth Flow

- [ ] Homepage rejects an invalid `sign`.
- [ ] Homepage rejects an expired timestamp.
- [ ] Callback rejects an invalid `sign`.
- [ ] Callback successfully exchanges the `code` and persists the installation record.
- [ ] Callback redirects with a session token on success.

## Auth Middleware

- [ ] Returns a structured auth error when the `Authorization` header is missing.
- [ ] Extracts `appKey` from the token payload before full signature verification.
- [ ] Rejects a JWT with a tampered signature.
- [ ] Rejects a store that does not have the app installed.
- [ ] Injects the login context into the request for downstream handlers.

## Token Lifecycle

- [ ] Returns the cached token on a cache hit — no refresh API call is made.
- [ ] Refreshes the token exactly once inside the lock on a cache miss.
- [ ] Concurrent refresh requests do not cause duplicate refresh operations.
- [ ] Cache TTL follows the 90% rule of the token's remaining lifetime.

## Webhook

- [ ] Uninstall event updates the installation status to false.
- [ ] Uninstall event clears the access token cache entry.

## Rate Limiting

- [ ] All public endpoints (`/app/*`, `/webhook/*`) have per-IP rate limiting applied (default: 600 req/min).
- [ ] Rate-limited requests return HTTP 429 with a `Retry-After` header.

---

---

<a id="中文"></a>

# 中文

授权接入的最小验收标准。所有条目通过后方可部署到生产环境。

## OAuth 流程

- [ ] Homepage 拒绝无效的 `sign`。
- [ ] Homepage 拒绝过期的时间戳。
- [ ] Callback 拒绝无效的 `sign`。
- [ ] Callback 能够交换 `code` 并持久化安装关系。
- [ ] Callback 成功时携带 session token 进行重定向。

## 鉴权中间件

- [ ] 缺少 `Authorization` 请求头时返回结构化鉴权错误。
- [ ] 在完整签名校验前从 token payload 中提取 `appKey`。
- [ ] 拒绝被篡改签名的 JWT。
- [ ] 拒绝未安装该应用的店铺。
- [ ] 为下游业务处理器注入登录上下文。

## Token 生命周期

- [ ] 缓存命中时直接返回 token，不触发 refresh API 调用。
- [ ] 缓存未命中时在锁内只刷新一次。
- [ ] 并发刷新请求不会产生重复刷新操作。
- [ ] 缓存 TTL 遵循 token 剩余生命周期的 90% 规则。

## Webhook

- [ ] 卸载事件将安装状态更新为 false。
- [ ] 卸载事件清除对应的 access token 缓存条目。

## 速率限制

- [ ] 所有公开端点（`/app/*`、`/webhook/*`）已应用基于 IP 的速率限制（默认：每分钟 600 次）。
- [ ] 超限请求返回 HTTP 429 并携带 `Retry-After` 响应头。
