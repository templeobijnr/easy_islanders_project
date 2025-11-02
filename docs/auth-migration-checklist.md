# Authentication Migration Checklist

This guide covers migrating from token-based authentication (tokens in URLs, localStorage, or Authorization headers) to the new cookie-based JWT authentication system implemented in PR D.

## Overview of Changes

| Before (Token-Based) | After (Cookie-Based) |
|---------------------|---------------------|
| Tokens in localStorage | HttpOnly cookies (XSS-safe) |
| Tokens in URL query params | Cookies in headers (no history leaks) |
| Manual Authorization header | Automatic cookie transmission |
| XSS vulnerability | Protected by HttpOnly flag |
| Token leaks in logs/history | Cookies never logged |

## Pre-Deployment Checklist

### Backend Verification

- [ ] **Verify cookie auth module exists**: Check that `assistant/auth/` directory contains:
  - `__init__.py`
  - `cookies.py` (cookie utilities + `CookieJWTAuthentication`)
  - `views.py` (`CookieTokenObtainPairView`, `CookieTokenRefreshView`, `logout_view`)
  - `ws_cookie_auth.py` (`CookieOrQueryTokenAuthMiddleware`)

- [ ] **Verify settings configuration** in `easy_islanders/settings/base.py`:
  ```python
  # Authentication classes (cookie-first)
  REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
      'assistant.auth.cookies.CookieJWTAuthentication',  # PRIMARY
      'rest_framework_simplejwt.authentication.JWTAuthentication',  # Fallback
      ...
  ]

  # Cookie security settings
  JWT_COOKIE_SECURE = not DEBUG  # HTTPS-only in production
  JWT_COOKIE_SAMESITE = 'Lax'
  FEATURE_FLAG_ALLOW_QUERY_TOKEN = DEBUG  # Query param for WebSocket (dev only)
  FEATURE_FLAG_ALLOW_HEADER_AUTH = True   # Authorization header fallback
  ```

- [ ] **Verify URL routing** in `easy_islanders/urls.py`:
  ```python
  from assistant.auth.views import (
      CookieTokenObtainPairView,
      CookieTokenRefreshView,
      logout_view,
  )

  urlpatterns = [
      path('api/token/', CookieTokenObtainPairView.as_view(), ...),
      path('api/token/refresh/', CookieTokenRefreshView.as_view(), ...),
      path('api/logout/', logout_view, ...),
  ]
  ```

- [ ] **Verify ASGI configuration** in `easy_islanders/asgi.py`:
  ```python
  from assistant.auth.ws_cookie_auth import CookieOrQueryTokenAuthMiddleware

  application = ProtocolTypeRouter({
      "websocket": CookieOrQueryTokenAuthMiddleware(
          URLRouter(websocket_urlpatterns)
      ),
  })
  ```

- [ ] **Run tests**:
  ```bash
  pytest tests/test_auth_cookies.py -xvs
  pytest tests/test_ws_cookie_auth.py -xvs
  ```

### Frontend Verification

- [ ] **Update login flow**:
  ```javascript
  // BEFORE: Store token in localStorage
  const response = await axios.post('/api/token/', credentials);
  localStorage.setItem('token', response.data.access);

  // AFTER: No manual storage needed (cookies are set automatically)
  const response = await axios.post('/api/token/', credentials);
  // Cookies are now set by server. No client-side token handling needed.
  ```

- [ ] **Remove token from axios interceptors**:
  ```javascript
  // BEFORE: Manual Authorization header injection
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // AFTER: Remove this interceptor (cookies are sent automatically)
  // OR keep it as fallback for non-browser clients with feature flag check
  ```

- [ ] **Update WebSocket connection**:
  ```javascript
  // BEFORE: Token in URL query param
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);

  // AFTER: No token needed (cookies sent automatically in handshake)
  const ws = new WebSocket('ws://localhost:8000/ws/chat/');
  ```

- [ ] **Update logout flow**:
  ```javascript
  // BEFORE: Remove from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');

  // AFTER: Call logout endpoint to clear cookies
  await axios.post('/api/logout/');
  // Cookies are cleared by server
  ```

