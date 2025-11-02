# Chat Flow Findings & Recommendations

| ID | Severity | Area | Root Cause | Reproduction | Recommended Fix | Owner | ETA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CF-001 | High | Observability | No correlation ID or trace propagation across HTTP → Celery → WS, making it impossible to align logs for a single chat turn. | Send a message; inspect API/Celery logs – no common identifiers. | ✅ Implemented in Phase C: frontend generates UUID per send, propagates via HTTP header & WS `cid`, recorded in logs/metrics through correlation filter. | Platform | 1 sprint |
| CF-002 | High | Reliability | Celery eager mode (`CELERY_TASK_ALWAYS_EAGER=True`) hides queueing behaviour and failures in dev/staging. | Observe Celery worker logs – tasks execute inline inside API process. | ✅ Implemented in Phase C: dev settings now execute through Redis/worker; compose stack starts dedicated worker. | Platform | 1 sprint |
| CF-003 | High | Latency | `run_supervisor_agent` executes synchronously with no streaming updates; LLM latency (1–4 s) delays assistant bubble. | Send “hello”; measure 1–4 s delay before assistant response. | ✅ Implemented in Phase C: Celery emits typing status immediately, final reply clears the pending bubble, typing indicator cleared in finally block. | AI Platform | 2 sprints |
| CF-004 | Medium | UX/Reliability | WS disconnect (token expiry, network flap) silently closes socket with code 4401; UI shows no error. | Expire JWT, observe socket close and no user feedback. | Add toast + auto-refresh token flow; expose connection status banner. | Frontend | 1 sprint |
| CF-005 | Medium | Observability | No slow-query logging; ORM lookups for `ConversationThread` + `Message` unindexed beyond basic fields. | Run `DEBUG=1`, inspect SQL logs; no duration metrics. | Enable Django DB logging with threshold >100 ms; add index on `conversation_id` if query patterns expand. | Backend | 1 sprint |
| CF-006 | Medium | Reliability | WebSocket `chat_message` payload lacks deterministic message ordering metadata (sequence/timestamp). | Send rapid messages; rely on timestamp ordering from DB. | Include monotonic sequence number or use DB `created_at` to order before dispatch; enforce ordering in frontend. | Backend | 1 sprint |
| CF-007 | Medium | Backpressure | No automated alert if Redis/Celery queue backlog grows (risk of silent latency spikes). | Simulate worker pause; no alerts triggered. | Export Celery queue depth metrics + alert thresholds (e.g., queue > 50 for 5 min). | SRE | 1 sprint |
| CF-008 | Low | Testing | No automated tests covering WS happy path/error handling (only HTTP & legacy hooks). | Review `/frontend` tests – no WS mocks. | Add Cypress/Playwright e2e covering WS handshake, message receipt, reconnection. | Frontend QA | 2 sprints |
| CF-009 | Low | Observability | Channels consumer logs only at console.log level; no structured event when user joins/leaves group. | Inspect Channels logs – minimal info. | Add structured logging around `connect`/`disconnect` with thread_id, user_id, correlation_id. | Backend | 1 sprint |
| CF-010 | Low | Data lifecycle | Assistant `Message` records store `meta.recommendations` only in payload, not in DB. | Inspect DB row – no structured metadata beyond text. | Persist recommendations JSON (e.g., in `Message.meta`) to support replay/audit. | Backend | 2 sprints |

## Additional Notes

- See `docs/chat-flow.md` for detailed sequence and instrumentation plan.
- Populate `docs/chat-metrics.csv` with real samples once instrumentation changes land.
- Ensure Ops checklist (below) is distributed to on-call rotation.

### Ops Checklist (Quick Reference)

1. **Is the API reachable?**  
   - `curl -H "Authorization: Bearer …" http://<host>/api/chat/ -d '{"message":"ping"}'`
   - Expect `202` and `thread_id`. Non-202 indicates auth/config regression.

2. **Is the WebSocket accepting connections?**  
   - `wscat -c 'ws://<host>/ws/chat/<thread>/?token=...'`  
   - Expect `{"type":"chat_status","event":"connected"}` (after instrumentation).

3. **Are Celery workers healthy?**  
   - `celery -A easy_islanders inspect ping`  
   - Check Flower/Prometheus for queue depth & task failures.

4. **Check logs with correlation ID** (post-instrumentation):  
   - `rg <correlation_id> logs/api.log` and `logs/celery.log`

5. **Known failure modes**:  
   - Redis down → WS + Celery fail (watch for `ConnectionError` in logs).  
   - JWT expiry → WS 4401 (auto-refresh required).  
   - LLM outage → Celery retries & `chat_error` bubble; consider switching to fallback agent.
