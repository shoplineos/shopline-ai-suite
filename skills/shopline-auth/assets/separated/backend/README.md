# shopline-auth — Separated Architecture: Backend

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

Backend service for the separated architecture: exposes only the three SHOPLINE OAuth endpoints and does not serve any frontend assets.

> **Security requirement:** `APP_SECRET` lives only in this backend service. It must never appear in frontend code, build artifacts, or CDN assets. All signing operations are performed here.

## Directory Structure

```
backend/
├── main.go         # HTTP server entry point — route registration, CORS middleware
└── .env.example    # Environment variable template
```

`main.go` imports the authorization modules from `script/go/` (`homepage.go`, `callback.go`, `webhook.go`, `sign.go`, `token_store.go`, `middleware.go`, `rate_limiter.go`).

All public endpoints are protected by per-IP rate limiting (600 req/min). Requests exceeding the limit receive HTTP 429 with a `Retry-After` header.

## Quick Start

### 1. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
APP_KEY=your_app_key
APP_SECRET=your_app_secret          # Backend only — never expose to frontend
APP_NAME=my-shopline-app
APP_SCOPES=read_orders,write_orders
FRONTEND_DOMAIN=my-app-frontend.example.com   # Frontend public domain (for redirect URLs)
CORS_ORIGIN=https://my-app-frontend.example.com
PORT=8080
```

### 2. Replace Stub Functions

Open `main.go` and replace the following stubs with real implementations:

| Function / Callback | Description |
|---------------------|-------------|
| `loadApp()` | Load app config from database or configuration |
| `loadStoreApp(app, handle)` | Query store installation record; return nil if not installed |
| `persistRefreshToken` callback | Write refresh token to database |
| `getStoreID` callback | Resolve storeId via external service (fallback if JWT extraction fails) |
| `markUninstalled` callback | Set installation status to false |
| `loader` (AuthMiddleware) | Load app by appKey for JWT verification |
| `checker` (AuthMiddleware) | Verify store installation and return storeId |

### 3. Start the Server

```bash
go run main.go
# Output: [shopline-auth] separated backend listening on :8080
```

### 4. Verify Endpoints

```bash
curl http://localhost:8080/health
# Expected: {"status":"ok"}
```

## Register on SHOPLINE Developer Platform

| Configuration | Value |
|---------------|-------|
| App home page URL | `https://<backend-domain>/app/homepage` |
| Authorization callback URL | `https://<backend-domain>/app/callback` |
| Webhook (app uninstall) | `https://<backend-domain>/webhook/appstore/callback` |

## CORS Configuration

The `corsMiddleware` in `main.go` sets `Access-Control-Allow-Origin: <CORS_ORIGIN>`.
If the frontend domain changes, update the `CORS_ORIGIN` environment variable — no code changes needed.

Allowed request headers: `Content-Type`, `Authorization` (for passing the session token).

## Token Flow

```
Frontend page loads
  → Backend /app/homepage verifies and redirects
  → SHOPLINE authorization page
  → Backend /app/callback exchanges code for token, sets HttpOnly Secure cookie (session_token), redirects to frontend
  → Subsequent API calls automatically include session_token cookie
  → Backend AuthMiddleware validates JWT (from Authorization header or session_token cookie), injects LoginInfo into request context
```

## Protecting Business API Routes

Apply `AuthMiddleware` to all routes that require an authenticated store session:

```go
mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker,
    http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        info, _ := auth.GetLoginInfo(r.Context())
        // info.Handle, info.StoreID, info.AppKey, info.AppName
    }),
))
```

> **Do NOT apply** `AuthMiddleware` to `/app/homepage`, `/app/callback`, or `/webhook/appstore/callback`.

## Production Notes

- Replace the in-memory token store (`NewMemoryTokenStore()`) with a Redis implementation (see `token_store.go`).
- For multi-instance deployments, add a distributed lock around the token refresh call in `GetAccessToken` (see the TODO comment in `token_store.go`).
- Use an HTTPS reverse proxy to serve all endpoints over port 443.

---

---

<a id="中文"></a>

# 中文

