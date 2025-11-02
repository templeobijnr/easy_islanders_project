# Easy Islanders

🔗 [Router Demo Guide](#-router-demo-local-validation)

## 🚀 Router v1.5 (Sprint 5) - Classifier + Calibration + Governance Integration

The router now includes supervised classification, probability calibration, and governance checks for production-ready routing.

### New Features
- **Supervised Classification**: scikit-learn logistic regression classifier trained on router events
- **Probability Calibration**: Platt scaling ensures confidence scores reflect true accuracy
- **Governance Guardrail**: Automatic clarification for low-confidence predictions
- **Self-Evaluation**: Periodic retraining and calibration using recent routing data
- **Enhanced Metrics**: ECE (Expected Calibration Error), accuracy, and uncertainty tracking

### API Response Format
```json
{
  "domain_choice": {
    "domain": "real_estate",
    "confidence": 0.84,
    "calibrated": 0.81,
    "policy_action": "dispatch"
  }
}
```

### Metrics Available
- `router_confidence_histogram` - Confidence score distribution
- `router_calibration_ece` - Expected Calibration Error by domain
- `router_accuracy_total` - Prediction accuracy counters
- `router_uncertain_ratio` - Ratio of uncertain predictions

### Management Commands
```bash
# Update calibration parameters (run nightly)
python3 manage.py update_calibration_params

# Evaluate with new thresholds
python3 scripts/eval_router.py  # accuracy ≥ 0.92, ECE ≤ 0.05, p95 < 120ms
```

## 🧭 Router Demo (Local Validation)

This demo verifies that the intent router works end-to-end in a local dev setup.

### Prerequisites
- Postgres running locally with the `pgvector` extension created:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- Redis optional (set `USE_REDIS_CACHE=true` to enable caching).
- `.env` configured with `DEBUG=True`, `ENABLE_INTENT_PARSER=true`, and a valid `OPENAI_API_KEY` (optional; the router falls back to a hashing-based embedding).

### 1. Apply migrations
```bash
authenv && python3 manage.py migrate
```

### 2. Seed centroids (cached)
```bash
python3 scripts/update_centroids.py
```

### 3. Seed exemplars
```bash
python3 manage.py seed_intent_exemplars
```

### 4. Run the router evaluation
```bash
python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json
```
Expected: accuracy ≈ 1.00, p95 latency ≪ 120 ms.

### 5. Test the live router
Authenticate and test `/api/route`:
```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass"}' | \
  python -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -X POST http://127.0.0.1:8000/api/route/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"utterance":"2br apartment in kyrenia","thread_id":"'"$(uuidgen)"'"}'
```

### 6. View metrics
```bash
curl -sL http://127.0.0.1:8000/api/metrics/ | \
  grep -E "router_requests_total|router_uncertain_total|router_latency_seconds"
```

### 7. Inspect in Admin
Run server:
```bash
python3 manage.py runserver
```
Visit: http://127.0.0.1:8000/admin

Check entries under Router Service → Intent Exemplars / Domain Centroids / Router Events.

---

### Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| role "easy_user" does not exist | Postgres user missing | Create with `CREATE ROLE easy_user LOGIN PASSWORD 'easy_pass';` |
| permission denied to create extension "vector" | Missing superuser privilege | Run `CREATE EXTENSION vector;` as `postgres` |
| IndexError: list index out of range during eval | Missing corpus argument | Use `--corpus scripts/router_eval_corpus.json` |

---

Once this flow passes locally, CI will gate on the same script to ensure latency and accuracy thresholds stay green.

This makes the local validation loop explicit and repeatable.

---

## 🔐 Authentication Model (PR D: Cookie-Based JWT)

The application uses **JWT authentication with HttpOnly cookies** for both HTTP API and WebSocket connections.

### Why Cookies?

- **XSS Protection**: HttpOnly cookies cannot be accessed by JavaScript, preventing token theft via XSS attacks
- **CSRF Protection**: SameSite=Lax prevents cross-site request forgery
- **No Browser History Leaks**: Tokens aren't in URLs or localStorage where they can leak via browser history or logs

### HTTP API Authentication

**Login** (`POST /api/token/`)
```bash
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

Response: Sets `access` and `refresh` cookies (HttpOnly, Secure in production, SameSite=Lax)
```json
{
  "ok": true,
  "message": "Authentication successful. Cookies set."
}
```

**Authenticated Requests**

After login, cookies are automatically sent by the browser. No Authorization header needed for browser clients:

```bash
curl -X GET http://127.0.0.1:8000/api/v1/messages/unread-count/ \
  --cookie "access=<token_from_login>"
```

**Token Refresh** (`POST /api/token/refresh/`)

The refresh endpoint automatically reads the `refresh` cookie and updates both cookies:

```bash
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  --cookie "refresh=<refresh_token>"
```

**Logout** (`POST /api/logout/`)

Clears both cookies:

```bash
curl -X POST http://127.0.0.1:8000/api/logout/ \
  --cookie "access=<token>"
```

### WebSocket Authentication

WebSocket connections authenticate via the same `access` cookie:

```javascript
// Browser automatically sends cookies with WebSocket handshake
const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat/');

ws.onopen = () => {
  console.log('Connected (authenticated via cookie)');
};
```

**Authentication Precedence**:
1. **Cookie** (primary) - `access` cookie from headers
2. **Query param** (dev fallback) - `?token=<jwt>` (only in DEBUG mode or with `FEATURE_FLAG_ALLOW_QUERY_TOKEN=true`)

**Production Security**: Query param authentication is disabled in production to prevent token leaks in server logs.

### Development Fallbacks

For non-browser clients (mobile apps, CLI tools), the Authorization header is still supported in development:

```bash
curl -X GET http://127.0.0.1:8000/api/v1/messages/unread-count/ \
  -H "Authorization: Bearer <access_token>"
```

To disable header auth in production, set `FEATURE_FLAG_ALLOW_HEADER_AUTH=false` in settings.

### Configuration

Key settings in `easy_islanders/settings/base.py`:

```python
# Cookie security
JWT_COOKIE_SECURE = not DEBUG  # HTTPS-only in production
JWT_COOKIE_SAMESITE = 'Lax'    # CSRF protection

# Feature flags
FEATURE_FLAG_ALLOW_QUERY_TOKEN = DEBUG  # Query param auth for WebSockets (dev only)
FEATURE_FLAG_ALLOW_HEADER_AUTH = True   # Authorization header (for non-browser clients)
```

### Migration from Token-in-URL Auth

If you previously used tokens in URLs or localStorage:

1. **Frontend**: Remove token from localStorage, update login to rely on cookies
2. **WebSocket**: Remove `?token=` from WebSocket URLs (browser sends cookies automatically)
3. **Mobile/CLI**: Continue using Authorization header (still supported with `FEATURE_FLAG_ALLOW_HEADER_AUTH=true`)

See [docs/auth-migration-checklist.md](docs/auth-migration-checklist.md) for a detailed migration guide.

---

## 🔒 Gate B WebSocket Guardrail CI

The project includes automated CI checks to prevent WebSocket regressions and ensure production readiness.

### How It Works

**Minimal Checks (Runs on Every PR)**
- Validates WebSocket libraries are present (`uvicorn[standard]`, `websockets`)
- Runs unit tests for URL pattern matching (both `/ws/chat/` and `ws/chat/` forms)
- Verifies startup self-check exists
- **Runs automatically** on PRs that modify WebSocket-related files

**Full E2E Validation (Manual Trigger)**
- Boots full Docker stack (web, celery, db, redis)
- Creates test user and obtains JWT token
- Tests HTTP chat enqueue → WebSocket handshake flow
- Validates Celery queues and Redis connectivity
- Checks Prometheus metrics presence

### Triggering E2E Tests

Navigate to: **Actions** → **Gate B Guardrail** → **Run workflow**

Set `run_e2e: true` to run full stack validation.

### Required Secrets

- `OPENAI_API_KEY` (optional): Only needed if your Celery task path calls the LLM
  - If not set, smoke tests validate HTTP/WebSocket infrastructure only

### What's Protected

✅ WebSocket library dependencies (`uvicorn[standard]`, `websockets`)
✅ URL pattern regex accepts both browser/server forms
✅ Startup fails fast if WebSocket libs missing
✅ Unit tests prevent routing regressions
✅ End-to-end handshake validation

### Files Monitored

- `requirements.txt`
- `assistant/routing.py` (WebSocket URL patterns)
- `assistant/consumers.py` (WebSocket consumer)
- `easy_islanders/asgi.py` (ASGI application)
- `easy_islanders/startup_checks.py` (Dependency validation)
- `tests/test_ws_*.py` (WebSocket tests)

### Local Testing

Run the same checks locally:

```bash
# Minimal unit tests
pytest -xvs tests/test_ws_routes.py tests/test_websocket_libs.py

# Full E2E (requires Docker)
docker compose up -d
# Follow steps in .github/workflows/gate-b-guardrail.yml
```

---
