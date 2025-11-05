# Zep Memory Service - Production Rollout Index

**Status:** ✅ READY FOR STAGING VALIDATION
**Date:** 2025-11-03
**Sprint:** Production Hardening (PR-D + PR-J)
**Ship Readiness:** All deliverables complete, tested, and documented

---

## Quick Start

### For Reviewers
1. Read: [PR Description Template](PR_DESCRIPTION_TEMPLATE.md) - Complete PR overview
2. Review: Code changes in `assistant/memory/`, `assistant/monitoring/metrics.py`
3. Verify: All unit tests pass (`python manage.py test tests.memory`)

### For SRE/DevOps
1. **Start here:** [SRE Staging Runbook](SRE_STAGING_RUNBOOK.sh) - Interactive validation script
2. **Quick reference:** [Quick Reference Card](QUICK_REFERENCE_ZEP_OPS.md) - On-call commands
3. **Full runbook:** [PR-J Auto-Downgrade Guard](PR_J_AUTO_DOWNGRADE_GUARD.md) - Complete operational guide

### For Product/QA
1. Read: [Go-Live Checklist](GO_LIVE_CHECKLIST.md) - Day-by-day rollout plan
2. Review: [Session Completion Summary](SESSION_COMPLETION_SUMMARY.md) - What was delivered

---

## Document Map

### Executive Summary
| Document | Purpose | Audience |
|----------|---------|----------|
| **This file** | Navigation index | Everyone |
| [PR Description Template](PR_DESCRIPTION_TEMPLATE.md) | Complete PR overview with copy-paste validation commands | Reviewers, SRE, PM |
| [Session Completion Summary](SESSION_COMPLETION_SUMMARY.md) | What was delivered in this sprint | Tech Lead, PM |
| [Production Hardening Sprint Complete](PRODUCTION_HARDENING_SPRINT_COMPLETE.md) | All deliverables consolidated | Tech Lead, CTO |

### Operational Runbooks
| Document | Purpose | Audience |
|----------|---------|----------|
| [SRE Staging Runbook](SRE_STAGING_RUNBOOK.sh) | **Interactive validation script** - copy/paste commands for staging | **SRE (PRIMARY)** |
| [Quick Reference Card](QUICK_REFERENCE_ZEP_OPS.md) | **On-call cheat sheet** - emergency commands and decision tree | **On-Call Engineers** |
| [PR-J Auto-Downgrade Guard](PR_J_AUTO_DOWNGRADE_GUARD.md) | Complete behavior spec with 4 operational drills | SRE, Backend |
| [Go-Live Checklist](GO_LIVE_CHECKLIST.md) | Day-by-day rollout plan with 6 drills | SRE, Tech Lead, PM |

### Technical Documentation
| Document | Purpose | Audience |
|----------|---------|----------|
| [System Analysis and Recommendations](SYSTEM_ANALYSIS_AND_RECOMMENDATIONS.md) | 91-page comprehensive architecture analysis | Backend, Architects |
| [Implementation Summary](IMPLEMENTATION_SUMMARY.md) | Detailed change log and testing checklist | Backend |
| [Zep Production Hardening](ZEP_PRODUCTION_HARDENING.md) | Implementation tracking and smoke tests | Backend |

---

## Rollout Timeline

### ✅ Complete: Development & Testing
- [x] Core implementation (PR-D: shared service, read-before-route, sticky routing)
- [x] Auto-downgrade guard (PR-J: self-healing with single-flight probe)
- [x] PII redaction layer (email/phone/address)
- [x] 21 unit tests with full mocking
- [x] Management command (`zep_mode`) with 5 operations
- [x] Grafana dashboard (9 panels)
- [x] Complete documentation (8 files, 3,000+ lines)

### 🟡 Next: Staging Validation (Day 0-5)
**Day 0-2: Dark Launch (Write-Only)**
- Deploy with `FLAG_ZEP_WRITE=true`, `FLAG_ZEP_READ=false`
- Run 3 smoke test drills (see [SRE Runbook](SRE_STAGING_RUNBOOK.sh))
- Monitor for 48 hours

**Day 3-5: Read-Write Validation**
- Enable reads: `FLAG_ZEP_READ=true`
- Execute 6 operational drills (auth failure, consecutive failure, cache, etc.)
- Monitor for 72 hours

