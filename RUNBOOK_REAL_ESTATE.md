# Real Estate Agent Runbook

## Overview

The real estate conversational agent consists of three integrated layers:
- **STEP 7.0**: Context-Primed Router (sticky-intent with hysteresis)
- **STEP 7.1**: Coherent Slot-Filling (NLP extractors + safe Zep writes)
- **STEP 7.2**: Offer Surfaces (inventory summaries + dialogue policy)

---

## Architecture

```
User Input → Router (classify intent) → Real Estate Handler
                                              ↓
                                    Extract & Merge Slots
                                              ↓
                                    Classify Act (OFFER_SUMMARY?)
                                              ↓
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                    OFFER_SUMMARY                        Slot-Filling
                          │                                   │
                   availability_summary()              Acknowledge + Ask
                          │                                   │
                   Build offer lines                    Production Agent
                          │                                   │
                   Ask next missing slot              Return recommendations
```

---

## Health Checks

### Startup Health (assistant/health.py)

On web/worker boot, `check_domain_health()` validates:
- `assistant.domain.real_estate_service` imports cleanly
- `assistant.brain.policy.offer_surface` imports cleanly
- `assistant.brain.nlp.acts` imports cleanly
- `assistant.brain.policy.real_estate_policy` imports cleanly

**On failure**:
- Sets `FEATURE_RE_DOMAIN_ENABLED=False`
- Logs structured warning: `[HEALTH] Domain health check FAILED`
- App continues running with general agent fallback

**Check status**:
```bash
curl http://localhost:8000/healthz
# Expected: {"ok": true, "domain_import_ok": true, "re_agent_enabled": true}
```

---

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `ENABLE_INTENT_PARSER` | `true` | Enable router classification (STEP 7.0) |
| `ENABLE_RE_DIALOGUE_POLICY` | `true` | Enable dialogue policy (STEP 7.2) |
| `ENABLE_RE_OFFER_SURFACES` | `true` | Enable offer summaries (STEP 7.2) |
| `FEATURE_RE_DOMAIN_ENABLED` | Auto-set | Runtime flag (set by health check) |

**Hot disable** (emergency):
```python
# In settings or runtime:
FEATURE_RE_DOMAIN_ENABLED = False
```

---

## Log Signatures

### Success Signals
```
[HEALTH] Domain health check passed (checked=6, re_agent_enabled=True)
[RE Agent] slots merged - {location:'Kyrenia', budget:600, budget_currency:'GBP'}
[RE Agent] classified act=OFFER_SUMMARY
[RE Offer] filters={...} items=18
[RE Offer] Cache HIT: re:availability_summary|location:Kyrenia
[Zep] Memory written: thread_123:user (342 chars)
```

### Failure Signals
```
[HEALTH] Domain health check FAILED (errors=['real_estate_service import failed: ...'])
[RE Agent] RE domain disabled, routing to fallback
[RE Offer] DB query failed: ...
[Zep] Memory write failed: 500 ...
```

---

## Common Issues

### Issue: "ask for location/budget" Loop

**Symptoms**: Agent repeatedly asks for location/budget, doesn't acknowledge provided slots

**Root Causes**:
1. SyntaxError in domain modules (import failure)
2. FEATURE_RE_DOMAIN_ENABLED=False
3. Config files missing (nlp.yaml, dialogue/real_estate.yaml)

**Debug**:
```bash
# Check health status
curl http://localhost:8000/healthz

# Check logs for import errors
docker compose logs web | grep "HEALTH"
docker compose logs celery | grep "RE Agent"

# Verify config files exist
ls -la config/nlp.yaml config/dialogue/real_estate.yaml
```

**Fix**:
- If syntax error: Fix and redeploy
- If config missing: Add config files
- If FEATURE disabled: Check health check logs for root cause

---

### Issue: Zep "invalid_json" Warnings

**Symptoms**: Logs show `zep_client_invalid_json` warnings on successful writes (status 200)

**Root Cause**: Zep returns empty/2-byte body on memory writes (valid behavior), but client tried to parse JSON

**Fix**: Applied in zep_client.py (commit 03fd222d+):
- Checks content length before parsing
- Logs at debug level for writes
- Only warns for unexpected parse failures on reads

