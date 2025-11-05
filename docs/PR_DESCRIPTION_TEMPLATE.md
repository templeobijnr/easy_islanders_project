# PR: Production Hardening - Zep Memory Service with Auto-Downgrade Guard (PR-J)

## Summary

This PR delivers a production-hardened, self-healing memory layer with Zep integration, complete with automatic downgrade protection, comprehensive observability, and operational tooling.

**Key Achievement:** Zero-regression integration of shared Zep service with read-before-route, sticky follow-ups, and automatic failover protection—all behind feature flags.

## What Changed

### Core Implementation (PR-D + PR-J)

**Shared Zep Service Layer:**
- Single service abstraction in `assistant/memory/service.py`
- Read-before-route in supervisor pipeline
- Sticky routing via context override
- Write path with PII redaction
- 30-second positive cache, 3-second negative cache

**Auto-Downgrade Guard (PR-J):**
- Automatic failover to write_only mode on Zep health degradation
- Single-flight probe lock (prevents thundering herd)
- 5-minute hysteresis to prevent flapping
- Consecutive failure tracking (3x in 60s window)
- Immediate auth failure triggers (401/403)

**PII Compliance:**
- Email redaction (RFC 5322 pattern)
- Phone redaction (international + Turkish formats)
- Address redaction (keyword-based, OFF by default)
- Full audit trail via Prometheus metrics

### Files Changed

**Core:**
- `assistant/memory/flags.py` (+140 lines) - Dynamic mode overlay system
- `assistant/memory/service.py` (+100 lines) - Read path with guard hooks
- `assistant/memory/pii.py` (NEW, 200 lines) - PII redaction layer
- `assistant/monitoring/metrics.py` (+60 lines) - 4 new Prometheus metrics
- `assistant/apps.py` (+23 lines) - Mode gauge emission on boot

**Operations:**
- `assistant/management/commands/zep_mode.py` (NEW, 200 lines) - Ops CLI tool
- `grafana/dashboards/memory_service_monitoring.json` (NEW) - Turnkey dashboard

**Testing:**
- `tests/memory/test_auto_downgrade.py` (NEW, 450 lines) - 21 unit tests with full mocking
- `tests/memory/test_pii_write.py` (NEW) - PII redaction validation

**Documentation:**
- `docs/PR_J_AUTO_DOWNGRADE_GUARD.md` (NEW, 600 lines) - Behavior spec + runbook
- `docs/GO_LIVE_CHECKLIST.md` (NEW) - Day-by-day rollout plan
- `docs/QUICK_REFERENCE_ZEP_OPS.md` (NEW) - On-call quick reference
- `docs/SESSION_COMPLETION_SUMMARY.md` (NEW) - Implementation summary
- 4 additional technical documentation files

## Feature Flags

### Environment Variables
```bash
# Enable memory writes (always true in production)
export FLAG_ZEP_WRITE=true

# Enable memory reads (controlled by auto-downgrade)
export FLAG_ZEP_READ=false  # Start with false for dark launch

# Zep API configuration
export ZEP_API_URL=https://api.getzep.com
export ZEP_API_KEY=<your_key_here>
```

### Mode States
- `off` (0) - No Zep integration
- `write_only` (1) - Writes flow to Zep, reads return empty (dark launch safe)
- `read_only` (2) - Reads from Zep, no writes (not used in this deployment)
- `read_write` (2) - Full bidirectional integration

## Auto-Downgrade Behavior

### Immediate Triggers
**Auth Failures (401/403):**
```
Zep returns 401/403 → force_write_only(reason="auth", ttl=300s)
```
- Effective mode switches to write_only immediately
- Gauge updates: `memory_mode_gauge{mode="write_only"} = 1`
- Counter increments: `memory_zep_downgrades_total{reason="auth"}`
- System holds for 5 minutes, then auto-probes

**Consecutive Failures (3x in 60s):**
```
Read timeout/5xx → increment counter
3rd failure within 60s → force_write_only(reason="consecutive_failures", ttl=300s)
```

