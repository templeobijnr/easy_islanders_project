# feat(auth): session-expired UX — prompt, pause, and auto-resume (+ E2E smoke)

## Why
- Prevent transient/expired token 401s from surfacing to users.
- Keep WS stable with keep-alive pings and token-aware reconnect.
- Ensure end-to-end (HTTP → Celery → WS) path stays green.

## What changed
### Frontend
- `frontend/src/shared/components/AuthExpiredModal.tsx` — session expired modal.
- `frontend/src/shared/auth/auth.ts` — `ready()`, `getAccess()`, `refresh()`, `AuthExpiredError`.
- `frontend/src/shared/http/fetchAuth.ts` — auth-aware fetch; single replay on 401.
- `frontend/src/shared/context/ChatContext.tsx` — queue pending on `AuthExpiredError`, auto-resume after re-login.
- `frontend/src/shared/hooks/useChatSocket.ts` — 30s WS ping; reconnect on token change.
- `frontend/src/auth/tokenStore.ts` — `onAccessTokenChange(listener)`.

### Backend / DevOps
- `assistant/management/commands/chat_smoke_test.py` — E2E smoke: 202 enqueue → WS receive.
- `docs/openapi-auth-addendum.md` — cookie-auth HTTP + WS examples.
- `grafana/dashboard.json` — “Active WS Connections”, “WS Send Errors (5m)”.
- `docker-compose.yml` — `env_file=${ENV_FILE:-.env.docker}` for web/celery.
- `.env.staging` — prod-like flags (DEBUG=false, cookies/CORS, feature flags).
- `grafana/ws-min-dashboard.json` — minimal 2-panel dashboard export (new).

## How it works
- API calls are gated on auth readiness; on 401 with `token_not_valid`, we refresh once and replay.
- If refresh fails, we raise `AuthExpiredError`, show modal, queue the message, and auto-resume after login.
- WS sends JSON ping every 30s; reconnects with fresh cookie/token on auth change.

## Tests / Validation
- **CLI**: `python manage.py chat_smoke_test --username admin --password '<pw>'` → `Chat smoke test: OK`.
- **Manual**:
  - Force expired access token → send → modal appears (no error bubble) → login → message resumes and assistant reply lands.
  - Observe WS pings & reconnect after login.
- **Metrics**:
  - `websocket_connections_active` > 0 when chatting.
  - `increase(ws_message_send_errors_total[5m])` ~ 0 on happy path.

## Acceptance criteria
- [x] HTTP enqueue returns 202 with `thread_id`.
- [x] WS handshake succeeds and assistant frame contains `meta.in_reply_to == client_msg_id`.
- [x] Pending bubble resolves via WS; fallback not rendered while WS open.
- [x] Auth-expired flow pauses + auto-resumes post login.
- [x] Grafana panels display connections & 5m error deltas.

## Rollout / Flags
- `FEATURE_FLAG_ALLOW_HEADER_AUTH=true` (keep for mobile/CLI during rollout).
- `FEATURE_FLAG_ALLOW_QUERY_TOKEN=false` (prod hardening).
- CORS: `CORS_ALLOW_CREDENTIALS=true` and allowed origins set.

## Rollback
- Revert to previous build; tokens in header still supported while flag on.
- Frontend gracefully degrades to existing error handling.
