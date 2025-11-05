# Validation Gate: Rehydration + Zep Guard

**Branch:** `claude/step2-validation-011CUoJ1fqDMsNa6S4cRaN83`
**Date:** 2025-11-05
**Commit:** `21b8c56d`

## Summary

This validation gate tests the server-side rehydration push and Zep empty message guard fixes to ensure:
1. No 403 errors on reconnect (rehydration pushed via WebSocket, not REST)
2. No Zep embedder retry storms (empty messages blocked at source)
3. Router continuity maintained across reconnects
4. Graceful degradation when Zep/backend unavailable

---

## Preconditions

### Environment Variables

Required in `.env.re_readiness_gate`:

```bash
# Runtime switches
USE_RE_PROMPT_DRIVEN=true
RE_PROMPT_CANARY_PERCENT=10  # Start at 10%, raise to 50/100 after validation
RE_SEARCH_TIMEOUT_MS=800
RE_SEARCH_CIRCUIT_BREAKER_OPEN_AFTER=5
ENABLE_RE_RECOMMEND_CARD=true

# Zep configuration
ZEP_ENABLED=true
ZEP_BASE_URL=http://localhost:8000
ZEP_TIMEOUT_MS=1500
```

### Seed Data

Seed at least 120 listings:

```bash
python3 manage.py seed_listings --count 120
```

Verify:

```bash
python3 manage.py shell
>>> from real_estate.models import Listing
>>> Listing.objects.count()
120
```

---

## Validation Tests

### 1. Smoke Test: Rehydration Works & No 403s

**Goal:** On WS connect, client receives rehydration payload; no REST fetches; no 403.

**Procedure:**

1. Open 3 browser sessions
2. Start RE flow in each:
   - User: "need an apartment"
   - Bot: ASK_SLOT (location/budget)
   - User: "kyrenia 500 pounds"
   - Bot: ASK_SLOT (rental_type)
3. **Disconnect WS** for session A (close tab or throttle network)
4. **Reconnect** (reopen tab)
5. User: "short term"

**Pass Criteria:**

- ✅ Response is SEARCH_AND_RECOMMEND (no re-ask for location/budget)
- ✅ Server logs show:
  ```
  ws_connect_rehydrated_pushed thread_id=<id> domain=real_estate_agent turns=2
  ```
- ✅ **Zero 403 errors** on:
  - `/api/preferences/active`
  - `/api/chat/thread/*/personalization/state`
- ✅ Metrics:
  ```
  rehydration_success_total > 0
  rehydration_fail_total = 0
  ```

**Verification Commands:**

```bash
# Check logs for rehydration
docker compose logs web | grep -E "rehydration|ws_connect"

# Check for 403 errors
docker compose logs web | grep "403" | grep -E "preferences|personalization"

# Check metrics
curl http://localhost:8000/api/metrics/ | grep rehydration
```

---

### 2. Smoke Test: Zep Guard Prevents Empty Messages

**Goal:** Empty/short messages never reach Zep; no "no messages" retries.

**Procedure:**

Send quick no-ops across 5 sessions:
- `""` (empty string)
- `" "` (whitespace)
- `"?"` (single char)
- `"ok"` (2 chars - should pass)
- `"👍"` (emoji - consider allow-list)

**Pass Criteria:**

- ✅ Metrics:
  ```
  zep_write_skipped_total{reason="empty_array"} > 0
  zep_write_skipped_total{reason="empty_content"} > 0
  zep_write_skipped_total{reason="content_too_short"} > 0
  ```
- ✅ **No logs** like:
  ```
  messageTaskPayloadToMessages returned no messages
  ```
- ✅ Normal turns (>2 chars) still persist to Zep
- ✅ Search latency unaffected

**Verification Commands:**

```bash
# Check Zep skip metrics
curl http://localhost:8000/api/metrics/ | grep zep_write_skipped_total

# Check Zep logs for embedder errors
docker compose logs zep | grep "no messages"

# Check normal writes still work
docker compose logs web | grep "zep_write_ok"
```

---

### 3. Chaos Test: Zep Down → Graceful Degradation

**Goal:** Losing Zep must not break the flow.

**Procedure:**