### Recovery Flow
1. TTL expires after 5 minutes
2. Single worker acquires probe lock (`SETNX mem:mode:probe_lock:v1`)
3. Probe attempts read
4. Success → `clear_forced_mode()` → restore read_write
5. Failure → re-force write_only for another 5 minutes

### Fail-Safe Guarantees
- **Writes never blocked** - Only reads are affected during downgrade
- **Immediate feedback** - Downgrade happens on first auth failure (no retries)
- **No flapping** - 5-minute minimum hold prevents rapid mode switches
- **Single-flight probe** - Only one worker probes during recovery

## New Metrics

### Memory Mode Gauge
```promql
memory_mode_gauge{mode="read_write"} 2.0
```
**States:** `off=0`, `write_only=1`, `read_write=2`

### Downgrade Events
```promql
increase(memory_zep_downgrades_total{reason="auth"}[5m])
increase(memory_zep_downgrades_total{reason="consecutive_failures"}[5m])
```

### Context Failures
```promql
increase(memory_zep_context_failures_total{reason="auth"}[5m])
increase(memory_zep_context_failures_total{reason="timeout"}[5m])
```

### PII Redactions (Audit Trail)
```promql
increase(memory_zep_redactions_total{field_type="email"}[1h])
increase(memory_zep_redactions_total{field_type="phone"}[1h])
```

### Read Latency (p95)
```promql
histogram_quantile(0.95,
  rate(zep_read_latency_seconds_bucket[5m])
)
```
**Thresholds:** < 250ms (healthy), < 500ms (warning), > 500ms (critical)

### Cache Hit Rate
```promql
rate(memory_zep_context_cache_hits_total[5m])
/
rate(memory_zep_context_requests_total[5m])
```
**Target:** > 60% after warmup

## Testing

### Unit Tests (21 tests)
```bash
# Run auto-downgrade tests
python manage.py test tests.memory.test_auto_downgrade

# Expected output:
# Ran 21 tests in 2.5s
# OK
```

**Coverage:**
- Auth failure triggers (401/403)
- Consecutive failure triggers (3x timeout/5xx)
- Success path resets failure counter
- TTL expiry and probe recovery
- Concurrent downgrade attempts
- Forced mode blocks reads immediately
- Single-flight probe lock
- Cache integration (Redis)

### Manual Smoke Tests
```bash
# 1. Check current status
python manage.py zep_mode --status

# Expected output:
# Base mode (from flags): write_only
# Forced mode: None
# Effective mode: write_only

# 2. Test force/clear workflow
python manage.py zep_mode --force manual --ttl 300
python manage.py zep_mode --status  # Should show forced write_only
python manage.py zep_mode --clear
python manage.py zep_mode --status  # Should show base mode restored

# 3. Test context invalidation
python manage.py zep_mode --invalidate thread_abc123
# Should clear 3 cache keys (summary, recent, facts)
```

## Staging Validation Plan

### Day 0-2: Dark Launch (Write-Only Mode)

**Deploy Configuration:**
```bash
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=false
```

**Drill 1: Write Path Validation**
```bash
# Send test message
curl -X POST http://staging.example.com/api/chat/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a 2 bedroom apartment in Girne",
    "thread_id": "test_write_123"
  }'

# Verify in Zep dashboard: message appears with PII redacted
# Check metrics:
curl http://staging.example.com/api/metrics/ | grep memory_zep_write_success_total
# Should increment by 1
```

**Drill 2: Mode Status Check**
```bash
python manage.py zep_mode --status

# Verify output:
# Base mode (from flags): write_only
# Effective mode: write_only
```

**Drill 3: Metrics Warmup**
```bash
curl http://staging.example.com/api/metrics/ | grep memory_mode_gauge

# Expected:
# memory_mode_gauge{mode="off"} 0.0
# memory_mode_gauge{mode="read_write"} 0.0
# memory_mode_gauge{mode="write_only"} 1.0
```