**Verification**:
```bash
# Should see debug logs, not warnings:
[Zep] Memory written: thread_123:user (342 chars)

# Should NOT see:
zep_client_invalid_json status_code=200 path=/memory
```

---

### Issue: No Offer Summary on "what do you have?"

**Symptoms**: User asks "what do you have?" but gets generic response

**Root Causes**:
1. Act classifier not recognizing pattern
2. availability_summary() returning empty results
3. Database query error
4. Cache issue

**Debug**:
```bash
# Check act classification
docker compose logs celery | grep "classified act"
# Expected: [RE Agent] classified act=OFFER_SUMMARY

# Check query execution
docker compose logs celery | grep "RE Offer"
# Expected: [RE Offer] filters={...} items=N

# Check for DB errors
docker compose logs celery | grep "DB query failed"
```

**Fix**:
- If act not classified: Check acts.py patterns
- If empty results: Check database has properties data
- If DB error: Check database connection, migrations, indexes

---

## Monitoring

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| `re_agent.enabled` | 1 | Page if 0 |
| `re_agent.slot_extractions_total` | Rising | Warn if flat for 1h |
| `re_agent.offer_surface_total` | Rising | Warn if flat for 1h |
| `zep.memory_writes_total` | Rising | - |
| `zep.memory_write_errors_total` | 0 | Warn if >5 in 5m |
| `availability_summary.cache_hit_ratio` | ≥70% | Warn if <50% |
| `availability_summary.p95_latency_ms` | <300 | Warn if >500 |

### Log Queries (Structured)

```python
# Health status
logger.info("[HEALTH] Domain health check passed", extra={"re_agent_enabled": True})

# Slot extraction
logger.info("[RE Agent] slots merged", extra={"slots": {...}})

# Offer surface
logger.info("[RE Offer] filters={...} items=N")

# Cache performance
logger.debug("[RE Offer] Cache HIT: ...")
```

---

## Recovery Procedures

### Emergency Disable

**Scenario**: Domain imports failing, causing handler crashes

**Action**:
```python
# In Django settings or env:
FEATURE_RE_DOMAIN_ENABLED = False

# Restart services:
docker compose restart web celery
```

**Impact**: Users routed to general agent fallback (conversation continues, but no RE-specific features)

---

### Cache Clear

**Scenario**: Stale availability data in Redis

**Action**:
```bash
# Clear RE offer cache
redis-cli KEYS "re:availability_summary*" | xargs redis-cli DEL

# Or flush all cache
redis-cli FLUSHALL
```

**Impact**: Next availability queries will hit database (slower, but fresh data)

---

### Database Indexes Missing

**Scenario**: availability_summary() queries slow (>500ms)

**Action**:
```sql
-- Run migrations:
python manage.py migrate listings

-- Manually create indexes if needed:
\i listings/migrations/0002_re_offers_indexes.sql
```

**Expected Improvement**: Query time 50ms → 15ms

---

## Testing

### CI Gates

```bash
# Syntax check
python -m py_compile $(git ls-files '*.py')

# Import check
python tests/imports/test_domain_imports.py

# Full test suite (if pytest available)
pytest -q tests/imports/ tests/real_estate/
```

### E2E Smoke Test

```
Turn 1:
User: need an apartment
Expected: "Is this for short-term (nightly/weekly) or long-term (monthly/yearly) rent?"

Turn 2:
User: kyrenia 600 pounds
Expected: "Got it — Kyrenia, ~600 GBP. Is this for short-term... or long-term rent?"

Turn 3:
User: what do you have?
Expected:
  Here's what we currently have in Kyrenia:
  - Kyrenia: 18 listings (from ~500 to ~1200 GBP)

  To narrow this down, Is this for short-term... or long-term rent?
```

---

## Configuration Files

### config/nlp.yaml
- Locale synonyms (girne → Kyrenia)
- Currency mappings (£ → GBP)
- Regex patterns (bedrooms, budget)
- Business rules (anywhere, rental_type)

### config/dialogue/real_estate.yaml
- Required slots (location|anywhere, rental_type, budget)
- Ask order (priority sequence)
- Dialogue acts (OFFER_SUMMARY, ACK_WITH_SLOTS)
- Relaxation strategy (budget +20%, ignore bedrooms)
- Cache TTL (60 seconds)