- [ ] **Ensure axios withCredentials is enabled** (for cookie transmission):
  ```javascript
  axios.defaults.withCredentials = true;
  // OR per-request:
  axios.get('/api/endpoint/', { withCredentials: true });
  ```

### CORS Configuration

- [ ] **Update CORS settings** in `easy_islanders/settings/base.py`:
  ```python
  CORS_ALLOWED_ORIGINS = [
      'http://localhost:3000',  # React dev server
      'https://yourdomain.com',  # Production frontend
  ]

  CORS_ALLOW_CREDENTIALS = True  # REQUIRED for cookies
  ```

## Deployment Steps

### Phase 1: Deploy Backend (Backward Compatible)

1. **Deploy backend with cookie auth enabled**:
   ```bash
   git checkout frontend/fix-imports-prototype-rev6  # Or your PR D branch
   python3 manage.py migrate  # No migrations needed, but run to be safe
   python3 manage.py collectstatic --noinput
   # Restart backend services
   ```

2. **Verify backward compatibility**:
   - Old clients using Authorization headers should still work
   - Feature flag `FEATURE_FLAG_ALLOW_HEADER_AUTH=true` ensures compatibility

3. **Test cookie login endpoint**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/token/ \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpass"}' \
     -c cookies.txt  # Save cookies to file

   # Verify cookies are set
   cat cookies.txt | grep -E "access|refresh"
   ```

4. **Test cookie-authenticated request**:
   ```bash
   curl -X GET http://127.0.0.1:8000/api/v1/messages/unread-count/ \
     -b cookies.txt  # Load cookies from file
   ```

### Phase 2: Deploy Frontend

1. **Deploy updated frontend** with cookie-based auth

2. **Monitor login success rates** (should remain 100%)

3. **Monitor WebSocket connection success** (should remain stable)

### Phase 3: Gradual Rollout (Optional)

If you want to roll out gradually:

1. **Week 1**: Backend supports both cookies and headers (current state)
2. **Week 2**: Deploy updated frontend, monitor metrics
3. **Week 3**: Analyze logs for remaining header auth usage
4. **Week 4**: Optionally disable header auth in production:
   ```python
   FEATURE_FLAG_ALLOW_HEADER_AUTH = False  # Force cookie-only auth
   ```

## Post-Deployment Validation

### Smoke Tests

- [ ] **Test login flow**:
  ```bash
  # Login and verify cookies are set
  curl -i -X POST http://your-domain.com/api/token/ \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"testpass"}'

  # Check for Set-Cookie headers in response
  # Should see: Set-Cookie: access=...; HttpOnly; Secure; SameSite=Lax
  ```

- [ ] **Test authenticated request**:
  ```bash
  # Browser: Login via UI, then check Network tab for subsequent requests
  # Should see Cookie header with access token
  ```

- [ ] **Test token refresh**:
  ```bash
  # Wait for access token to expire (~5 minutes default)
  # Frontend should automatically call /api/token/refresh/
  # Verify new access cookie is set
  ```

- [ ] **Test logout**:
  ```bash
  curl -X POST http://your-domain.com/api/logout/ \
    -b "access=<token>"

  # Verify cookies are cleared (max-age=0 in Set-Cookie response)
  ```

- [ ] **Test WebSocket with cookies**:
  ```javascript
  // Browser console:
  const ws = new WebSocket('ws://your-domain.com/ws/chat/');
  ws.onopen = () => console.log('Connected with cookie auth');
  ws.onerror = (err) => console.error('Connection failed', err);
  ```

### Security Validation

- [ ] **Verify HttpOnly flag** (prevents XSS):
  ```bash
  # Check Set-Cookie headers include HttpOnly
  curl -i -X POST http://your-domain.com/api/token/ \
    -d '{"username":"user","password":"pass"}' | grep -i httponly
  ```

- [ ] **Verify Secure flag** (HTTPS-only in production):
  ```bash
  # In production (DEBUG=false), verify Secure flag is present
  # In development, Secure flag should be absent
  ```

- [ ] **Verify SameSite=Lax** (CSRF protection):
  ```bash
  curl -i -X POST http://your-domain.com/api/token/ \
    -d '{"username":"user","password":"pass"}' | grep -i samesite
  ```

- [ ] **Verify no tokens in response body**:
  ```bash
  # Response should NOT contain "access" or "refresh" keys
  # Only contains: {"ok": true, "message": "Authentication successful..."}
  ```

### Monitoring

- [ ] **Check error rates** for authentication failures (should be stable)

- [ ] **Monitor WebSocket connection success rate** (should be stable)

- [ ] **Check browser console** for CORS errors (should be none if configured correctly)

- [ ] **Analyze server logs** for:
  - No token leaks (tokens should not appear in URL logs)
  - Cookie auth usage (should see `auth_method=cookie` in WebSocket logs)

## Rollback Plan

If issues arise after deployment:

### Quick Rollback (Frontend Only)

1. **Revert frontend** to previous version using token-based auth
2. Backend still supports Authorization headers via `FEATURE_FLAG_ALLOW_HEADER_AUTH=true`
3. Zero downtime

### Full Rollback (Backend + Frontend)

1. **Revert backend** to commit before PR D merge:
   ```bash
   git revert <pr-d-merge-commit>
   # OR
   git checkout <previous-commit>
   ```

2. **Revert frontend** to previous version

3. **Restart services**

4. **Verify** token-based auth works as before

## Troubleshooting

### Issue: Cookies not being set

**Symptoms**: Login succeeds but no cookies in browser

**Causes**:
- CORS_ALLOW_CREDENTIALS not set to True
- Frontend not sending withCredentials: true
- Domain mismatch (localhost vs 127.0.0.1)

**Fix**:
```python
# Backend settings
CORS_ALLOW_CREDENTIALS = True

