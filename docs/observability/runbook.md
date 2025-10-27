Observability Runbook — Resilience + Telemetry

Endpoints
- Prometheus metrics: GET /api/metrics
  - Example: curl http://localhost:8000/api/metrics | grep agent_resilience

Key Metrics
- agent_resilience_retries (counter)
  - Increments on each retry attempt inside safe_execute()
- agent_resilience_failures (counter)
  - Increments when safe_execute() exhausts retries and gives up
- http_requests_total, http_request_duration_seconds
  - Request volume and latency histograms
- llm_latency_ms, llm_tokens_total, llm_cost_usd_total
  - LLM performance and cost tracking

Degraded‑Mode Behaviour
- On LLM/graph failure, the agent attempts:
  1) Checkpoint restore (cache) for last known good state
  2) Fallback response from response cache (15m TTL)
  3) Fail‑safe response if neither is available
- Response envelope includes mode: "degraded" (cached) or "fail-safe"

Recovery Steps (Operator)
1. Confirm dependencies up (DB, Redis/cache, external APIs)
2. Verify OTLP exporter endpoint (OTEL_EXPORTER_OTLP_ENDPOINT)
3. Inspect metrics for spikes in agent_resilience_retries/failures
4. Check application logs around the reported request_id
5. If persistent, scale or disable external tool causing failures

Grafana Panels (suggested)
- Resilience: retries and failures over time
- LLM latency p50/p95 and error rate
- HTTP latency and error distribution by endpoint

