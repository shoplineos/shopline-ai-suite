# Language Adapters

**Language / 语言：** [English](#english) ｜ [中文](#中文)

---

<a id="english"></a>

# English

Skeleton examples for implementing `AuthMiddleware` in each supported language.
All adapters follow the same 5-step verification flow defined in `protocol.md §3`.

## Go (net/http)

```go
func AuthMiddleware(loader AppLoader, checker InstallChecker, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := extractBearer(r.Header.Get("Authorization"))
        payload, _ := decodePayload(token)             // Step 2: no-sig decode
        app, _ := loader(appKeyFromClaims(payload))    // Step 3: load appSecret
        claims, _ := parseToken(token, app.AppSecret)  // Step 4: full verify
        storeID, ok, _ := checker(claims.Handle, app.AppKey) // Step 5: check install
        if !ok { writeAuthError(w, "not installed"); return }
        ctx := context.WithValue(r.Context(), loginKey, LoginInfo{
            Handle: claims.Handle, StoreID: storeID,
            AppKey: app.AppKey, AppName: app.AppName,
        })
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Node.js (Express)

```js
function authMiddleware(appLoader, installChecker) {
  return async (req, res, next) => {
    const token = extractBearer(req.headers['authorization']);
    const payload = decodePayload(token);              // Step 2: no-sig decode
    const app = await appLoader(getAppKey(payload));   // Step 3: load appSecret
    const claims = parseToken(token, app.appSecret);   // Step 4: full verify
    const storeApp = await installChecker(claims.handle, app.appKey); // Step 5
    if (!storeApp?.isInstall) return res.status(401).json({ error: 'not_installed' });
    req.loginInfo = { handle: claims.handle, storeID: storeApp.storeId,
                      appKey: app.appKey, appName: app.appName };
    next();
  };
}
```

## Java (Spring Boot — OncePerRequestFilter)

```java
public class JwtAuthFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
    String token = readBearer(req.getHeader("Authorization"));
    Map<String, Object> payload = sessionTokenService.decodePayload(token); // Step 2
    AppConfig app = appRepository.findByAppKey(extractAppKey(payload));     // Step 3
    Claims claims = sessionTokenService.parse(token, app.getAppSecret());    // Step 4
    StoreApp storeApp = storeAppRepository.findByHandleAndAppKey(            // Step 5
        claims.get("handle", String.class), app.getAppKey());
    if (storeApp == null || !storeApp.isInstall()) { sendAuthError(res); return; }
    req.setAttribute("loginInfo", new LoginInfo(
        claims.get("handle", String.class), storeApp.getStoreId(),
        app.getAppKey(), app.getAppName()));
    chain.doFilter(req, res);
  }
}
```

## PHP (native)

```php
function requireAuth(callable $appLoader, callable $installChecker): array {
    $token  = extractBearer($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $payload = decodePayload($token);                      // Step 2: no-sig decode
    $app    = $appLoader(getAppKey($payload));              // Step 3: load appSecret
    $claims = parseToken($token, $app['appSecret']);        // Step 4: full verify
    $row    = $installChecker($claims->handle, $app['appKey']); // Step 5: check install
    if (!$row || !$row['isInstall']) { authError('not installed'); }
    return ['handle' => $claims->handle, 'storeID' => $row['storeID'],
            'appKey' => $app['appKey']];
}
```

## Python (Flask — decorator)

```python
def require_auth(app_loader, install_checker):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            token    = extract_bearer(request.headers.get('Authorization', ''))
            payload  = decode_payload(token)                      # Step 2: no-sig decode
            app      = app_loader(get_app_key(payload))           # Step 3: load app_secret
            claims   = parse_token(token, app['app_secret'])      # Step 4: full verify
            store_app = install_checker(claims['handle'], app['app_key']) # Step 5
            if not store_app or not store_app.get('is_install'):
                return jsonify({'error': 'not_installed'}), 401
            login_info = {'handle': claims['handle'], 'store_id': store_app['store_id'],
                          'app_key': app['app_key']}
            return fn(login_info, *args, **kwargs)
        return wrapper
    return decorator
```

---

## Common Notes

- **Signing key derivation must be identical across all languages:**
  `base64(appSecret)` using standard (non-URL-safe) encoding, then used as the HMAC key.
- **Query signature sort and concatenation must be deterministic:**
  Sort keys alphabetically, join as `key=value&...`, exclude the `sign` key itself.
- **Error codes must be consistent** across missing token, invalid token, and not-installed scenarios.
- **Never log or return `appSecret`** in error responses.

---

---

<a id="中文"></a>

# 中文

各语言 `AuthMiddleware` 实现骨架示例。
所有适配器遵循 `protocol.md §3` 定义的同一套 5 步校验流程。

## Go (net/http)

```go
func AuthMiddleware(loader AppLoader, checker InstallChecker, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := extractBearer(r.Header.Get("Authorization"))
        payload, _ := decodePayload(token)             // 步骤 2：不验签解码
        app, _ := loader(appKeyFromClaims(payload))    // 步骤 3：加载 appSecret
        claims, _ := parseToken(token, app.AppSecret)  // 步骤 4：完整校验
        storeID, ok, _ := checker(claims.Handle, app.AppKey) // 步骤 5：校验安装关系
        if !ok { writeAuthError(w, "not installed"); return }
        ctx := context.WithValue(r.Context(), loginKey, LoginInfo{
            Handle: claims.Handle, StoreID: storeID,
            AppKey: app.AppKey, AppName: app.AppName,
        })
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Node.js（Express）

```js
function authMiddleware(appLoader, installChecker) {
  return async (req, res, next) => {
    const token = extractBearer(req.headers['authorization']);
    const payload = decodePayload(token);              // 步骤 2：不验签解码
    const app = await appLoader(getAppKey(payload));   // 步骤 3：加载 appSecret
    const claims = parseToken(token, app.appSecret);   // 步骤 4：完整校验
    const storeApp = await installChecker(claims.handle, app.appKey); // 步骤 5
    if (!storeApp?.isInstall) return res.status(401).json({ error: 'not_installed' });
    req.loginInfo = { handle: claims.handle, storeID: storeApp.storeId,
                      appKey: app.appKey, appName: app.appName };
    next();
  };
}
```

## Java（Spring Boot — OncePerRequestFilter）

```java
public class JwtAuthFilter extends OncePerRequestFilter {
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
    String token = readBearer(req.getHeader("Authorization"));
    Map<String, Object> payload = sessionTokenService.decodePayload(token); // 步骤 2
    AppConfig app = appRepository.findByAppKey(extractAppKey(payload));     // 步骤 3
    Claims claims = sessionTokenService.parse(token, app.getAppSecret());    // 步骤 4
    StoreApp storeApp = storeAppRepository.findByHandleAndAppKey(            // 步骤 5
        claims.get("handle", String.class), app.getAppKey());
    if (storeApp == null || !storeApp.isInstall()) { sendAuthError(res); return; }
    req.setAttribute("loginInfo", new LoginInfo(
        claims.get("handle", String.class), storeApp.getStoreId(),
        app.getAppKey(), app.getAppName()));
    chain.doFilter(req, res);
  }
}
```

## PHP（原生）

```php
function requireAuth(callable $appLoader, callable $installChecker): array {
    $token   = extractBearer($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $payload = decodePayload($token);                      // 步骤 2：不验签解码
    $app     = $appLoader(getAppKey($payload));             // 步骤 3：加载 appSecret
    $claims  = parseToken($token, $app['appSecret']);       // 步骤 4：完整校验
    $row     = $installChecker($claims->handle, $app['appKey']); // 步骤 5：校验安装关系
    if (!$row || !$row['isInstall']) { authError('not installed'); }
    return ['handle' => $claims->handle, 'storeID' => $row['storeID'],
            'appKey' => $app['appKey']];
}
```

## Python（Flask — 装饰器）

```python
def require_auth(app_loader, install_checker):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            token     = extract_bearer(request.headers.get('Authorization', ''))
            payload   = decode_payload(token)                       # 步骤 2：不验签解码
            app       = app_loader(get_app_key(payload))            # 步骤 3：加载 app_secret
            claims    = parse_token(token, app['app_secret'])       # 步骤 4：完整校验
            store_app = install_checker(claims['handle'], app['app_key']) # 步骤 5
            if not store_app or not store_app.get('is_install'):
                return jsonify({'error': 'not_installed'}), 401
            login_info = {'handle': claims['handle'], 'store_id': store_app['store_id'],
                          'app_key': app['app_key']}
            return fn(login_info, *args, **kwargs)
        return wrapper
    return decorator
```

---

## 共通说明

- **各语言的 JWT 签名密钥推导方式必须完全一致：**
  `base64(appSecret)`，使用标准编码（非 URL-safe），以此作为 HMAC 密钥。
- **query 签名的排序和拼接过程必须具有确定性：**
  按字母升序排列 key，拼接为 `key=value&...`，排除 `sign` key 本身。
- **各错误场景（缺少 token、token 无效、未安装）的错误码必须保持一致。**
- **严禁在错误响应中记录或返回 `appSecret`。**