前后端分离架构的后端服务：仅暴露三个 SHOPLINE OAuth 端点，不服务任何前端资源。

> **安全要求**：`APP_SECRET` 只存在于此后端服务，绝对不能出现在前端代码、构建产物或 CDN 中。所有签名操作在此后端完成。

## 目录结构

```
backend/
├── main.go         # HTTP 服务入口，路由注册，CORS 中间件
└── .env.example    # 环境变量模板
```

`main.go` 引用 `script/go/` 中的授权模块（`homepage.go`、`callback.go`、`webhook.go`、`sign.go`、`token_store.go`、`middleware.go`、`rate_limiter.go`）。

所有公开端点均已启用基于 IP 的速率限制（每分钟 600 次）。超限请求返回 HTTP 429 并携带 `Retry-After` 响应头。

## 快速启动

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
APP_KEY=your_app_key
APP_SECRET=your_app_secret        # 仅后端持有，前端不可见
APP_NAME=my-shopline-app
APP_SCOPES=read_orders,write_orders
FRONTEND_DOMAIN=my-app-frontend.example.com   # 前端公网域名（用于构建 callback URL 和重定向）
CORS_ORIGIN=https://my-app-frontend.example.com
PORT=8080
```

### 2. 替换存根函数

打开 `main.go`，将以下函数替换为真实实现：

| 函数 / 回调 | 说明 |
|------------|------|
| `loadApp()` | 从数据库或配置加载 App 信息 |
| `loadStoreApp(app, handle)` | 查询店铺安装记录，未安装返回 nil |
| `persistRefreshToken` callback | 将 refreshToken 写入数据库 |
| `getStoreID` callback | 通过外部服务解析 storeId（JWT 提取失败时的兜底） |
| `markUninstalled` callback | 将安装状态置为 false |
| `loader`（AuthMiddleware）| 按 appKey 加载 App，用于 JWT 验证 |
| `checker`（AuthMiddleware）| 校验店铺安装状态并返回 storeId |

### 3. 启动服务

```bash
go run main.go
# 输出：[shopline-auth] separated backend listening on :8080
```

### 4. 验证端点

```bash
curl http://localhost:8080/health
# 期望：{"status":"ok"}
```

## 在 SHOPLINE 开发者平台配置

| 配置项 | 填写值 |
|--------|--------|
| 应用首页 URL | `https://<后端域名>/app/homepage` |
| 授权回调地址 | `https://<后端域名>/app/callback` |
| Webhook（应用卸载） | `https://<后端域名>/webhook/appstore/callback` |

## CORS 说明

`main.go` 中的 `corsMiddleware` 已配置 `Access-Control-Allow-Origin: <CORS_ORIGIN>`。
若前端域名变更，更新 `CORS_ORIGIN` 环境变量即可，无需修改代码。

允许的请求头：`Content-Type`、`Authorization`（用于传递 sessionToken）。

## Token 传递流程

```
前端页面加载
  → 后端 /app/homepage 验证并重定向
  → SHOPLINE 授权页
  → 后端 /app/callback 换取 token，设置 HttpOnly Secure cookie (session_token)，重定向至前端
  → 后续 API 调用自动携带 session_token cookie
  → 后端 AuthMiddleware 验证 JWT（从 Authorization header 或 session_token cookie），将 LoginInfo 注入 request context
```

## 业务路由保护

在所有需要已登录店铺上下文的路由上应用 `AuthMiddleware`：

```go
mux.Handle("/api/orders", auth.AuthMiddleware(loader, checker,
    http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        info, _ := auth.GetLoginInfo(r.Context())
        // info.Handle, info.StoreID, info.AppKey, info.AppName
    }),
))
```

> `/app/homepage`、`/app/callback`、`/webhook/appstore/callback` **不需要**接入 `AuthMiddleware`。

## 生产注意事项

- 将内存 token 缓存（`NewMemoryTokenStore()`）替换为 Redis 实现（见 `token_store.go`）。
- 多实例部署时，在 `GetAccessToken` 的 fetch 调用外层增加分布式锁（`token_store.go` 有 TODO 说明）。
- 使用 HTTPS 反向代理，确保所有端点通过 443 对外提供服务。
