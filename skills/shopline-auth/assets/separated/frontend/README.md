# shopline-auth — Separated Architecture: Frontend

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

Frontend configuration guide for the separated architecture.

> **Security boundary:** The frontend does not hold `APP_SECRET` and performs no signing operations. The only credential it handles is the `sessionToken` (JWT) issued by the backend.

## File Overview

```
frontend/
├── src/
│   └── shopline-auth.js   # Source: App Bridge OAuth + sessionToken (esbuild input)
├── public/
│   ├── index.html          # HTML entry point
│   └── js/
│       └── shopline-auth.js  # esbuild bundle output (generated, do not edit)
├── package.json            # Dependencies + build/dev scripts
├── .env.example            # Frontend public configuration (no appSecret)
└── README.md
```

## Quick Start

```bash
cp .env.example .env        # Configure environment variables
npm install                  # Install @shoplineos/app-bridge + esbuild
npm run build                # Bundle src/shopline-auth.js → public/js/shopline-auth.js
npm run dev                  # Build + serve public/ on port 3000
```

## How It Works

The frontend uses `@shoplineos/app-bridge` to handle OAuth redirects inside SHOPLINE Admin's iframe. Since browsers cannot resolve bare npm package imports (`import ... from '@shoplineos/app-bridge'`), the source file `src/shopline-auth.js` must be bundled with esbuild before serving.

**`npm run build`** runs:
```bash
npx esbuild src/shopline-auth.js --bundle --outfile=public/js/shopline-auth.js --format=iife
```

This produces a single self-contained `public/js/shopline-auth.js` that includes the full App Bridge library.

## Integration Steps

### 1. Include the Bundle in Your HTML

```html
<!-- App Bridge is bundled inside — do NOT load CDN separately -->
<script src="/js/shopline-auth.js"></script>
```

The script automatically:
- Detects `uninstalled=true` and uses App Bridge `Redirect.toAdminPage(ADMIN_SECTION.OAUTH)` to navigate the SHOPLINE Admin shell to the OAuth page
- Provides `window.authenticatedFetch()` for API calls with `credentials: 'include'` so the HttpOnly Secure `session_token` cookie (set by the backend) is sent automatically
- Handles auto-reauth on 401 via `X-SHOPLINE-API-Request-Failure-Reauthorize` header

### 2. Use authenticatedFetch for API Calls

```js
var fetchFn = window.authenticatedFetch || fetch;
fetchFn('/api/orders')
  .then(function(resp) { return resp.json(); })
  .then(function(data) { console.log(data); });
```

## Embedded vs. External Apps

| Scenario | `lang` param in URL | How it works |
|----------|:-------------------:|-------------|
| Embedded app (SHOPLINE Admin iframe) | Present | Backend redirects to frontend with `uninstalled=true`; frontend uses App Bridge to navigate to OAuth page |
| External app (standalone tab) | Absent | Backend redirects directly to SHOPLINE OAuth page; no frontend action required |

## Session Token Reference

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Lifetime | 6 hours |
| Claims | `handle`, `storeId`, `appName`, `aud` (appKey) |
| Signing key | `base64(appSecret)` — held only by the backend |

---

---

<a id="中文"></a>

# 中文

前后端分离架构的前端配置说明。

> **安全边界**：前端不持有 `APP_SECRET`，不执行任何签名操作。唯一的凭证是后端颁发的 `sessionToken`（JWT）。

## 文件说明

```
frontend/
├── src/
│   └── shopline-auth.js   # 源码：App Bridge OAuth + sessionToken（esbuild 输入）
├── public/
│   ├── index.html          # HTML 入口
│   └── js/
│       └── shopline-auth.js  # esbuild 打包产物（自动生成，勿手动编辑）
├── package.json            # 依赖 + 构建/开发脚本
├── .env.example            # 前端公开配置（无 appSecret）
└── README.md
```

## 快速开始

```bash
cp .env.example .env        # 配置环境变量
npm install                  # 安装 @shoplineos/app-bridge + esbuild
npm run build                # 打包 src/shopline-auth.js → public/js/shopline-auth.js
npm run dev                  # 构建 + 在 3000 端口提供 public/ 静态服务
```

## 工作原理

前端使用 `@shoplineos/app-bridge` 在 SHOPLINE Admin iframe 内处理 OAuth 跳转。由于浏览器无法直接解析 npm 包的 bare import（`import ... from '@shoplineos/app-bridge'`），源文件 `src/shopline-auth.js` 必须通过 esbuild 打包后才能使用。

**`npm run build`** 执行：
```bash
npx esbuild src/shopline-auth.js --bundle --outfile=public/js/shopline-auth.js --format=iife
```

生成一个包含完整 App Bridge 库的独立文件 `public/js/shopline-auth.js`。

## 集成步骤

### 1. 在 HTML 中引入打包文件

```html
<!-- App Bridge 已打包在内 — 不要另外加载 CDN -->
<script src="/js/shopline-auth.js"></script>
```

脚本会自动：
- 检测 `uninstalled=true`，通过 App Bridge `Redirect.toAdminPage(ADMIN_SECTION.OAUTH)` 跳转到 OAuth 授权页
- 提供 `window.authenticatedFetch()`，自动携带 `credentials: 'include'`，使 HttpOnly Secure `session_token` cookie（由后端设置）随请求自动发送
- 通过 `X-SHOPLINE-API-Request-Failure-Reauthorize` header 处理 401 自动重新授权

### 2. 使用 authenticatedFetch 调用 API

```js
var fetchFn = window.authenticatedFetch || fetch;
fetchFn('/api/orders')
  .then(function(resp) { return resp.json(); })
  .then(function(data) { console.log(data); });
```

## 内嵌应用与外跳应用的区别

| 场景 | URL 中是否有 `lang` 参数 | 处理方式 |
|------|:------------------------:|---------|
| 内嵌应用（SHOPLINE Admin iframe） | 有 | 后端重定向到前端 + `uninstalled=true`，前端通过 App Bridge 跳转 OAuth 页 |
| 外跳应用（独立标签页） | 无 | 后端直接重定向到 SHOPLINE OAuth 页，前端无需处理 |

## sessionToken 说明

| 属性 | 值 |
|------|-----|
| 算法 | HS256 |
| 有效期 | 6 小时 |
| 包含字段 | `handle`、`storeId`、`appName`、`aud`（appKey） |
| 签名密钥 | `base64(appSecret)`（仅后端持有）|