### router_thresholds.yaml
- Intent labels + agent mappings
- Hysteresis thresholds (stick/switch/clarify)
- Continuity rules (short input, refinement lexicon)
- Domain priors (property_search weight: 0.08)

---

## Incident Response: STEP 7.2 SyntaxError (2025-01-XX)

### Incident Summary
- **Root Cause**: Malformed text at line 131 of `real_estate_service.py`
- **Impact**: Real estate handler crashed on import, users got repetitive prompts
- **Detection**: User reported incoherent replies
- **Resolution**: Removed invalid lines, added health checks
- **Prevention**: Import tests in CI, startup health validation

### Lessons Learned
1. **Always run syntax checks** before commit (`python -m py_compile`)
2. **Add import tests** to CI gate (`tests/imports/`)
3. **Implement health checks** with graceful degradation
4. **Log structured errors** for quick diagnosis

### Preventive Measures
- ✅ Startup health checks (assistant/health.py)
- ✅ CI import tests (tests/imports/test_domain_imports.py)
- ✅ Hardened Zep client (no JSON parse warnings)
- ✅ Feature flag guard (FEATURE_RE_DOMAIN_ENABLED)

---

## STEP 6 Validation Gate

### Overview

STEP 6 adds Context Lifecycle management with rolling summarization, Zep retrieval, context fusion, persistence, and state rehydration. This validation gate ensures all components work correctly under load before enabling in production.

**Gate Duration**: ~75 minutes
**Required Pass Rate**: 100% (hard gate)

---

### Pre-Flight Checklist

Before running the gate, verify configuration:

```bash
# 1. Check STEP 6 config
cat config/step6_context_lifecycle.yaml | grep -A3 "enabled:\|cadence:\|max_chars:\|history_tail_turns:"

# Expected:
#   enabled: true
#   cadence: 10
#   max_chars: 500
#   history_tail_turns: 5

# 2. Check domain feature flags
grep ENABLE_INTENT_PARSER .env

# Expected:
#   ENABLE_INTENT_PARSER=true

# 3. Verify health endpoint
curl http://localhost:8000/healthz | jq '.domain_import_ok, .re_agent_enabled'

# Expected:
#   true
#   true
```

---

### Step 1: Run Validation Script (5 min)

```bash
python3 scripts/validate_step6_context_lifecycle.py
```

**Required PASS checks** (9/9):
- ✅ Config loading (step6_context_lifecycle.yaml)
- ✅ PII stripping (email, phone, URL)
- ✅ Summary length ≤ 500 chars
- ✅ Zep context injection present
- ✅ Rolling summary fires at cadence (turn 10, 20, ...)
- ✅ Fused context contains: [summary] + [retrieved] + [last 5 turns]
- ✅ Snapshot persisted after each turn
- ✅ Rehydration restores active_domain, current_intent, summary
- ✅ E2E integration scenario

**If any fail**: Stop gate, investigate, fix, re-run from step 1.

---

### Step 2: Manual Smoke Test (10 min)

**Purpose**: Reproduce original failure case (Kyrenia apartment + reconnect)

Open browser console and execute this exact sequence in one thread:

```javascript
// Turn 1
ws.send(JSON.stringify({message: "need an apartment"}))
// ✅ Expect: Asks for missing slot (location/budget/rental_type)
// 📋 Log: [RE Agent] slots merged - {}

// Turn 2
ws.send(JSON.stringify({message: "kyrenia 600 pounds"}))
// ✅ Expect: "Got it — Kyrenia, ~600 GBP. Is this for short-term or long-term?"
// 📋 Log: [RE Agent] slots merged - {location:'Kyrenia', budget:600, currency:'GBP'}

// Turn 3
ws.send(JSON.stringify({message: "long term"}))
// ✅ Expect: Offer summary (count, min→max price) + narrowing question
// 📋 Log: [RE Agent] classified act=OFFER_SUMMARY
// 📋 Log: [RE Offer] filters={rental_type:'long', location:'Kyrenia'} items=N

// Reconnect WebSocket
ws.close()
// Wait 3 seconds
ws = new WebSocket(...)
ws.onopen = () => {
  // ✅ Log: ws_connect_ok
  // ✅ Log: ws_connect_rehydrated domain=real_estate_agent turns=6
}

// Turn 4 (after reconnect)
ws.send(JSON.stringify({message: "cheaper"}))
// ✅ Expect: Still in real_estate_agent (no drift)
// ✅ Expect: Uses prior slots, returns cheaper options
// 📋 Log: [Router] sticky=real_estate_agent (no flap)
// 📋 Log: [RE Agent] refined budget -20%
```

