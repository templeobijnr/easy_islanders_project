# Real Estate Agent - Canary Rollout Runbook

**Version**: 1.0
**Feature**: Prompt-Driven Real Estate Agent
**Branch**: `claude/step2-validation-011CUoJ1fqDMsNa6S4cRaN83`
**Commit**: `981d4bdf`

---

## Prerequisites

- [ ] Backend migrations applied (`python manage.py migrate`)
- [ ] Listings seeded (`python manage.py seed_listings --count=120`)
- [ ] Metrics endpoint accessible (`/metrics`)
- [ ] Grafana dashboards created (see `GRAFANA_DASHBOARDS.json`)
- [ ] Prometheus alerts configured (see `PROMETHEUS_ALERTS.yml`)
- [ ] Baseline metrics captured (1 hour of traffic on legacy handler)

---

## Phase 1: 10% Canary (60 minutes)

### Configuration

```bash
# Set environment variables
export USE_RE_PROMPT_DRIVEN=true
export RE_PROMPT_CANARY_PERCENT=10
export RE_SEARCH_TIMEOUT_MS=800
export RE_SEARCH_CIRCUIT_BREAKER_OPEN_AFTER=5
export ENABLE_RE_RECOMMEND_CARD=true

# Restart services
docker compose restart web celery

# Verify configuration
curl http://localhost:8000/api/health | jq '.config.re_prompt_driven'
```

### Smoke Test (Manual)

Run 10 test sessions:

```bash
# Session 1-10: Happy path (3 turns)
# Turn 1: "I need an apartment"
# Turn 2: "Kyrenia 500 pounds"
# Turn 3: "long term"

# Expected results:
# Turn 2 → ASK_SLOT (asks for rental_type, no re-ask of location/budget)
# Turn 3 → SEARCH_AND_RECOMMEND (emits 6+ cards, variant=long_term)
```

### SLO Checks (Every 15 minutes)

```bash
# Check turn latency p95 (must be ≤ 1200ms)
curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,sum(rate(re_turn_total_ms_bucket[10m]))by(le))' | jq '.data.result[0].value[1]'

# Check search latency p95 (must be ≤ 450ms)
curl -s http://localhost:9090/api/v1/query?query='histogram_quantile(0.95,sum(rate(re_backend_search_ms_bucket[10m]))by(le))' | jq '.data.result[0].value[1]'

# Check JSON parse fail rate (must be ≤ 0.5%)
curl -s http://localhost:9090/api/v1/query?query='rate(re_json_parse_fail_total[10m])' | jq '.data.result[0].value[1]'

# Check circuit breaker state (must be 0 = closed)
curl -s http://localhost:9090/api/v1/query?query='re_circuit_breaker_state{service="backend_search"}' | jq '.data.result[0].value[1]'
```

### Acceptance Criteria

**Green (proceed to Phase 2)**:
- ✅ `re_turn_total_ms` p95 ≤ 1200ms for 60 minutes
- ✅ `re_backend_search_ms` p95 ≤ 450ms for 60 minutes
- ✅ `rate(re_json_parse_fail_total[10m])` ≤ 0.005 (0.5%)
- ✅ No P0/P1 incidents
- ✅ Conversion: ≥80% of sessions with all slots reach SEARCH_AND_RECOMMEND in ≤2 turns

**Red (rollback)**:
- ❌ Any SLO breached for >10 minutes
- ❌ P0/P1 incident
- ❌ Circuit breaker open for >5 minutes

### Rollback (if needed)

```bash
# Option 1: Immediate legacy handler
export USE_RE_PROMPT_DRIVEN=false
docker compose restart web celery

# Option 2: Stop canary only
export RE_PROMPT_CANARY_PERCENT=0
docker compose restart web celery

# Option 3: Disable cards only
export ENABLE_RE_RECOMMEND_CARD=false
docker compose restart web celery
```

---

## Phase 2: 50% Canary (60 minutes)

### Configuration

```bash
# Increase canary to 50%
export RE_PROMPT_CANARY_PERCENT=50
docker compose restart web celery

# Verify
curl http://localhost:8000/api/health | jq '.config.re_prompt_canary_percent'
```

### SLO Checks (Every 15 minutes)

Same as Phase 1, plus:

```bash
# Check cache hit rate (should be >30% for identical filter tuples)
curl -s http://localhost:9090/api/v1/query?query='rate(re_search_cache_hits_total[10m])/rate(re_backend_search_ms_count[10m])' | jq '.data.result[0].value[1]'
```

### Acceptance Criteria

**Green (proceed to Phase 3)**:
- ✅ All Phase 1 SLOs maintained
- ✅ `re_circuit_breaker_state{service="backend_search"}` == 0 for ≥95% of samples
- ✅ No increase in error rates vs Phase 1

**Red (rollback to 10% or legacy)**:
- ❌ Any SLO regression
- ❌ Circuit breaker flapping (opens >3 times in 10 minutes)

---

## Phase 3: 100% Rollout (120 minutes)

### Configuration

```bash
# Full rollout
export RE_PROMPT_CANARY_PERCENT=100
docker compose restart web celery

# Verify
curl http://localhost:8000/api/health | jq '.config.re_prompt_canary_percent'
```

