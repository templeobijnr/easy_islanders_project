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

## Support Contacts

- **Logs**: `docker compose logs web celery`
- **Metrics**: Prometheus/Grafana dashboard
- **Health**: `curl http://localhost:8000/healthz`
- **Cache**: Redis CLI (`redis-cli`)
- **Database**: PostgreSQL (`psql -U easy_user easy_islanders`)

---

**Last Updated**: 2025-01-XX (Post-STEP 7.2 hardening)