**Success Gates:**
- [ ] No increase in error rate
- [ ] PII redaction working (email/phone → [EMAIL]/[PHONE])
- [ ] p95 read latency < 250ms
- [ ] Cache hit rate > 60%
- [ ] Auto-downgrade triggers correctly during simulated failures
- [ ] Auto-recovery works after TTL expiry

### 🔵 Future: Production Deployment (Day 6+)
**Day 6-10: Canary (10% traffic)**
- Deploy to 10% of workers with reads enabled
- Monitor for 4 days
- Configure PagerDuty alerts

**Day 11+: Full Rollout (100%)**
- Deploy to all workers
- Monitor for 24 hours
- Declare success

---

## Key Features Delivered

### 1. Shared Zep Service Layer (PR-D)
**What:** Single service abstraction for memory operations
**Why:** Eliminates code duplication, enables read-before-route
**Impact:** Supervisor pipeline injects context before routing → sticky follow-ups work

**Files:**
- [assistant/memory/service.py](../assistant/memory/service.py)
- [assistant/memory/zep_client.py](../assistant/memory/zep_client.py)

### 2. Auto-Downgrade Guard (PR-J)
**What:** Automatic failover to write_only mode on Zep health degradation
**Why:** Prevents cascading failures, maintains write capability
**Impact:** System self-heals during Zep outages, no manual intervention required

**Triggers:**
- Auth failures (401/403) → immediate downgrade
- 3 consecutive timeouts/5xx → downgrade after 3rd failure
- 5-minute hold period → auto-probe recovery