**Success Criteria**:
- All 4 turns return coherent responses
- No router drift after reconnect (stays in `real_estate_agent`)
- Logs show `ws_connect_rehydrated` with correct domain/turns
- No `local_info_agent` misroute on "cheaper"

**If fails**: Check logs for:
- `rehydration.fail` warnings
- Router confidence scores < 0.55 (sticky threshold)
- Missing context snapshot in Zep

---

### Step 3: Load & Latency Probe (10 min)

**Purpose**: Measure STEP 6 overhead under concurrent load

```bash
# Generate 50 concurrent sessions with staggered starts
python3 scripts/load_test_step6.py --sessions=50 --duration=600

# Monitor metrics
curl http://localhost:8000/metrics | grep -E "context\.(retrieval|summary|snapshots)|rehydration"
```

**Performance Thresholds**:
| Metric | Target (P95) | Alert If |
|--------|-------------|----------|
| `context.retrieval_ms` | ≤ 70 ms | > 100 ms for 10m |
| `context.summary_ms` | ≤ 40 ms | > 60 ms for 10m |
| `turn_total_ms` | ≤ 900 ms | > 1200 ms for 10m |
| `rehydration.fail_rate` | ≤ 1% | > 1% for 10m |

**If thresholds exceeded**:
- Check Zep latency: `curl http://zep:8000/healthz`
- Check Redis cache hit rate: `redis-cli info stats | grep keyspace_hits`
- Review slow query logs: `docker compose logs web | grep "slow_query"`

---

### Step 4: Monitoring Checks (5 min)

**Verify Dashboards**:

```bash
# Check that metrics exist and increment
curl -s http://localhost:9090/api/v1/query?query=context_retrieval_ms | jq '.data.result'
curl -s http://localhost:9090/api/v1/query?query=context_snapshots_total | jq '.data.result'
curl -s http://localhost:9090/api/v1/query?query=rehydration_success_total | jq '.data.result'
```

**Required Metrics** (must exist in Prometheus):
- `context_retrieval_ms_bucket` (histogram, p50/p95/p99)
- `context_summary_ms_bucket` (histogram, p50/p95/p99)
- `context_snapshots_total` (counter, increments with turns)
- `rehydration_success_total` (counter, increments on WS connect)
- `rehydration_fail_total` (counter, should stay near 0)

**Expected Behavior**:
- `context_snapshots_total` rises by ~1 per turn
- `rehydration_success_total` rises by 1 per WS reconnect
- Zep write logs are `DEBUG`, not `WARNING` (hardened client)

---

### Step 5: GO/NO-GO Decision

**Wait 60 minutes after restart**, then check:

**✅ GO Criteria** (all must be true):
- [x] Validation script: 9/9 PASS
- [x] Manual smoke: 4 turns coherent, no drift on reconnect
- [x] Performance: P95 retrieval ≤ 70ms, summary ≤ 40ms, turn ≤ 900ms
- [x] Rehydration: fail rate ≤ 1%
- [x] Health: `/healthz` shows `{"ok": true, "re_agent_enabled": true}`
- [x] No SyntaxErrors or import failures in logs

**❌ NO-GO Actions** (if any fail):
1. **Immediate**: Set `step6.enabled: false` in config
2. **Restart**: `docker compose restart web celery`
3. **Investigate**: Check logs for errors
4. **Fix**: Address root cause
5. **Re-run**: Repeat gate from Step 1

**Rollback Command**:
```yaml
# config/step6_context_lifecycle.yaml
step6:
  enabled: false  # Disable injection/fusion, keep writes on
```

---

### Post-Gate: Dashboards & Alerts

#### Grafana Panel Group: "Context Lifecycle"