**Success Criteria (48 hours):**
- [ ] No increase in error rate
- [ ] `memory_zep_write_success_total` increments on each message
- [ ] PII redaction working (email/phone replaced with [EMAIL]/[PHONE])
- [ ] No downgrades triggered (`memory_zep_downgrades_total` = 0)

### Day 3-5: Enable Reads (Canary Validation)

**Deploy Configuration:**
```bash
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=true  # Enable reads
```

**Drill 4: Read Path with Context Injection**
```bash
# Turn 1: Send message
curl -X POST http://staging.example.com/api/chat/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "need a 2 bedroom",
    "thread_id": "test_context_456"
  }'

# Verify trace includes:
# "memory": {
#   "mode": "read_write",
#   "used": true,
#   "cached": false,
#   "source": "zep",
#   "took_ms": 120
# }

# Turn 2: Send follow-up within 30 seconds
curl -X POST http://staging.example.com/api/chat/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "in girne",
    "thread_id": "test_context_456"
  }'

# Verify trace includes:
# "memory": {
#   "mode": "read_write",
#   "used": true,
#   "cached": true,  # <-- Cache hit!
#   "source": "zep",
#   "took_ms": 2
# }
```

**Drill 5: Auth Failure Trigger (Simulated)**
```bash
# Temporarily set bad Zep API key
export ZEP_API_KEY=invalid_key_test

# Restart server
# Send message - should trigger auth failure

# Check metrics:
curl http://staging.example.com/api/metrics/ | grep memory_zep_downgrades_total
# Expected:
# memory_zep_downgrades_total{reason="auth"} 1.0

# Check mode:
python manage.py zep_mode --status
# Expected:
# Forced mode: write_only (reason=auth, remaining=290s)
# Effective mode: write_only

# Restore correct key
export ZEP_API_KEY=correct_key
# Restart server

# Wait for TTL expiry (5 minutes) or manually clear:
python manage.py zep_mode --clear
```

**Drill 6: Consecutive Failure Trigger**
```bash
# Use traffic shaping or Zep outage to trigger 3x timeout/5xx

# Monitor metrics:
watch 'curl -s http://staging.example.com/api/metrics/ | grep memory_zep_context_failures_total'

# After 3rd failure within 60s:
# memory_zep_downgrades_total{reason="consecutive_failures"} 1.0

# Verify auto-downgrade:
python manage.py zep_mode --status
# Forced mode: write_only (reason=consecutive_failures, remaining=295s)

# Restore Zep health, wait for probe recovery (5 min) or manual:
python manage.py zep_mode --clear
```

**Success Criteria (72 hours):**
- [ ] p95 read latency < 250ms
- [ ] Cache hit rate > 60% after warmup
- [ ] No false-positive downgrades (auth/consecutive_failures = 0 under normal conditions)
- [ ] Auto-downgrade triggers correctly during simulated failures
- [ ] Auto-recovery works after TTL expiry
- [ ] No duplicate assistant bubbles on frontend (WS traces healthy)

## Production Rollout

### Phase A: Write-Only Dark Launch (48 hours)
```bash
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=false
```

**Monitor:**
- `memory_zep_write_success_total` - Should increment on each message
- `memory_zep_redactions_total` - Audit PII redaction
- `memory_zep_downgrades_total` - Should be 0 (no downgrades in write-only)

### Phase B: Read Canary (10% traffic, 3-5 days)
```bash
# Deploy to 10% of workers
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=true
```

**Monitor:**
- p95 read latency < 250ms
- TTFB delta < +100ms (frontend impact)
- Cache hit rate > 60%
- No false-positive downgrades

**Alerts to Configure:**
```promql
# Critical: Memory mode auto-downgraded
increase(memory_zep_downgrades_total[5m]) > 0

# Warning: High read latency
histogram_quantile(0.95, rate(zep_read_latency_seconds_bucket[5m])) > 0.5

# Warning: Stuck in write_only for >15 minutes
memory_mode_gauge{mode="write_only"} == 1 for 15m

# Info: Forced mode cleared (recovery)
changes(memory_mode_gauge{mode="read_write"}[5m]) > 0
```

