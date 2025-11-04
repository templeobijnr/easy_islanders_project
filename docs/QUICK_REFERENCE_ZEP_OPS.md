# Zep Memory Service - Quick Reference Card
**For On-Call Engineers**

## Emergency Commands

### Check Current Status
```bash
python manage.py zep_mode --status
```

### Emergency Rollback (Disable Reads)
```bash
# Force write_only mode for 10 minutes
python manage.py zep_mode --force rollback --ttl 600

# Verify rollback
python manage.py zep_mode --status
# Should show: effective_mode=write_only
```

### Restore Normal Operation
```bash
# Clear forced mode
python manage.py zep_mode --clear

# Verify restoration
python manage.py zep_mode --status
# Should show: effective_mode matching base_mode
```

### Clear Stuck Thread Context
```bash
# Invalidate cache for specific thread
python manage.py zep_mode --invalidate thread_abc123
```

---

## Health Check Queries

### Memory Mode Gauge
```bash
curl http://localhost:8000/api/metrics/ | grep memory_mode_gauge
```
**Expected:** `memory_mode_gauge{mode="read_write"} 2.0` (or `write_only=1`, `off=0`)

### Downgrade Events (Last 10 minutes)
```bash
curl http://localhost:8000/api/metrics/ | grep memory_zep_downgrades_total
```
**Expected:** 0 (no downgrades unless Zep is unhealthy)

### Read Latency (p95)
```promql
histogram_quantile(0.95,
  rate(zep_read_latency_seconds_bucket[5m])
)
```
**Threshold:** < 250ms (healthy), < 500ms (warning), > 500ms (critical)

### Context Failures by Reason
```bash
curl http://localhost:8000/api/metrics/ | grep memory_zep_context_failures_total
```
**Expected:** 0 for `reason="auth"`, < 5% for `reason="consecutive_failures"`

---

## Common Scenarios

### Scenario 1: Zep Read Latency Spike
**Symptom:** p95 latency > 500ms for 5+ minutes

**Action:**
1. Check status: `python manage.py zep_mode --status`
2. If auto-downgrade hasn't triggered, manually force:
   ```bash
   python manage.py zep_mode --force manual --ttl 600
   ```
3. Monitor for recovery (check Zep vendor status)
4. Once latency < 250ms for 5 minutes, clear forced mode:
   ```bash
   python manage.py zep_mode --clear
   ```

### Scenario 2: Auth Failure (401/403)
**Symptom:** `memory_zep_downgrades_total{reason="auth"}` incrementing

**Auto-Response:** System auto-downgrades to write_only immediately (no action needed)

**Manual Recovery:**
1. Verify Zep API key is valid
2. Fix auth configuration
3. Test with probe:
   ```bash
   python manage.py zep_mode --status
   # Wait for TTL expiry (5 minutes)
   ```
4. Or force recovery:
   ```bash
   python manage.py zep_mode --clear
   ```

### Scenario 3: Consecutive Failures (3x timeout/5xx)
**Symptom:** `memory_zep_downgrades_total{reason="consecutive_failures"}` incrementing

**Auto-Response:** System auto-downgrades to write_only after 3rd failure

**Manual Recovery:**
1. Check Zep vendor status
2. Wait for TTL expiry (5 minutes) - system will auto-probe
3. Or manually reset:
   ```bash
   python manage.py zep_mode --reset-failures
   python manage.py zep_mode --clear
   ```

### Scenario 4: Stuck in Write-Only Mode
**Symptom:** Mode shows `write_only` but Zep is healthy

**Diagnosis:**
```bash
python manage.py zep_mode --status
# Check "Forced mode" line - if SET, mode is manually forced
```

**Fix:**
```bash
# Clear forced mode
python manage.py zep_mode --clear

# Verify restoration
python manage.py zep_mode --status
```

---

## Grafana Dashboard

**Import:** `grafana/dashboards/memory_service_monitoring.json`

**Key Panels:**
1. **Memory Mode (Current)** - Shows current effective mode
2. **Downgrade Events** - Timeseries of auto-downgrades by reason
3. **Read Health - p95 Latency** - Watch for > 250ms sustained
4. **Context Failures** - Table grouped by reason
5. **Cache Hit Rate** - Should be > 60%

---

## PagerDuty Alerts

### Critical: Memory Mode Auto-Downgraded
**Trigger:** `rate(memory_zep_downgrades_total[5m]) > 0`
**Action:** Check Zep vendor status, follow recovery steps above

### Warning: High Read Latency
**Trigger:** `histogram_quantile(0.95, rate(zep_read_latency_seconds_bucket[5m])) > 0.5`
**Action:** Monitor for auto-downgrade trigger, consider manual downgrade

### Info: Forced Mode Cleared
**Trigger:** Log event "memory_mode_restored"
**Action:** Verify read health restored

---

## Environment Variables

```bash
# Enable memory writes (always true in production)
export FLAG_ZEP_WRITE=true

# Enable memory reads (controlled by auto-downgrade)
export FLAG_ZEP_READ=true

# Zep API configuration
export ZEP_API_URL=https://api.getzep.com
export ZEP_API_KEY=your_api_key_here
```

---

## Support Contacts

**Primary:** SRE On-Call (PagerDuty)
**Secondary:** Backend Team Lead
**Escalation:** Engineering Manager

**Documentation:**
- Full runbook: `docs/PR_J_AUTO_DOWNGRADE_GUARD.md`
- Go-live checklist: `docs/GO_LIVE_CHECKLIST.md`
- Implementation details: `docs/PRODUCTION_HARDENING_SPRINT_COMPLETE.md`

---

## Decision Tree

```
Is memory service healthy?
├─ YES → Do nothing, system auto-recovers
└─ NO
   ├─ Auth failures (401/403)?
   │  └─ YES → System auto-downgrades, fix auth config
   └─ Latency/timeouts?
      ├─ Auto-downgrade triggered?
      │  ├─ YES → Wait for recovery or manual clear
      │  └─ NO → Consider manual downgrade
      └─ Stuck in forced mode?
         └─ YES → Clear forced mode manually
```

---

**Last Updated:** 2025-11-03
**Version:** PR-J v1.0