```bash
# Stop Zep
docker compose stop zep

# Run normal 3-turn RE flow
# Turn 1: "need apartment"
# Turn 2: "kyrenia 500 short term"
# Turn 3: (should get SEARCH_AND_RECOMMEND)
```

**Pass Criteria:**

- ✅ Agent continues with sticky slots (no domain flap)
- ✅ User sees cause-aware message:
  ```
  "I couldn't access memory right now. I'll continue without it."
  ```
  **NOT** generic "trouble processing your request"
- ✅ Metrics:
  ```
  re_error_total{type="zep_unavailable"} increments
  re_turn_total_ms p95 ≤ 1200ms (within SLO)
  ```

**Recovery:**

```bash
docker compose start zep
```

**Verification Commands:**

```bash
# Check error metrics
curl http://localhost:8000/api/metrics/ | grep 're_error_total{type="zep_unavailable"}'

# Check turn latency still in SLO
curl http://localhost:8000/api/metrics/ | grep re_turn_total_ms
```

---

### 4. Chaos Test: Backend Search Timeout → Circuit Breaker

**Goal:** Timeouts don't loop; breaker opens; UX fallback shown.

**Procedure:**

1. Inject 1s delay in `real_estate_search.py` (or via proxy):
   ```python
   import time
   time.sleep(1.0)  # Exceeds 800ms timeout
   ```
2. Run SEARCH_AND_RECOMMEND turn

**Pass Criteria:**

- ✅ User gets graceful fallback:
  ```
  "I'm having trouble fetching listings right now. Want me to notify you when results are ready, or try a broader budget?"
  ```
- ✅ Metrics:
  ```
  re_error_total{type="search_timeout"} increments
  re_backend_search_ms spikes once (no retry storm)
  re_circuit_breaker_state{service="backend_search"} = 1
  ```
- ✅ Circuit breaker auto-closes after 60s

**Verification Commands:**

```bash
# Check timeout errors
curl http://localhost:8000/api/metrics/ | grep 're_error_total{type="search_timeout"}'

# Check circuit breaker state
curl http://localhost:8000/api/metrics/ | grep re_circuit_breaker_state

# Check no retry storms
docker compose logs web | grep "re_backend_search" | tail -20
```

---

### 5. Load Test: 30-50 Concurrent Sessions (10 min)

**Goal:** Rehydration & Zep guards hold; p95 latencies stay within SLO.

**Procedure:**

Use Locust or similar tool:

```python
# locustfile.py
from locust import HttpUser, task, between

class REAgentUser(HttpUser):
    wait_time = between(5, 15)

    @task
    def re_flow(self):
        # Turn 1
        self.client.post("/api/chat/", json={
            "message": "need apartment",
            "thread_id": f"load-{self.environment.runner.user_count}-{self.user_id}"
        })
        # Turn 2
        self.client.post("/api/chat/", json={
            "message": "kyrenia 500 pounds short term"
        })
```

Run:

```bash
locust -f locustfile.py --users 50 --spawn-rate 5 --run-time 10m --host http://localhost:8000
```

**Pass Criteria (rolling 10m):**

- ✅ `re_turn_total_ms` p95 ≤ 1200ms
- ✅ `re_backend_search_ms` p95 ≤ 450ms
- ✅ `re_json_parse_fail_rate` ≤ 0.5%
- ✅ Slot funnel: ≥80% of sessions with required slots reach SEARCH_AND_RECOMMEND in ≤2 turns

**Verification Commands:**

```bash
# Query Prometheus for p95 latencies
curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(re_turn_total_ms_bucket[10m]))by(le))'

curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(re_backend_search_ms_bucket[10m]))by(le))'

# JSON parse failure rate
curl 'http://localhost:9090/api/v1/query?query=rate(re_json_parse_fail_total[10m])'
```

---

## Service Level Objectives (SLOs)

### Critical SLOs

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| `re_turn_total_ms` p95 | ≤ 1200ms | 10 minutes |
| `re_backend_search_ms` p95 | ≤ 450ms | 10 minutes |
| `re_json_parse_fail_rate` | ≤ 0.5% | 10 minutes |
| Slot funnel conversion | ≥ 80% | Session-based |
| Rehydration success rate | ≥ 99% | 10 minutes |

### Supporting Metrics