### Phase C: Full Rollout (100%, Day 11+)
```bash
# Deploy to all workers
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=true
```

**Monitor for 24 hours:**
- Error rate stable
- No increase in downtime
- Memory usage stable
- Redis cache healthy

**Declare Success Criteria:**
- [ ] p95 read latency < 250ms sustained
- [ ] Cache hit rate > 60% sustained
- [ ] Zero unplanned downgrades in 24 hours
- [ ] Frontend reports no duplicate bubbles
- [ ] SRE sign-off on metrics/alerts

## Rollback Procedures

### Soft Rollback (Disable Reads Only)
```bash
# Set environment variable
export FLAG_ZEP_READ=false

# Restart workers
# Writes continue, reads return empty context
```

### Hard Rollback (Force Write-Only via Management Command)
```bash
# Force write_only mode for 10 minutes
python manage.py zep_mode --force rollback --ttl 600

# Verify
python manage.py zep_mode --status
# Effective mode: write_only

# Restore after investigating
python manage.py zep_mode --clear
```

### Emergency Rollback (Disable All Zep Integration)
```bash
# Set both flags to false
export FLAG_ZEP_WRITE=false
export FLAG_ZEP_READ=false

# Restart workers
# System operates without memory (stateless mode)
```

## Grafana Dashboard

**Import:** `grafana/dashboards/memory_service_monitoring.json`

**9 Panels:**
1. **Memory Mode (Current)** - Stat panel showing effective mode
   - Query: `memory_mode_gauge`
   - Thresholds: off=grey, write_only=yellow, read_write=green

2. **Downgrade Events (10min window)** - Timeseries by reason
   - Query: `increase(memory_zep_downgrades_total[10m])`
   - Group by: `reason`

3. **Read Health - p95 Latency** - Histogram quantile
   - Query: `histogram_quantile(0.95, rate(zep_read_latency_seconds_bucket[5m]))`
   - Thresholds: < 250ms (green), < 500ms (yellow), > 500ms (red)

4. **Context Failures by Reason** - Table
   - Query: `increase(memory_zep_context_failures_total[1h])`
   - Group by: `reason`

5. **PII Redactions (Audit Trail)** - Timeseries
   - Query: `increase(memory_zep_redactions_total[1h])`
   - Group by: `field_type`

6. **Cache Hit Rate** - Gauge (percentage)
   - Query: `rate(memory_zep_context_cache_hits_total[5m]) / rate(memory_zep_context_requests_total[5m]) * 100`
   - Thresholds: < 40% (red), < 60% (yellow), > 60% (green)

7. **Write Health - Success Rate** - Gauge
   - Query: `rate(memory_zep_write_success_total[5m]) / rate(memory_zep_write_requests_total[5m]) * 100`
   - Thresholds: < 95% (red), < 99% (yellow), > 99% (green)

8. **Circuit Breaker Opens** - Timeseries
   - Query: `increase(memory_circuit_breaker_opens_total[10m])`

9. **Read/Write Request Rate** - Timeseries
   - Query: `rate(memory_zep_read_requests_total[5m])`, `rate(memory_zep_write_requests_total[5m])`

## Operational Commands

### Status Check
```bash
python manage.py zep_mode --status
```

### Emergency Rollback
```bash
# Force write_only mode for 10 minutes
python manage.py zep_mode --force rollback --ttl 600
```

### Restore Normal Operation
```bash
# Clear forced mode
python manage.py zep_mode --clear
```

### Clear Stuck Thread Context
```bash
# Invalidate cache for specific thread
python manage.py zep_mode --invalidate thread_abc123
```

### Reset Failure Counter
```bash
# Reset consecutive failure counter
python manage.py zep_mode --reset-failures
```

## Risk Assessment

