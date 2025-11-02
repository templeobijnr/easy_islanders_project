# OpenAPI Auth Addendum — Cookie‑Based JWT (PR D)

This addendum supplements the existing OpenAPI docs with cookie examples for login, refresh, and logout using HttpOnly cookies. Header auth remains available behind a feature flag for non‑browser clients.

## Security Scheme (cookie first)

```yaml
components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: access        # HttpOnly access cookie set by the server
    bearerAuth:           # optional fallback for non‑browser clients
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Global default (recommended):

```yaml
security:
  - cookieAuth: []
```

## Endpoints

### POST /api/token/  (Login → Set-Cookie)

- Description: Authenticate with username/password. Server sets two cookies:
  - `access` (HttpOnly, Secure, SameSite=Lax, short TTL)
  - `refresh` (HttpOnly, Secure, SameSite=Lax, longer TTL)
- Response body contains only a small status payload; tokens are not returned in JSON.

```yaml
paths:
  /api/token/:
    post:
      summary: Login (cookie‑based)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username: { type: string }
                password: { type: string }
              required: [username, password]
      responses:
        '200':
          description: Cookies set
          headers:
            Set-Cookie:
              schema:
                type: string
              description: >
                HttpOnly cookies `access` and `refresh` are set. Example:
                `Set-Cookie: access=...; HttpOnly; Secure; Path=/; SameSite=Lax`
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok: { type: boolean }
                  message: { type: string }
```

Curl example:

```bash
curl -i -X POST https://api.example.com/api/token/ \
  -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"pass"}' \
  -c cookies.txt
```

---

### POST /api/token/refresh/  (Rotate access cookie)

- Description: Reads `refresh` cookie, validates it, and sets a new `access` (and rotated `refresh` if configured). No tokens in JSON.

```yaml
  /api/token/refresh/:
    post:
      summary: Refresh access cookie
      responses:
        '200':
          description: Cookies updated
          headers:
            Set-Cookie:
              schema:
                type: string
              description: >
                Updated `access` cookie (and optionally rotated `refresh`).
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok: { type: boolean }
                  message: { type: string }
```

Curl example:

```bash
curl -i -X POST https://api.example.com/api/token/refresh/ -b cookies.txt
```

---

### POST /api/logout/  (Clear cookies)

- Description: Clears both cookies by setting them with `max-age=0`.

```yaml
  /api/logout/:
    post:
      summary: Logout (clear cookies)
      responses:
        '204':
          description: No Content; cookies cleared
          headers:
            Set-Cookie:
              schema:
                type: string
              description: >
                `Set-Cookie: access=; Max-Age=0;` and `refresh=; Max-Age=0;`
```

Curl example:

```bash
curl -i -X POST https://api.example.com/api/logout/ -b cookies.txt
```

## WebSocket Authentication

- Cookie‑first: Browsers send cookies automatically during the WS handshake.
- Fallback: Query token allowed only in DEBUG (feature flag: FEATURE_FLAG_ALLOW_QUERY_TOKEN).

Example (browser):

```js
const ws = new WebSocket('wss://api.example.com/ws/chat/<thread_id>/');
```

Example (non‑browser client, with cookies):

```bash
websocat -H "Cookie: access=<jwt>; refresh=<jwt>" \
  wss://api.example.com/ws/chat/<thread_id>/
```

## Notes
- For cross‑site SPAs, set `CORS_ALLOW_CREDENTIALS=true` and whitelist your frontend origin.
- In production, `JWT_COOKIE_SECURE=true` (requires HTTPS).
- Keep `FEATURE_FLAG_ALLOW_HEADER_AUTH=true` during migration for mobile/CLI; disable later if desired.

