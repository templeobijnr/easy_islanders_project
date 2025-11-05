# Go-Live Checklist - Zep Memory Service Production Hardening

**Date:** 2025-11-02
**Status:** Ready for Deployment
**Sprint:** Production Hardening + PR-J Auto-Downgrade Guard

---

## Pre-Deployment Verification ✅

### **1. Code Review** (30 minutes)

- [ ] Review all modified files:
  - [ ] `assistant/monitoring/metrics.py` (+60 lines)
  - [ ] `assistant/memory/service.py` (+100 lines)
  - [ ] `assistant/memory/flags.py` (+140 lines)
  - [ ] `assistant/apps.py` (+23 lines)
- [ ] Review new files:
  - [ ] `assistant/memory/pii.py` (200 lines)
  - [ ] `tests/memory/test_auto_downgrade.py` (450 lines)
  - [ ] `assistant/management/commands/zep_mode.py` (200 lines)
  - [ ] `grafana/dashboards/memory_service_monitoring.json`

### **2. Unit Tests** (5 minutes)

```bash
# Run auto-downgrade tests
pytest tests/memory/test_auto_downgrade.py -v

# Expected: 20+ tests passing
# PASSED tests/memory/test_auto_downgrade.py::TestAutoDowngradeGuard::test_no_forced_mode_by_default
# PASSED tests/memory/test_auto_downgrade.py::TestAutoDowngradeGuard::test_force_write_only_sets_cache
# ... (20+ tests)
```

### **3. Environment Variables** (2 minutes)

```bash
# Set for staging environment
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=false  # Start write-only
export ZEP_ENABLED=true
export ZEP_BASE_URL=https://api.getzep.com  # Or your Zep URL
export ZEP_API_KEY=<YOUR_KEY>
export ZEP_TIMEOUT_MS=1500

# Verify
echo "FLAG_ZEP_WRITE=$FLAG_ZEP_WRITE"
echo "FLAG_ZEP_READ=$FLAG_ZEP_READ"
echo "ZEP_BASE_URL=$ZEP_BASE_URL"
```

### **4. Grafana Dashboard** (10 minutes)

```bash
# Import dashboard
curl -X POST http://grafana:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <GRAFANA_API_KEY>" \
  -d @grafana/dashboards/memory_service_monitoring.json

# Verify panels load:
# 1. Memory Mode (Current) - should show "WRITE_ONLY"
# 2. Downgrade Events - should be empty (0 events)
# 3. Read Health - should be N/A (reads disabled)
# 4. Context Failures - should be empty
# 5. PII Redactions - should be 0
# 6. Cache Hit Rate - should be N/A
# 7. Write Health - should show >99%
# 8. Circuit Breaker Opens - should be 0
# 9. Read/Write Request Rate - writes should be >0, reads should be 0
```

### **5. Alerts Configuration** (15 minutes)

**PagerDuty Alert 1: Downgrade Event (Warning)**
```yaml
- alert: MemoryAutoDowngrade
  expr: increase(memory_zep_downgrades_total[5m]) > 0
  for: 1m
  labels:
    severity: warning
    team: backend
  annotations:
    summary: "Memory service auto-downgraded"
    description: "Reason: {{ $labels.reason }}. Check Zep health."
```

**PagerDuty Alert 2: Stuck in Downgrade (Critical)**
```yaml
- alert: MemoryStuckInDowngrade
  expr: memory_mode_gauge{mode="write_only"} == 1
  for: 15m
  labels:
    severity: critical
    team: backend
  annotations:
    summary: "Memory stuck in write_only for 15+ minutes"
    description: "Check Zep availability. Manual intervention may be required."
```

**PagerDuty Alert 3: Read Failures Spike**
```yaml
- alert: MemoryReadFailuresSpike
  expr: rate(memory_zep_context_failures_total[5m]) > 5
  for: 5m
  labels:
    severity: warning
    team: backend
  annotations:
    summary: "Memory read failures spiking"
    description: "Investigate Zep connectivity/auth."
```

---

## Day 0-2: Staging Validation (Write-Only Mode)

### **Dark Launch Soak Test** (48 hours)

**Deploy to Staging:**
```bash
# 1. Deploy code
git checkout main
git pull
# ... deploy to staging ...

# 2. Restart workers
supervisorctl restart celery_chat_worker
supervisorctl restart uvicorn

# 3. Verify mode gauge
python manage.py zep_mode --status
# Expected output:
# Base mode (from flags): write_only
# Forced mode: None
# Effective mode: write_only
```

