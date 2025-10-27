EASY ISLANDERS PRODUCT ENGINEERING ROADMAP — PHASE B2 (Agent Resilience + Telemetry)

Status baseline: October 2025
Goal: Reach production‑grade AI assistant system (resilient, observable, explainable, deployable)

High‑Level Epics
- E1. Core AI Agent Maturity — 80%
- E2. Agent Resilience & Fault Recovery — 50%
- E3. Telemetry & Observability Hardening — 60%
- E4. Production Infrastructure & DevOps — 40%
- E5. Frontend Integration & Experience — 75%
- E6. Enterprise Guardrails & Compliance — 40%

Sprints (6 weeks total, 2‑week sprints)

Sprint 1 — Agent Resilience Integration
- Objective: Make agent self‑recovering under failure.
- Stories:
  1) Integrate resilience.py with checkpointing.py and memory.py
  2) Implement transactional rollback for LLM + DB writes (transactions.py)
  3) Add fallback cache read from caching/response_cache.py
  4) Unit test chaos scenarios (pytest --maxfail=1)
- Deliverable: Agent survives transient LLM or DB outage without crashing.
- Success Metric: < 2% unhandled exceptions per 1k requests.

Sprint 2 — Telemetry & Observability
- Objective: Full tracing and metrics correlation.
- Stories:
  1) Link monitoring/otel_instrumentation.py to Django middleware
  2) Add span decorators in brain/llm.py, brain/context_manager.py, brain/tools.py
  3) Ensure metrics feed Prometheus (docker‑compose.observability.yml)
  4) Deploy Grafana dashboards (docs/observability/dashboards.md)
  5) Validate alerting rules (alerts.md)
- Deliverable: 100% request tracing from API → LLM call → DB commit.
- Success Metric: p95 latency visible; zero blind spots.

Sprint 3 — Guardrails & Compliance Layer
- Objective: Enforce enterprise policies and safe behavior.
- Stories:
  1) Activate enterprise_guardrails.py hooks in chat_with_assistant
  2) Validate tone, data access, and transaction limits
  3) Integrate enterprise_schemas.py for structured logging
  4) Feature flag toggle in models.FeatureFlag
- Deliverable: Audit‑ready safety filters and controlled rollout.
- Success Metric: No unfiltered output beyond policy thresholds.

Sprint 4 — Production Infrastructure & Soak Testing
- Objective: Stable, monitored production environment.
- Stories:
  1) Migrate DB to managed Postgres; set env vars (DB_*)
  2) Validate bootstrap_postgres_checkpoints.py and health_check.py
  3) Run soak test from docs/observability/staging_soak_monitor.md
  4) Add CI/CD workflow for deploy + rollback
- Deliverable: Auto‑recovering production service with metrics feed.
- Success Metric: 48h soak test, 0 critical alerts.

Sprint 5 — Frontend Integration & Experience
- Objective: Full‑stack sync and UX reliability.
- Stories:
  1) Implement JWT refresh logic and auth retry
  2) Fix CORS and token expiry in api.js
  3) Add graceful fallback UI for backend 5xx or latency
  4) Local caching of chat threads via IndexedDB
- Deliverable: Chat interface operates even under degraded backend.
- Success Metric: 99% successful message sends over 1k sessions.

Sprint 6 — Release Hardening & Documentation
- Objective: Ship version 1.0.
- Stories:
  1) Final QA regression suite
  2) Document API contracts (API_CONTRACTS.md) and runbook updates
  3) Archive telemetry benchmarks and failure post‑mortems
  4) Prep marketing and product analytics hooks
- Deliverable: Deployment‑ready, fully instrumented product.
- Success Metric: Release candidate deploys cleanly to production.

Supporting Tracks
- DevOps: automate migrations, log rotation, secrets management
- QA: integrate load testing (Locust + Postgres metrics)
- Analytics: structured event logging via observability.py
- Security: verify JWT, CORS, HTTPS in production

Final State Checklist
- Reliability: > 99.5% uptime under soak load
- Traceability: All agent calls visible in Grafana
- Fault recovery: Automatic retry/rollback on LLM or DB error
- Data integrity: No uncheckpointed writes
- User experience: < 300ms perceived latency median
- Compliance: All responses pass enterprise guardrails
- Documentation: Runbook + dashboards current

Notes (current repo status)
- Resilience wrappers in place (assistant/brain/resilience.py); integrated in agent synthesis path.
- OTEL + Prometheus wiring present (assistant/monitoring/*); /api/metrics exposed.
- Next highest ROI tasks: JWT refresh in FE, response cache layer, span coverage in tools and context manager.