### SLO Checks (Every 15 minutes for 2 hours)

Same as Phase 2.

### Acceptance Criteria

**Green (tag release)**:
- ✅ All SLOs maintained for 120 minutes
- ✅ No degradation in user-facing metrics (conversion, engagement)
- ✅ `re_agent_act_total{act="SEARCH_AND_RECOMMEND"}` > baseline

**Proceed to**:
```bash
git tag -a "prompt-driven-re-v1.0" -m "Prompt-driven RE agent: 100% rollout complete"
git push origin prompt-driven-re-v1.0
```

---

## Spot Checks (Logs)

### No Re-Ask Loops

```bash
# Check for slot re-asks after slot is filled
grep -E 'RE Agent: parsed.*act=ASK_SLOT' logs/app.log | \
  grep -E 'next_needed=\["location"\]|next_needed=\["budget"\]' | \
  tail -20

# Expected: Zero occurrences where location/budget asked after already filled
```

### Router Pinning

```bash
# Check slot-filling guard activations
grep 're.router_pinned' logs/app.log | grep 'reason=slot_filling_guard' | wc -l

# Expected: >0 (guard is activating on refinements)
```

### Graceful Fallbacks

```bash
# Check timeout fallbacks
grep 'search timeout, using fallback' logs/app.log | wc -l

# Expected: Matches re_error_total{type="search_timeout"}
# Verify no retry storms (same thread_id appearing 5+ times in 10 seconds)
```

---

## Failure Playbook

### Symptom: JSON Contract Violations Spike

**Detection**: `rate(re_json_parse_fail_total[10m]) > 0.01` (1%)

**Action**:
1. Temporarily reduce canary: `export RE_PROMPT_CANARY_PERCENT=5`
2. Inspect last 50 failed parses:
   ```bash
   grep 'JSON parsing failed' logs/app.log | tail -50 | jq '.raw_response'
   ```
3. Identify pattern (missing field, malformed JSON, unexpected act)
4. Tighten validation or adjust prompt template
5. Re-enable canary

**Rollback if**: Violation rate >2% for >10 minutes

---

### Symptom: Search Latency p95 Breach

**Detection**: `histogram_quantile(0.95, re_backend_search_ms_bucket) > 600ms`

**Action**:
1. Check backend health:
   ```bash
   curl http://localhost:8000/api/v1/real_estate/search?city=Kyrenia | jq '.count'
   ```
2. Increase cache TTL: `SEARCH_CACHE_TTL=60` (from 30s)
3. Check DB slow queries:
   ```sql
   SELECT query, mean_exec_time FROM pg_stat_statements
   WHERE query LIKE '%real_estate_listing%' ORDER BY mean_exec_time DESC LIMIT 10;
   ```
4. If backend degraded: Let circuit breaker open (fail-fast with graceful fallback)

**Escalate if**: p95 >800ms for >10 minutes

---

### Symptom: Circuit Breaker Flapping

**Detection**: `re_circuit_breaker_state{service="backend_search"}` transitions >3 times in 10 minutes

**Action**:
1. Check backend availability:
   ```bash
   for i in {1..10}; do
     curl -o /dev/null -s -w "%{http_code}\n" http://localhost:8000/api/v1/real_estate/search?city=Test
     sleep 1
   done
   ```
2. If backend unstable: Increase `RE_SEARCH_CIRCUIT_BREAKER_OPEN_AFTER=10` (more tolerance)
3. If backend down: Keep breaker open, rely on fallback text
4. Fix backend root cause

**Rollback if**: Breaker open >50% of time for >10 minutes

---

## Post-Rollout

### Tag Release

```bash
git tag -a "prompt-driven-re-v1.0" -m "Prompt-driven RE agent: Production release"
git push origin prompt-driven-re-v1.0
```

### Update Documentation

- [ ] Mark legacy handler as deprecated in code comments
- [ ] Update API contracts with new recommendation card schema
- [ ] Document canary process for future features

### Next Milestone

Start **Step 7: User Profile MVP** on a fresh branch:
- Preference capture (location, budget range, property type)
- Prompt injection (user profile context in system prompt)
- Ranking tweak (boost listings matching preferences)

```bash
git checkout main
git pull origin main
git checkout -b feature/user-profile-mvp
```

---

## Metrics Summary

### Counters
- `re_agent_act_total{act}` - Actions by type
- `re_json_parse_fail_total` - Contract violations
- `re_card_emitted_total{variant}` - Cards by rental type
- `re_router_pinned_total{reason}` - Pinning events
- `re_handoff_total{to_domain}` - Domain switches
- `re_error_total{type}` - Errors by type

### Histograms
- `re_prompt_end_to_end_ms` - LLM call duration
- `re_backend_search_ms` - Search API duration
- `re_turn_total_ms` - Total turn processing

### Gauges
- `re_circuit_breaker_state{service}` - Breaker state (0=closed, 1=open)

---

**Runbook Version**: 1.0
**Last Updated**: 2025-11-05
**Owner**: Engineering Team