**Monitor for 48 Hours:**
```promql
# No unexpected downgrades
increase(memory_zep_downgrades_total[48h]) == 0

# Write success rate >99%
(1 - (rate(memory_zep_write_failures_total[1h]) / rate(memory_zep_write_requests_total[1h]))) > 0.99

# No circuit breaker opens
rate(circuit_open_total{component="zep"}[48h]) == 0
```

**Success Criteria:**
- [ ] No spontaneous downgrades
- [ ] Write success rate > 99%
- [ ] Circuit breaker opens = 0
- [ ] Grafana dashboard shows healthy writes

---

### **Drill 1: Auth Failure (30 minutes)**

**Setup:**
```bash
# 1. Temporarily set bad Zep API key
export ZEP_API_KEY="bad_key_xyz"
supervisorctl restart celery_chat_worker
```

**Trigger:**
```bash
# 2. Send a message that would trigger memory read (if enabled)
# Since we're in write-only, this won't trigger downgrade yet
# We'll test this in read-write phase
```

**Note:** Auth drill is more relevant in read-write mode. Skip for now.

---

### **Drill 2: Write Failure (30 minutes)**

**Setup:**
```bash
# 1. Block outbound traffic to Zep temporarily
sudo iptables -A OUTPUT -d <ZEP_HOST_IP> -j DROP
```

**Trigger:**
```bash
# 2. Send 3 messages to trigger writes
for i in {1..3}; do
  curl -X POST http://staging:8000/api/chat/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <JWT>" \
    -d "{\"message\": \"test write $i\", \"thread_id\": \"test-drill\"}"
  sleep 2
done
```

**Verify:**
```bash
# 3. Check metrics
curl -s http://staging:8000/api/metrics/ | grep -E "memory_zep_write_failures_total|circuit_open_total"

# Expected: Failures incremented, circuit may open
```

**Cleanup:**
```bash
# 4. Restore traffic
sudo iptables -D OUTPUT -d <ZEP_HOST_IP> -j DROP

# 5. Verify writes resume
curl -X POST http://staging:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message": "test recovery", "thread_id": "test-drill"}'
```

**Success Criteria:**
- [ ] Writes fail gracefully (circuit opens)
- [ ] Writes resume after traffic restored
- [ ] No app crashes or errors

---

### **Drill 3: Negative Cache (15 minutes)**

**Setup:**
```bash
# Temporarily set very short timeout to trigger timeout
# (We'll do this in read-write phase)
```

**Note:** Negative cache is more relevant in read-write mode. Skip for now.

---

## Day 3-5: Staging Validation (Read-Write Mode)

### **Enable Read Flag** (After write-only success)

**Pre-Conditions (ALL must be true):**
- [ ] Write-only ran for 48+ hours with no issues
- [ ] Write success rate > 99%
- [ ] Circuit breaker opens = 0
- [ ] No unexpected downgrades

**Enable Reads:**
```bash
# 1. Flip flag
export FLAG_ZEP_READ=true
supervisorctl restart celery_chat_worker

# 2. Verify mode
python manage.py zep_mode --status
# Expected output:
# Base mode (from flags): read_write
# Forced mode: None
# Effective mode: read_write
```

---

### **Drill 4: Auth Failure (30 minutes)**

**Setup:**
```bash
# 1. Set bad Zep API key
export ZEP_API_KEY="bad_key_xyz"
supervisorctl restart celery_chat_worker
```

**Trigger:**
```bash
# 2. Send a message (triggers memory read)
curl -X POST http://staging:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message": "need a 2 bedroom in Girne", "thread_id": "test-auth-drill"}'
```

**Verify Downgrade:**
```bash
# 3. Check mode
python manage.py zep_mode --status
# Expected:
# Forced mode: write_only (reason=auth, remaining=~300s)
# Effective mode: write_only

# 4. Check metrics
curl -s http://staging:8000/api/metrics/ | grep memory_zep_downgrades_total
# Expected: memory_zep_downgrades_total{reason="auth"} 1

# 5. Check logs
grep "zep_auth_failure_auto_downgrade" logs/app.log
```

**Verify Recovery:**
```bash
# 6. Restore correct key
export ZEP_API_KEY="<CORRECT_KEY>"
supervisorctl restart celery_chat_worker

# 7. Wait 5 minutes for TTL expiry
sleep 300

# 8. Send another message (triggers probe)
curl -X POST http://staging:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message": "show me more", "thread_id": "test-auth-drill"}'

# 9. Verify mode restored
python manage.py zep_mode --status
# Expected:
# Forced mode: None
# Effective mode: read_write

# 10. Check logs
grep "memory_mode_restored" logs/app.log
```