# Frontend axios config
axios.defaults.withCredentials = true;
```

### Issue: 401 Unauthorized after login

**Symptoms**: Login works but subsequent requests fail with 401

**Causes**:
- Cookies not being sent by browser (withCredentials not set)
- Cookie path mismatch
- Cookie expired

**Fix**:
```javascript
// Ensure withCredentials is set for all requests
axios.defaults.withCredentials = true;

// Check cookie path in DevTools (should be '/')
// Check cookie expiration
```

### Issue: WebSocket connection fails with cookies

**Symptoms**: WebSocket handshake fails after migrating to cookies

**Causes**:
- Browser not sending cookies with WebSocket handshake
- ASGI middleware not properly extracting cookies
- Cookie domain/path mismatch

**Fix**:
```javascript
// Ensure WebSocket URL is same-origin as HTTP API
// Cookies are automatically sent for same-origin WebSocket connections

// In development, use query param fallback:
const token = localStorage.getItem('token');  // If you still have it
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);
```

### Issue: CORS errors in browser console

**Symptoms**:
```
Access to XMLHttpRequest blocked by CORS policy:
The value of the 'Access-Control-Allow-Credentials' header is ''
which must be 'true' when the request's credentials mode is 'include'.
```

**Fix**:
```python
# Backend settings (easy_islanders/settings/base.py)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    # Add your frontend domains
]
```

### Issue: Tokens still in URL logs

**Symptoms**: Server logs show `?token=...` in WebSocket URLs

**Causes**:
- Frontend not updated to remove query param
- `FEATURE_FLAG_ALLOW_QUERY_TOKEN` still enabled in production

**Fix**:
```python
# Production settings
DEBUG = False
FEATURE_FLAG_ALLOW_QUERY_TOKEN = False  # Disable query param auth

# Update frontend to remove token from WebSocket URL
const ws = new WebSocket('ws://your-domain.com/ws/chat/');  // No ?token=
```

## Additional Resources

- **Django Cookies**: https://docs.djangoproject.com/en/5.2/ref/request-response/#django.http.HttpResponse.set_cookie
- **JWT Security Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- **CORS with Credentials**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials
- **HttpOnly Cookies**: https://owasp.org/www-community/HttpOnly
- **WebSocket Authentication**: https://channels.readthedocs.io/en/stable/topics/authentication.html

## Support

For issues or questions:
1. Check server logs for authentication errors
2. Check browser DevTools → Network tab → Cookies
3. Review this checklist for missed configuration steps
4. Check `docs/pr-d-implementation-status.md` for implementation details