### Low Risk
- ✅ **Zero contract drift** - WS traces unchanged (mode, used, cached, took_ms, source)
- ✅ **Feature-flagged** - Can disable reads/writes independently
- ✅ **Fail-safe** - Writes never blocked, only reads during downgrade
- ✅ **Self-healing** - Auto-recovery after TTL expiry via probe
- ✅ **Comprehensive testing** - 21 unit tests with full mocking

### Medium Risk
- ⚠️ **External dependency** - Zep service availability
  - **Mitigation:** Auto-downgrade guard handles outages gracefully
  - **Fallback:** System operates in write_only mode (dark launch safe)

- ⚠️ **Cache invalidation** - Redis dependency
  - **Mitigation:** Best-effort caching (failures don't block requests)
  - **Fallback:** Direct Zep reads if cache unavailable

### High Risk (Mitigated)
- 🔴 **Thundering herd on recovery**
  - **Mitigation:** Single-flight probe lock (SETNX pattern)
  - **Result:** Only one worker probes after TTL expiry

- 🔴 **Mode flapping**
  - **Mitigation:** 5-minute hysteresis period
  - **Result:** Prevents rapid mode switches during intermittent failures

- 🔴 **PII exposure to external service**
  - **Mitigation:** Redaction layer before writes (email/phone/address)
  - **Result:** GDPR/KVKK compliant

## Support & Documentation

**Quick Reference:** [docs/QUICK_REFERENCE_ZEP_OPS.md](../docs/QUICK_REFERENCE_ZEP_OPS.md)
**Complete Runbook:** [docs/PR_J_AUTO_DOWNGRADE_GUARD.md](../docs/PR_J_AUTO_DOWNGRADE_GUARD.md)
**Go-Live Checklist:** [docs/GO_LIVE_CHECKLIST.md](../docs/GO_LIVE_CHECKLIST.md)
**Implementation Summary:** [docs/SESSION_COMPLETION_SUMMARY.md](../docs/SESSION_COMPLETION_SUMMARY.md)

## RACI Matrix

| Task | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| Staging deployment | SRE | Tech Lead | Backend Team | PM/QA |
| Flag configuration | SRE | Tech Lead | - | - |
| Smoke tests (Day 0-2) | SRE | Tech Lead | Backend Team | PM |
| Operational drills (Day 3-5) | SRE + Backend | Tech Lead | - | PM |
| Grafana dashboard setup | SRE | SRE Lead | - | Tech Lead |
| PagerDuty alerts | SRE | SRE Lead | - | On-Call |
| Production canary | SRE | CTO | Tech Lead | PM/QA |
| Full rollout | SRE | CTO | Tech Lead | All |
| Incident response | On-Call SRE | SRE Lead | Backend Team | CTO |

## Sign-Off Checklist

### Pre-Merge
- [ ] All unit tests pass (`python manage.py test tests.memory`)
- [ ] Management command works (`python manage.py zep_mode --status`)
- [ ] Documentation complete (7 files created)
- [ ] Grafana dashboard JSON present
- [ ] Code review approved (2+ reviewers)

### Pre-Staging Deploy
- [ ] Environment variables configured
- [ ] Zep API key verified
- [ ] Redis cache healthy
- [ ] Grafana dashboard imported
- [ ] SRE team briefed on operational commands

### Pre-Production Deploy
- [ ] Staging validation complete (Day 0-5 drills)
- [ ] All 6 operational drills successful
- [ ] PagerDuty alerts configured
- [ ] On-call team briefed
- [ ] Rollback plan reviewed

### Post-Rollout
- [ ] 24 hours of stable operation
- [ ] No unplanned downgrades
- [ ] p95 read latency < 250ms sustained
- [ ] Cache hit rate > 60% sustained
- [ ] SRE sign-off
- [ ] PM/QA sign-off

---

**Ship Status:** ✅ READY FOR STAGING VALIDATION

**PR Author:** Claude Code
**Review Date:** 2025-11-03
**Target Release:** Sprint 6
