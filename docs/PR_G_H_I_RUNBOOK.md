PR-G/H/I Memory Rollout Runbook

- Flags
  - Set `FLAG_ZEP_WRITE=true`, `FLAG_ZEP_READ=false` (write-only) to start.
  - Later enable reads: `FLAG_ZEP_READ=true`.

- On boot
  - App emits `memory_mode_gauge{mode}` and a boot log line with the mode.

- Write-only validation
  - Send message with PII; DB stores raw; Zep gets redacted `[EMAIL]`/`[PHONE]`.
  - Metrics:
    - `sum by(mode) (memory_mode_gauge)` → `write_only == 1`.
    - `rate(memory_zep_write_requests_total[5m])` increases.
    - `sum by(field_type) (memory_zep_redactions_total)` ticks for `email|phone`.

- Read canary (after enabling read)
  - First turn: `traces.memory.cached=false`, subsequent turn ≤30s: `true`.
  - Metrics:
    - `rate(memory_zep_context_cache_hits_total[5m])` climbs.
    - `histogram_quantile(0.95, sum(rate(memory_zep_read_latency_seconds_bucket[5m])) by (le)) < 0.25`.

- Structured logs per turn
  - One line with key `assistant_turn` including: `thread_id`, `mode`, `zep.used`, `zep.cached`, `read_ms`, `write_ms`, `redactions`, `agent`, `results`, `ttfb_ms`, `status`.

- Cache invalidation
  - After successful user or assistant mirror, cache is invalidated for that thread.

- Grafana panels (PromQL)
  - `sum by(mode) (memory_mode_gauge)`
  - `rate(memory_zep_context_cache_hits_total[5m])`
  - `histogram_quantile(0.95, sum(rate(memory_zep_write_latency_seconds_bucket[5m])) by (le))`
  - `sum by(field_type) (memory_zep_redactions_total)`