**Success Criteria:**
- [ ] Auth failure triggers immediate downgrade (reason=auth)
- [ ] `memory_zep_downgrades_total{reason="auth"}` increments
- [ ] Mode gauge shows write_only
- [ ] After key restored + 5min, mode auto-restores to read_write
- [ ] Logs show `memory_mode_forced` and `memory_mode_restored`

---

### **Drill 5: Consecutive Failures (30 minutes)**

**Setup:**
```bash
# 1. Block Zep traffic
sudo iptables -A OUTPUT -d <ZEP_HOST_IP> -j DROP
```

**Trigger:**
```bash
# 2. Send 3 messages to trigger 3 read timeouts
for i in {1..3}; do
  curl -X POST http://staging:8000/api/chat/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <JWT>" \
    -d "{\"message\": \"test timeout $i\", \"thread_id\": \"test-timeout-drill\"}"
  sleep 2
done
```

**Verify Downgrade:**
```bash
# 3. Check mode (should downgrade after 3rd failure)
python manage.py zep_mode --status
# Expected:
# Forced mode: write_only (reason=consecutive_failures, remaining=~300s)

# 4. Check metrics
curl -s http://staging:8000/api/metrics/ | grep memory_zep_downgrades_total
# Expected: memory_zep_downgrades_total{reason="consecutive_failures"} 1
```

**Verify Recovery:**
```bash
# 5. Restore traffic
sudo iptables -D OUTPUT -d <ZEP_HOST_IP> -j DROP

# 6. Wait 5 minutes
sleep 300

# 7. Send message to trigger probe
curl -X POST http://staging:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message": "recovery test", "thread_id": "test-timeout-drill"}'

# 8. Verify mode restored
python manage.py zep_mode --status
# Expected: Effective mode: read_write
```

**Success Criteria:**
- [ ] 3 consecutive failures trigger downgrade
- [ ] `memory_zep_downgrades_total{reason="consecutive_failures"}` increments
- [ ] After traffic restored + 5min, mode auto-restores
- [ ] Logs show consecutive failure count reaching 3

---

### **Drill 6: Probe Failure (30 minutes)**

**Setup:**
```bash
# 1. Force downgrade manually
python manage.py zep_mode --force manual --ttl 60  # 1-minute TTL for faster test

# 2. Block Zep traffic BEFORE TTL expires
sleep 30  # Wait 30s
sudo iptables -A OUTPUT -d <ZEP_HOST_IP> -j DROP
```

**Trigger:**
```bash
# 3. Wait for TTL expiry (remaining 30s)
sleep 35

# 4. Send message to trigger probe (will fail due to blocked traffic)
curl -X POST http://staging:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"message": "probe fail test", "thread_id": "test-probe-fail"}'
```

**Verify Re-Hold:**
```bash
# 5. Check mode (should re-force for another 5 minutes)
python manage.py zep_mode --status
# Expected:
# Forced mode: write_only (reason=probe_failed, remaining=~300s)

# 6. Check metrics
curl -s http://staging:8000/api/metrics/ | grep memory_zep_downgrades_total
# Expected: memory_zep_downgrades_total{reason="probe_failed"} incremented
```

**Cleanup:**
```bash
# 7. Restore traffic
sudo iptables -D OUTPUT -d <ZEP_HOST_IP> -j DROP

# 8. Clear forced mode manually
python manage.py zep_mode --clear
```

**Success Criteria:**
- [ ] Probe failure re-holds mode for another 5 minutes
- [ ] `memory_zep_downgrades_total{reason="probe_failed"}` increments
- [ ] Manual clear works correctly

---

## Day 6-10: Production Canary (10% Traffic)

### **Deployment** (1 hour)

```bash
# 1. Deploy to production (canary environment)
git checkout main
git pull
# ... deploy to production canary ...

# 2. Set flags for 10% of threads
# (Use feature flag service or hash-based routing)
export FLAG_ZEP_WRITE=true
export FLAG_ZEP_READ=true  # Enable read-write for canary

# 3. Restart workers
supervisorctl restart celery_chat_worker
```

### **Monitor for 3-5 Days**

**Metrics to Watch:**