**Files:**
- [assistant/memory/flags.py](../assistant/memory/flags.py)
- [assistant/memory/service.py](../assistant/memory/service.py#L200-L280) (guard hooks)

### 3. PII Redaction Layer
**What:** Automatic redaction of email/phone/address before Zep writes
**Why:** GDPR/KVKK compliance for external service integration
**Impact:** User PII never exposed to Zep, full audit trail via metrics

**Files:**
- [assistant/memory/pii.py](../assistant/memory/pii.py)

### 4. Comprehensive Observability
**What:** 4 new Prometheus metrics + Grafana dashboard
**Why:** Visibility into auto-downgrade events, read health, PII redactions
**Impact:** SRE can detect and respond to issues before users are affected

**Metrics:**
- `memory_mode_gauge` - Current mode (0=off, 1=write_only, 2=read_write)
- `memory_zep_downgrades_total` - Downgrade events by reason
- `memory_zep_context_failures_total` - Context failures by reason
- `memory_zep_redactions_total` - PII redactions by field type

**Files:**
- [assistant/monitoring/metrics.py](../assistant/monitoring/metrics.py#L1383-L1420)
- [grafana/dashboards/memory_service_monitoring.json](../grafana/dashboards/memory_service_monitoring.json)

### 5. Operational Tooling
**What:** Management command with 5 operations for SRE
**Why:** Enable ops team to manage mode, troubleshoot issues, emergency rollback
**Impact:** Reduce incident response time from hours to minutes

**Commands:**
```bash
python manage.py zep_mode --status          # Check current mode
python manage.py zep_mode --force rollback  # Emergency rollback
python manage.py zep_mode --clear           # Restore normal operation
python manage.py zep_mode --invalidate <id> # Clear thread cache
python manage.py zep_mode --reset-failures  # Reset failure counter
```

**Files:**
- [assistant/management/commands/zep_mode.py](../assistant/management/commands/zep_mode.py)

---

## Testing Coverage

### Unit Tests (21 tests)
**Run:** `python manage.py test tests.memory.test_auto_downgrade`

**Coverage:**
- Auth failure triggers (401/403)
- Consecutive failure triggers (3x timeout/5xx)
- Success path resets failure counter
- TTL expiry and probe recovery
- Concurrent downgrade attempts
- Forced mode blocks reads immediately
- Single-flight probe lock
- Cache integration

**Files:**
- [tests/memory/test_auto_downgrade.py](../tests/memory/test_auto_downgrade.py)
- [tests/memory/test_pii_write.py](../tests/memory/test_pii_write.py)

### Staging Drills (6 drills)
**Run:** `./docs/SRE_STAGING_RUNBOOK.sh --interactive`

1. **Write Path Validation** - Verify writes flow to Zep with PII redaction
2. **Mode Status Check** - Verify gauge emission and effective mode
3. **Metrics Warmup** - Verify Prometheus metrics emit correctly
4. **Read Path with Context** - Verify cache hit/miss behavior
5. **Auth Failure Trigger** - Simulate 401/403, verify auto-downgrade
6. **Consecutive Failure Trigger** - Simulate 3x timeout, verify downgrade

---

## Emergency Procedures

### Scenario 1: High Read Latency (p95 > 500ms)
**Command:**
```bash
python manage.py zep_mode --force manual --ttl 600
```
**Result:** Force write_only for 10 minutes, monitor Zep vendor status

### Scenario 2: Unexpected Auto-Downgrade
**Diagnosis:**
```bash
python manage.py zep_mode --status
curl http://localhost:8000/api/metrics/ | grep memory_zep_downgrades_total
```
**Fix:** Check reason (auth/consecutive_failures), address root cause, clear forced mode

### Scenario 3: Stuck in Write-Only Mode
**Command:**
```bash
python manage.py zep_mode --clear
```
**Verify:**
```bash
python manage.py zep_mode --status
# Should show: Effective mode=read_write (or base mode)
```

### Scenario 4: Complete Rollback (Disable All Zep)
**Environment:**
```bash
export FLAG_ZEP_WRITE=false
export FLAG_ZEP_READ=false
```
**Result:** System operates without memory (stateless mode)

**See:** [Quick Reference Card](QUICK_REFERENCE_ZEP_OPS.md) for complete decision tree

---

## Success Criteria

### Staging (Day 0-5)
- [ ] Dark launch soak test passes (48 hours, no errors)
- [ ] All 6 operational drills successful
- [ ] PII redaction verified in Zep dashboard
- [ ] Auto-downgrade triggers correctly during simulated failures
- [ ] Auto-recovery works after TTL expiry
- [ ] p95 read latency < 250ms sustained
- [ ] Cache hit rate > 60% after warmup

### Production (Day 6+)
- [ ] Canary deployment stable (10% traffic, 4 days)
- [ ] No increase in error rate
- [ ] TTFB delta < +100ms (frontend impact)
- [ ] No false-positive downgrades in 24 hours
- [ ] PagerDuty alerts configured and tested
- [ ] SRE sign-off on metrics/dashboard
- [ ] PM/QA sign-off on user experience

---

## Support Contacts

| Role | Responsibility | Contact |
|------|----------------|---------|
| **SRE On-Call** | Emergency response, rollback | PagerDuty |
| **Backend Team Lead** | Technical decisions, code review | Slack: #backend |
| **Engineering Manager** | Escalation, go/no-go decisions | Email |
| **PM** | User impact, success criteria | Slack: #product |

---

## Additional Resources

### Grafana Dashboard
**Import:** `grafana/dashboards/memory_service_monitoring.json`
**Panels:** 9 (mode gauge, downgrade events, read/write health, cache metrics, PII audit)

### PagerDuty Alerts
**Configure 3 alerts:**
1. Critical: `increase(memory_zep_downgrades_total[5m]) > 0`
2. Warning: `histogram_quantile(0.95, rate(zep_read_latency_seconds_bucket[5m])) > 0.5`
3. Info: Mode restored (log event)

### Feature Flags
```bash
# Enable writes (always true in production)
export FLAG_ZEP_WRITE=true

# Enable reads (controlled by rollout phase)
export FLAG_ZEP_READ=false  # Start false for dark launch
```

---

## Changelog

### 2025-11-03: Session Completion (v1.0)
- ✅ Fixed management command import error (`_CONTEXT_CACHE` → Django cache)
- ✅ Created comprehensive PR description template
- ✅ Created interactive SRE staging runbook (14KB script)
- ✅ Created quick reference card for on-call engineers
- ✅ Created rollout index (this file)
- ✅ All validation checks pass
- ✅ All documentation complete (8 files, 3,000+ lines)

### 2025-11-02: PR-J Implementation
- ✅ Auto-downgrade guard with single-flight probe
- ✅ 21 unit tests with full mocking
- ✅ Grafana dashboard JSON
- ✅ Management command with 5 operations
- ✅ Complete runbook with 4 drills

### 2025-11-01: PR-D Implementation
- ✅ Shared Zep service layer
- ✅ Read-before-route in supervisor
- ✅ PII redaction layer
- ✅ 4 new Prometheus metrics

---

**Last Updated:** 2025-11-03
**Version:** 1.0
**Ship Status:** ✅ READY FOR STAGING VALIDATION

**Next Action:** SRE team to run `./docs/SRE_STAGING_RUNBOOK.sh --interactive` and execute Day 0-2 drills.
