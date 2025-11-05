# Zep Memory Service - Production Hardening

## Overview

This document tracks production-hardening improvements for the Zep memory service integration, implementing recommendations from the PR-D review.

## Implementation Status

### ✅ Completed

1. **New Prometheus Metrics**
   - `memory_mode_gauge` - Current memory mode (0=off, 1=write_only, 2=read_write)
   - `memory_zep_redactions_total` - PII redactions before writes
   - `memory_zep_context_failures_total` - Context retrieval failures by reason
   - `memory_zep_downgrades_total` - Automatic mode downgrades

2. **Read Path Timeout Enhancement** (`assistant/memory/service.py:119-216`)
   - Added `timeout_ms` parameter to `fetch_thread_context()` (default: 250ms)
   - Enhanced timeout detection for both `ZepRequestError` and generic exceptions
   - Added `zep_context_slow` warning log when requests exceed budget
   - Proper fallback: returns `used=false, reason="timeout"` on timeout

### 🚧 In Progress

3. **Idempotency Key Support**
   - Need to add `message_id` tracking for both user and assistant writes
   - Prevent duplicate writes on Celery retries
   - Files to update:
     - `assistant/memory/tasks.py` (write path)
     - `assistant/brain/supervisor_graph.py` (pass `client_msg_id`)

4. **PII Redaction Layer**
   - Create `assistant/memory/pii.py` module
   - Redaction functions for emails, phones, addresses
   - Integration into write path before Zep calls
   - Metric emission via `inc_memory_redaction(field_type)`

### 📋 Pending

5. **Soft Hints for Memory-Derived Slots** (RE Agent)
   - Update `assistant/agents/real_estate.py`
   - Treat memory facts (bedrooms, budget) as defaults
   - Current turn contradictions override memory

6. **Memory Mode Gauge Emission**
   - Call `set_memory_mode_gauge(mode)` on worker boot
   - Hook into Django app ready signal
   - Update `assistant/apps.py`

7. **Structured Logging Per Turn**
   - Add structured log line: `{thread, user, agent, zep: {mode, read_ms, write_ms, breaker, retry_after}}`
   - Location: Supervisor node completion

8. **Per-Turn Context Caching**
   - Cache context in `assistant/memory/service.py` to avoid duplicate reads
   - TTL: 30 seconds (turn duration)
   - Key: `zep_context:{thread_id}:{mode}`

9. **Explicit Handoff Intent**
   - Allow agents to set `handoff_to` in response
   - Supervisor honors without re-classifying
   - Update `SupervisorState` schema

10. **Zep Backfill Management Command**
    - `python manage.py zep_backfill --since=30d --dry-run`
    - Progress tracking with metrics
    - Error handling and resume capability

## Smoke Test Checklist

### Phase 1: Write-Only Mode (`FLAG_ZEP_WRITE=true, FLAG_ZEP_READ=false`)

- [ ] **Write Path Smoke**
  - [ ] Send message → `memory_zep_write_attempts_total` increments
  - [ ] p95 latency < 150ms (`memory_zep_write_latency_seconds`)
  - [ ] WS trace includes: `{memory: {used: true, mode: "write_only", source: "zep"}}`

- [ ] **Sticky Follow-up**
  - [ ] User: "2BR in Girne" → listings
  - [ ] User: "show me" (same thread) → continues (no router flip)
  - [ ] Verify `awaiting_clarification=true` preserved

- [ ] **Cross-Agent Coherence**
  - [ ] After listings: "nearest pharmacy"
  - [ ] Router switches to local-info
  - [ ] Trace shows `mode:"write_only"`, no exceptions

- [ ] **Circuit Breaker**
  - [ ] Force Zep 5xx → breaker opens
  - [ ] Writes skipped, trace: `{used: false, mode: "off", reason: "breaker_open"}`
  - [ ] App still responds

- [ ] **429 Handling**
  - [ ] Stub Zep 429 with `Retry-After: 2`
  - [ ] No breaker open
  - [ ] `memory_zep_retry_after_seconds` increments
  - [ ] Second turn succeeds

### Phase 2: Read-Write Mode (`FLAG_ZEP_READ=true`)