```promql
# 1. No false-positive downgrades
increase(memory_zep_downgrades_total[1h]) == 0  # Should only increment during real Zep incidents

# 2. p95 read latency < 250ms
histogram_quantile(0.95, sum(rate(memory_zep_read_latency_seconds_bucket[5m])) by (le)) < 0.250

# 3. p95 TTFB stable (< +100ms vs baseline)
histogram_quantile(0.95, sum(rate(agent_latency_seconds_bucket[5m])) by (le)) < baseline + 0.100

# 4. Error rate stable
rate(error_rate_total[5m]) < baseline_error_rate * 1.1  # Max 10% increase

# 5. Cache hit rate trending up
rate(memory_zep_context_cache_hits_total[5m]) / (rate(memory_zep_context_cache_hits_total[5m]) + rate(memory_zep_read_requests_total[5m])) > 0.30
```

**Success Criteria:**
- [ ] No false-positive downgrades for 3-5 days
- [ ] p95 read latency < 250ms
- [ ] p95 TTFB stable (< +100ms delta)
- [ ] Error rate stable (< 10% increase)
- [ ] Cache hit rate > 30% (in multi-turn chats)

---

## Day 11: Full Rollout (100% Traffic)

### **Ramp to 100%** (1 hour)

```bash
# 1. Remove canary flag routing (enable for all threads)
# ... update feature flag service ...

# 2. Monitor for 24 hours
# Use same metrics as canary phase

# 3. Declare stable if all success criteria met
```

**Final Success Criteria:**
- [ ] No false-positive downgrades for 24 hours
- [ ] All performance metrics stable
- [ ] No increase in error rate
- [ ] Team trained on `zep_mode` management command

---

## Rollback Plan

### **Immediate Rollback Triggers**

- p95 TTFB increase > 200ms
- Breaker open > 5% for 10m
- Error rate increase > 2x baseline

**Rollback Steps:**
```bash
# Option 1: Disable reads (fastest)
export FLAG_ZEP_READ=false
supervisorctl restart celery_chat_worker

# Option 2: Force write-only manually
python manage.py zep_mode --force rollback --ttl 900  # 15-minute hold

# Option 3: Code rollback
git revert <PR-J-commit>
git push && deploy
```

### **Downgrade to Write-Only Triggers**

- Read latency p95 > 300ms for 15m
- Context failure rate > 10% for 10m

**Downgrade Steps:**
```bash
# Automatic (built-in to PR-J)
# System will auto-downgrade and emit alert

# Manual override (if needed)
python manage.py zep_mode --force consecutive_failures --ttl 600
```

---

## Post-Deployment Validation (Day 12+)

### **Week 1:**
- [ ] Zero false-positive downgrades (only during real Zep incidents)
- [ ] p95 read latency < 250ms
- [ ] p95 TTFB unchanged (delta < +50ms)
- [ ] Memory mode gauge accuracy (matches env flags when healthy)
- [ ] PII redaction metrics showing redactions (email/phone)

### **Month 1:**
- [ ] Auto-downgrade events tracked (Zep outages handled automatically)
- [ ] Auto-recovery events tracked (probe success rate > 90%)
- [ ] Cache hit rate stable (> 40% in multi-turn chats)
- [ ] Team comfortable using `zep_mode` command

---

## Operational Commands

### **Quick Metrics Check**
```bash
curl -s http://<host>:8000/api/metrics/ \
  | egrep "memory_mode_gauge|memory_zep_downgrades_total|memory_zep_context_failures_total"
```

### **Status Check**
```bash
python manage.py zep_mode --status
```

### **Force Write-Only (Emergency)**
```bash
python manage.py zep_mode --force rollback --ttl 900  # 15-minute hold
```

### **Clear Forced Mode**
```bash
python manage.py zep_mode --clear
```

### **Invalidate Thread Context**
```bash
python manage.py zep_mode --invalidate <thread_id>
```

### **Reset Failure Counter**
```bash
python manage.py zep_mode --reset-failures
```

---

## Team Contacts (RACI)

| Role | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| **SRE** | Flag flips, drills, alerts | Deployment | Backend | PM |
| **Backend** | Logs, cache, idempotency | Code quality | SRE | Frontend |
| **Frontend** | WS traces, dev HUD | User experience | Backend | QA |
| **PM/QA** | Test flows, acceptance | Product quality | All | Stakeholders |

---

## Success! 🎉

When all checklist items are complete and the system has been stable for 1 week:

- [ ] Document lessons learned
- [ ] Update runbook with any operational insights
- [ ] Schedule retrospective with team
- [ ] **Celebrate the win!** 🚀

---

**Prepared by:** Claude (Sonnet 4.5)
**Date:** 2025-11-02
**Status:** Ready for Go-Live