**Panel 1: Retrieval Latency**
```promql
# P50
histogram_quantile(0.50, sum(rate(context_retrieval_ms_bucket[5m])) by (le))

# P95
histogram_quantile(0.95, sum(rate(context_retrieval_ms_bucket[5m])) by (le))

# Alert threshold line: 100ms
```

**Panel 2: Summary Latency**
```promql
# P50
histogram_quantile(0.50, sum(rate(context_summary_ms_bucket[5m])) by (le))

# P95
histogram_quantile(0.95, sum(rate(context_summary_ms_bucket[5m])) by (le))

# Alert threshold line: 60ms
```

**Panel 3: Snapshot Volume**
```promql
# Total snapshots over time
sum(increase(context_snapshots_total[5m]))

# Should rise linearly with turn count
```

**Panel 4: Rehydration Health**
```promql
# Success rate
sum(rate(rehydration_success_total[5m])) /
  (sum(rate(rehydration_success_total[5m])) + sum(rate(rehydration_fail_total[5m])))

# Should stay at ~1.0 (100%)
```

#### Alert Rules (Staging)

**Alert 1: High Rehydration Failure Rate**
```yaml
- alert: Step6RehydrationFailureRateHigh
  expr: |
    sum(rate(rehydration_fail_total[10m])) /
    (sum(rate(rehydration_success_total[10m])) + sum(rate(rehydration_fail_total[10m]))) > 0.01
  for: 10m
  labels:
    severity: warning
    component: step6
  annotations:
    summary: "STEP 6 rehydration failure rate > 1%"
    description: "{{ $value | humanizePercentage }} of reconnects failing to restore state"
```

**Alert 2: High Retrieval Latency**
```yaml
- alert: Step6RetrievalLatencyHigh
  expr: |
    histogram_quantile(0.95, sum(rate(context_retrieval_ms_bucket[10m])) by (le)) > 100
  for: 10m
  labels:
    severity: warning
    component: step6
  annotations:
    summary: "STEP 6 Zep retrieval P95 > 100ms"
    description: "P95 latency: {{ $value }}ms (threshold: 100ms)"
```

**Alert 3: High Summary Latency**
```yaml
- alert: Step6SummaryLatencyHigh
  expr: |
    histogram_quantile(0.95, sum(rate(context_summary_ms_bucket[10m])) by (le)) > 60
  for: 10m
  labels:
    severity: warning
    component: step6
  annotations:
    summary: "STEP 6 summary generation P95 > 60ms"
    description: "P95 latency: {{ $value }}ms (threshold: 60ms)"
```

---

### Troubleshooting

**Symptom**: Rehydration always returns `{"rehydrated": false}`

**Diagnosis**:
```bash
# Check if snapshots are being written
docker compose logs web | grep "Context snapshot persisted"

# Check Zep session exists
curl http://localhost:8000/api/v1/sessions/<thread_id>/memory
```

**Fix**: Ensure `_persist_context_snapshot()` is called in `_with_history()` after turn completion.

---

**Symptom**: Summary length exceeds 500 chars

**Diagnosis**:
```bash
# Check logs for summary generation
docker compose logs web | grep "Rolling summary generated"

# Check config
cat config/step6_context_lifecycle.yaml | grep max_chars
```

**Fix**: Verify `summarize_context()` enforces truncation at line 118.

---

**Symptom**: Context retrieval times out

**Diagnosis**:
```bash
# Check Zep health
curl http://localhost:8000/healthz

# Check Zep response time
time curl -X POST http://localhost:8000/api/v1/sessions/<thread>/search \
  -d '{"text": "test", "limit": 5}'
```

**Fix**:
- Increase `retrieval.timeout_seconds` in config
- Check Zep database index health
- Reduce `retrieval.max_snippets` to 3

---

## Support Contacts

- **Logs**: `docker compose logs web celery`
- **Metrics**: Prometheus/Grafana dashboard
- **Health**: `curl http://localhost:8000/healthz`
- **Cache**: Redis CLI (`redis-cli`)
- **Database**: PostgreSQL (`psql -U easy_user easy_islanders`)

---

**Last Updated**: 2025-01-XX (Post-STEP 7.2 hardening)