| Metric | Description |
|--------|-------------|
| `rehydration_success_total` | Successful rehydration pushes |
| `rehydration_fail_total` | Failed rehydration attempts |
| `zep_write_skipped_total{reason}` | Empty messages blocked |
| `re_error_total{type}` | Errors by type (zep_unavailable, search_timeout, etc.) |
| `re_circuit_breaker_state` | Circuit breaker state (0=closed, 1=open) |
| `re_agent_act_total{act}` | Actions by type (ASK_SLOT, SEARCH_AND_RECOMMEND, etc.) |
| `re_card_emitted_total{variant}` | Recommendation cards by rental type |

---

## Go/No-Go Decision (60-120 min soak)

### GO Criteria

All must be true:

- ✅ `re_turn_total_ms` p95 ≤ 1200ms
- ✅ `re_backend_search_ms` p95 ≤ 450ms
- ✅ `re_json_parse_fail_rate` ≤ 0.5%
- ✅ Slot funnel conversion ≥ 80%
- ✅ No 403 errors on rehydration paths
- ✅ `rehydration_success_total` consistently increases
- ✅ No P0/P1 incidents

### NO-GO Actions

If any SLO fails:

1. **Immediate rollback:**
   ```bash
   # Option 1: Reduce canary to 0%
   RE_PROMPT_CANARY_PERCENT=0

   # Option 2: Full rollback
   USE_RE_PROMPT_DRIVEN=false
   ```

2. **Investigate:**
   - Check error logs: `docker compose logs web | grep -E "ERROR|CRITICAL"`
   - Review metrics dashboard
   - Identify root cause

3. **Fix and re-validate**

---

## Promotion Timeline (after GO)

### Phase 1: 10% Canary (60 min)

```bash
RE_PROMPT_CANARY_PERCENT=10
```

Monitor all SLOs. If green for 60 minutes → proceed.

### Phase 2: 50% Canary (60 min)

```bash
RE_PROMPT_CANARY_PERCENT=50
```

Monitor all SLOs. If green for 60 minutes → proceed.

### Phase 3: 100% Rollout

```bash
RE_PROMPT_CANARY_PERCENT=100
```

Monitor for 24 hours. If stable:

```bash
git tag -a re-prompt-v1.0-green-$(date +%Y%m%d) -m "RE prompt-driven handler validated and promoted to 100%"
git push origin re-prompt-v1.0-green-$(date +%Y%m%d)
```

---

## Rollback Procedures

### Immediate Rollback (< 5 min)

```bash
# Stop all new traffic to prompt-driven handler
export RE_PROMPT_CANARY_PERCENT=0

# Or full rollback
export USE_RE_PROMPT_DRIVEN=false

# Restart services
docker compose restart web
```

### Partial Rollback (cards only)

```bash
export ENABLE_RE_RECOMMEND_CARD=false
docker compose restart web
```

---

## Known Issues / Notes

1. **Emoji/short replies:** Currently blocks all content <2 chars. To retain 👍/👌 as signals, add emoji allow-list in `zep_client.py`.

2. **PII in rehydration:** Rehydration payload should re-use STEP-6 redaction. Verify no raw PII in `conversation_summary`, `recent_turns`.

3. **Idempotency:** Rehydration pushes are idempotent (same payload on repeated WS connects) and do not mutate server state.

4. **403 vs 401:** Current WS auth uses 4401 close code. Standard would be 1008 (policy violation) or 4401 (custom).

---

## Next Steps (after successful validation)

1. **User Profile MVP (Step 7):**
   - Preference capture from conversation
   - Inject preferences into prompt
   - Ranking bias for recommendation cards (lightweight re-ranker)

2. **Iterate on slot-filling:**
   - Add currency normalization (£/€/$)
   - Location synonym expansion (Girne → Kyrenia)
   - Date parsing for availability

3. **Monitoring improvements:**
   - Add user journey funnel dashboard
   - Alert on slot-filling loops (>4 turns without SEARCH_AND_RECOMMEND)
   - Track card click-through rates

---

## Contact / Escalation

For issues during validation:
- Check logs: `docker compose logs web | tail -100`
- Check metrics: `http://localhost:8000/api/metrics/`
- Check Grafana: `http://localhost:3000`
- Rollback immediately if p95 latency > 2x SLO or error rate > 5%