**Enable only after:**
- p95 write latency < 150ms for 30-60 minutes
- Write failures / attempts < 1%
- Breaker open ratio < 0.1%
- No TTFB increase (p95 delta < +100ms)

- [ ] **Read Path**
  - [ ] WS trace: `{memory: {used: true, mode: "read_write", source: "zep", strategy: "summary", took_ms: 30}}`
  - [ ] Token budget: Summary + last 4 messages truncated if exceeded
  - [ ] Timeout (250ms): Falls back to last 4 messages, trace: `{used: false, reason: "timeout"}`

## Canary & Rollback Plan

### Canary (10% of threads)
- **Alerts:**
  - p95 TTFB > baseline + 100ms (5m window)
  - `memory_zep_context_failures_total` spike
  - Breaker open > 1% for 5m

### Automatic Downgrade
- Sustained 401/403 from Zep → Set mode to `write_only` for 10m
- Emit: `memory_zep_downgrades_total{reason="auth"}.inc()`

## Metrics to Monitor

```promql
# Write path health
rate(memory_zep_write_failures_total[5m]) / rate(memory_zep_write_requests_total[5m]) < 0.01

# Read path health
histogram_quantile(0.95, rate(memory_zep_read_latency_seconds_bucket[5m])) < 0.250

# Circuit breaker
rate(memory_zep_write_skipped_total{reason="circuit_open"}[5m]) / rate(memory_zep_write_requests_total[5m]) < 0.001

# Context failures
rate(memory_zep_context_failures_total[5m]) < 5
```

## Follow-Up PRs

1. **Per-Turn Caching** (Quick Win)
   - Cache context in shared service
   - Avoid duplicate reads in multi-agent turns

2. **Explicit Handoff Intent**
   - Agent response includes `handoff_to` field
   - Supervisor honors without re-routing

3. **Backfill Command** (Optional)
   - `manage.py zep_backfill --since=30d --dry-run`
   - Progress bar, error recovery

## Files Modified

### Core Implementation
- `assistant/monitoring/metrics.py` (new metrics + helpers)
- `assistant/memory/service.py` (timeout handling)

### Pending Updates
- `assistant/memory/tasks.py` (idempotency keys)
- `assistant/memory/pii.py` (new file - PII redaction)
- `assistant/agents/real_estate.py` (soft hints)
- `assistant/brain/supervisor_graph.py` (structured logging, handoff)
- `assistant/brain/supervisor_schemas.py` (handoff field)
- `assistant/apps.py` (mode gauge emission)
- `assistant/management/commands/zep_backfill.py` (new file)

## Testing Strategy

1. **Unit Tests**
   - `tests/memory/test_service_timeout.py` (timeout fallback)
   - `tests/memory/test_pii_redaction.py` (PII helpers)

2. **Integration Tests**
   - `tests/test_supervisor_memory.py` (end-to-end with read/write)
   - `tests/test_sticky_routing.py` (follow-ups with memory)

3. **Load Tests**
   - Locust script: 100 req/s with 10% memory reads
   - Target: p95 TTFB < 500ms, no breaker opens

## Rollout Timeline

| Phase | Duration | Goal |
|-------|----------|------|
| 1. Write-only staging | 2-3 days | Validate write path, sticky routing |
| 2. Read-write staging | 2-3 days | Validate context reads, timeout handling |
| 3. Canary (10%) | 3-5 days | Monitor alerts, no regressions |
| 4. Full rollout | 1 day | 100% traffic, celebrate 🎉 |

## Rollback Triggers

- **Immediate rollback** if:
  - p95 TTFB increase > 200ms
  - Breaker open > 5% for 10m
  - Error rate increase > 2x baseline

- **Downgrade to write-only** if:
  - Read latency p95 > 300ms for 15m
  - Context failure rate > 10% for 10m

## Questions / Decisions

1. **PII Redaction Scope:** Email + phone only, or include addresses?
   - **Decision:** Start with email + phone; addresses already geocoded

2. **Context Cache TTL:** 30s or 60s?
   - **Decision:** 30s to balance freshness vs cache hit rate

3. **Handoff Intent:** Require explicit confidence score?
   - **Decision:** No score needed; agent explicitly signals handoff

---

**Last Updated:** 2025-11-02
**Status:** Implementation in progress (Phase 1: Core metrics + timeout)
