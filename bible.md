Easy Islanders — Project Bible & Roadmap (Canonical)

Source of truth for scope, interfaces, sprints, acceptance gates, and operating rules. Treat this file as binding. If you change anything here, update the CI guardrails and schemas in the same PR.

⸻

0) Project North Star

Goal: Ship a production‑ready, chat‑centric multi‑agent marketplace for North Cyprus, starting with two domain agents:
	•	Real Estate Agent → property search, short‑stay/long‑stay requests, guided Q&A, booking handoff.
	•	Car Rental Agent → car availability, pricing quote, booking handoff.

Agents run under a Supervisor that routes intents and orchestrates sub‑tasks. Users interact through HTTP enqueue → WebSocket stream with a stable message schema.

Non‑negotiables:
	•	Zero regression on contracts (HTTP/WS). Breaking changes require versioning + migration plan.
	•	Production‑grade auth (cookie‑based JWT, header fallback only for non‑browser clients during rollout).
	•	Observability (Prometheus metrics, logs, Grafana panels) and CI guardrails.
	•	Feature‑flagged rollout; safe to enable/disable in prod.

⸻

1) What’s Already Done (✅ Delivered)

1.1 Infrastructure & Transport
	•	WebSockets fixed & hardened
	•	uvicorn[standard] + websockets installed
	•	Regex route accepts both /ws/chat/... and ws/chat/...
	•	Keep‑alive ping (30s), exponential backoff, token‑aware reconnect
	•	Cookie‑first WS auth middleware (CookieOrQueryTokenAuthMiddleware)
	•	Cookie‑based JWT Auth (PR D)
	•	DRF cookie auth class + login/refresh/logout views
	•	Access/refresh in HttpOnly cookies; query‑token fallback disabled in prod
	•	HTTP→WS E2E path validated via chat_smoke_test command

1.2 Reliability & Guardrails
	•	CI Gate B Guardrail (GitHub Actions)
	•	Minimal job on every PR: unit tests for WS routes & WS libs
	•	E2E job (manual): full stack bootstrap → JWT → /api/chat/ → WS handshake → queues → Redis → metrics
	•	Observability
	•	Prometheus metrics including websocket_connections_active, ws_message_send_errors_total
	•	Grafana dashboard panels for WS activity & send errors (5m)
	•	Docs
	•	README: Gate B CI section & cookie‑auth guide
	•	OpenAPI auth addendum: cookie login/refresh/logout + WS cookie examples
	•	Auth migration checklist

1.3 Environment & Config
	•	Docker compose with env_file for staging alignment
	•	.env.staging for prod‑like flags (DEBUG=false, cookies/CORS, feature flags)

Bottom line: Transport, auth, CI, and metrics are in place. We are ready to freeze interfaces and build agents.

⸻

2) Operating Principles (Read Before You Ship)
	1.	Interfaces First: Define contracts (OpenAPI + JSON Schemas for WS) before implementation. No ad‑hoc fields.
	2.	Version Everything: If you must break a contract, bump schema_version and support both for one release.
	3.	Fail Fast: Startup self‑check must crash on missing critical deps (WS libs, Redis, DB).
	4.	Feature Flags: All new capabilities behind flags. Flags are environment‑controlled.
	5.	Observability: Add counters, histograms, and structured logs with correlation IDs.
	6.	Reproducibility: Every E2E path has a CLI smoke test.
	7.	No Hidden State: Agents are deterministic from inputs + store. Use explicit checkpointing (LangGraph or DB).
	8.	Security: Cookies HttpOnly + Secure (prod), SameSite=Lax, CORS with credentials; no tokens in URLs/logs.

⸻

3) Canonical Interfaces (Contracts to Freeze)

These schemas are normative. Add tests that validate runtime payloads against these.

3.1 HTTP: Enqueue Chat

POST /api/chat/

Request (JSON):

{
  "message": "i need a villa in girne for 3 nights",
  "client_msg_id": "uuid-v4",
  "metadata": {
    "ui": { "screen": "chat" },
    "locale": "en-CY",
    "schema_version": "1.0"
  }
}

Response (202 Accepted):

{
  "ok": true,
  "thread_id": "uuid-v4",
  "queued_message_id": "uuid-v4",
  "client_msg_id_echo": "uuid-v4",
  "correlation_id": "uuid-v4"
}

Contract Notes:
	•	client_msg_id is required; UI uses it to reconcile WS replies.
	•	thread_id is persistent per conversation. If not provided by client, server issues/returns one.
	•	All IDs are UUIDv4. Add server‑side validation.

3.2 WebSocket: Message Stream (Server → Client)

Base envelope:

{
  "type": "chat_message | chat_status | system",
  "event": "assistant_message | typing | typing_done | error | ready",
  "thread_id": "uuid-v4",
  "schema_version": "1.0",
  "meta": { "in_reply_to": "client_msg_id or null", "ts": "ISO-8601", "trace": "..." },
  "payload": { /* event-dependent shape */ }
}

Events:
	•	chat_status/typing { value: true } and chat_status/typing_done { value: false }
	•	chat_message/assistant_message { text: string, rich?: object, agent?: string }
	•	system/error { code: string, message: string }
	•	system/ready { } upon successful handshake

Schema guardrails:
	•	Add JSON Schema files under schema/ws/1.0/*.schema.json and validate every outbound frame in the consumer.
	•	Add CI snapshot tests to catch diffs.

3.3 Supervisor → Agent Contract (Internal)

export type AgentRequest = {
  thread_id: string
  client_msg_id: string
  intent: string
  input: string
  ctx: {
    user_id: string
    locale: string
    time: string
  }
}

export type AgentResponse = {
  reply: string
  actions?: Array<{ type: string; params: Record<string, any> }>
  traces?: Record<string, any>
}

	•	Define in assistant/agents/contracts.py (Python typing) and mirror to TS for FE mocks.
	•	Agents must not reach into request/response objects outside this contract.

⸻

4) Context Discipline (How We Stay in Sync)

4.1 Message “Context Header” Template (paste at top of complex asks)

[Context]
Roadmap: docs/PROJECT_BIBLE.md (this file)
Active Sprint: S1 – Interface Freeze & Contracts
Last 3 Decisions: (1) Cookie‑first auth live; (2) WS schema v1.0; (3) Feature‑flag all agents
Open Questions: (list)
Requested Output: (what you want)

4.2 Single Source of Truth
	•	This file is the canonical plan. Link to sections in PR descriptions.
	•	Maintain an ADR log at docs/adr/NNN-title.md for irreversible decisions.
	•	Maintain a Decision Log in PR bodies (copy bullets from ADRs).

4.3 Thread Hygiene
	•	Use one persistent engineering thread for day‑to‑day dev. Use separate “lab” threads only for isolated experiments; summarize outcomes back here.

⸻

5) Sprint Plan (No dates; sequential)

Each sprint ends with acceptance gates, observable signals, and a demo. Do not start the next sprint until the gates pass.

S0 — Transport & Auth Hardening (DONE)

Goals: WS works reliably; auth is cookie‑first; CI guardrails in place.
What Shipped: See Section 1.
Evidence: Logs show WS accepted/open/closed; CI jobs green; chat_smoke_test OK; Grafana panels active.

⸻

S1 — Interface Freeze & Contracts (CURRENT)

Goal: Lock HTTP & WS schemas at v1.0 with runtime validation and CI enforcement.

Backend
	•	Create schema/http/1.0/chat_enqueue.schema.json (request & 202 response)
	•	Create schema/ws/1.0/envelopes.schema.json and per‑event schemas
	•	Add Pydantic/Dataclasses for HTTP request validation (400 on violation)
	•	Validate all outbound WS frames against JSON Schemas; safe_send_json() increments ws_message_send_errors_total on violations
	•	Add SCHEMA_VERSION=1.0 env and echo in WS frames

Frontend
	•	TypeScript types from JSON Schemas (generate via typescript-json-schema)
	•	Unit tests: reject unknown fields; strict parsing for WS events
	•	Chat UI only renders assistant_message, typing, typing_done, error from v1.0

CI/CD
	•	Add schema snapshot tests; fail PRs if schemas change without version bump
	•	Add compat job that replays golden WS frames and asserts parse success

Acceptance Gates
	•	HTTP: Enqueue validates against schema; 202 echoes client_msg_id
	•	WS: All frames validate; Grafana shows non‑zero connections and zero send errors for 24h in staging
	•	Docs: Schemas and examples live under docs/contracts/v1.0/

⸻

S2 — Core Agent Runtime + Real Estate Agent Skeleton (START BUILDING AGENTS HERE)

Goal: Deliver a running Supervisor + Agent runtime (LangGraph or equivalent) with a minimal Real Estate Agent capable of echoing intents and returning a templated property suggestion from fixtures.

Backend
	•	Add assistant/agents/runtime/ with:
	•	agent_base.py (interface, lifecycle hooks, tools registry)
	•	supervisor.py (routing policy → real_estate first; fallback → general)
	•	checkpointing.py (MemorySaver now; Postgres later) with stream IDs per thread_id
	•	tools/ example (price_format, date_range_normalizer)
	•	Add agents/real_estate/ with:
	•	schema.py (property listing fields; see S3)
	•	agent.py (accepts AgentRequest, returns AgentResponse)
	•	fixtures.json (10 representative listings for Girne/Kyrenia)
	•	Wire supervisor node into Celery task process_chat_message
	•	Emit agent field in WS assistant_message payload (e.g., "agent": "real_estate")

Frontend
	•	Surface agent badge on assistant messages
	•	Add lightweight “Properties” bubble renderer that renders the templated suggestion (title + price + link)

Testing
	•	Unit: supervisor routes property_search to real_estate
	•	E2E: prompt → 202 → WS typing → WS assistant_message from real_estate with fixture content

Acceptance Gates
	•	A user can type “need a villa in girne” and receive a templated property suggestion from fixtures through the full stack.
	•	Logs show supervisor routing + agent response; WS frames validate.

⸻

S3 — Real Estate Agent MVP (Search → Short‑Stay/Stay Inquiry)

Goal: Make Real Estate Agent genuinely useful for first users. Support search, filtering, and inquiry flows with minimal curated inventory.

Backend
	•	Define Property model (Postgres): id, title, location, sleeps, beds, baths, price_per_night, amenities[], photos[], availability ranges
	•	Simple ingestion pipeline from fixtures.json → Postgres
	•	Agent tools:
	•	search_listings(params) (location, min/max price, beds, dates)
	•	check_availability(listing_id, date_range)
	•	compose_inquiry(listing_id, user_profile) → returns structured inquiry object
	•	Agent policy: ask clarifying questions if critical fields missing (dates, party size)
	•	Supervisor support for multi‑turn slot filling

Frontend
	•	Property Result Card component (title, price, sleeps, thumbnail)
	•	“Quick Filters” pill strip (dates, budget, bedrooms)
	•	Inline clarifying questions in chat (date picker when needed)

Testing & CI
	•	Golden responses for two end‑to‑end scenarios (date present vs. missing)
	•	Schema validation for actions returned by agent (e.g., {"type":"show_listings",...})

Acceptance Gates
	•	A user can find 3–5 matching properties with filters and receive an inquiry draft as the final action payload.
	•	Grafana: median LLM latency < target; WS send errors remain zero.

⸻

S4 — Car Rental Agent MVP (Availability → Quote → Inquiry)

Goal: Add a second agent with comparable quality and shared orchestration.

Backend
	•	Car model: id, make, model, class, seats, transmission, price_per_day, locations[], availability
	•	Ingestion (fixtures or partner API mock)
	•	Agent tools:
	•	search_cars(params) (pickup/dropoff dates/location, class)
	•	quote(car_id, date_range)
	•	compose_inquiry(car_id, user_profile)

Frontend
	•	Car Card components (thumbnail, spec chips, price/day)
	•	Date range picker (reuse from S3)

Testing & CI
	•	Add car agent schemas & golden E2E case

Acceptance Gates
	•	A user can obtain a car quote and an inquiry draft through the chat with rendered result cards.

⸻

S5 — Marketplace Backbone (Agent Registry, Permissions, Routing Rules)

Goal: Formalize the multi‑agent layer and governance.

Backend
	•	Agent Registry (DB): name, version, capabilities, flags (enabled, prod)
	•	Supervisor routing rules stored in DB (editable without redeploy)
	•	Sandbox vs prod agent isolation; rate limits per agent

Frontend
	•	Admin UI: enable/disable agents, view capability matrix

Acceptance Gates
	•	Toggle agents on/off in staging without code changes; supervisor respects registry.

⸻

S6 — Orders, Payments & Handoffs (Scoped MVP)

Goal: Enable basic lead capture and transactional readiness.

Backend
	•	Inquiry ledger (id, user, agent, payload, status)
	•	Email handoff or webhook to partner systems
	•	Stripe setup for deposits (feature‑flagged)

Frontend
	•	“Send inquiry” CTA; confirmation messages

Acceptance Gates
	•	Lead records persist; optional deposit works in staging.

⸻

S7 — Production Hardening

Goal: Be robust for real users at modest scale.
	•	Scale Celery workers; timeouts & retries on tools
	•	Rate limiting per user/session
	•	Error budgets and SLOs; alerting on WS errors, 5xx spikes
	•	Audit logging for agent decisions (masks PII)

⸻

S8 — Private Beta

Goal: Put it in real hands.
	•	Invite‑only users; feedback capture in UI
	•	Feature flags: enable Real Estate + Car Rental for beta cohort
	•	Rapid PR cadence with strict CI

⸻

6) Data Models (Initial Pass)

6.1 Real Estate

Property(
  id uuid PK,
  title text,
  location text,         -- e.g., "Girne/Kyrenia"
  bedrooms int,
  bathrooms int,
  sleeps int,
  amenities text[],
  price_per_night numeric(10,2),
  photos text[],
  availability tsrange[]
)

6.2 Car Rental

Car(
  id uuid PK,
  make text,
  model text,
  class text,            -- e.g., SUV, Economy
  seats int,
  transmission text,
  price_per_day numeric(10,2),
  locations text[],
  availability tsrange[]
)


⸻

7) Testing Strategy (Defense in Depth)
	•	Unit: pure functions, tools, schema validators
	•	Contract: JSON Schema validation + snapshot tests for WS frames
	•	E2E: chat_smoke_test, plus scripted flows for S3/S4
	•	Chaos: inject tool failures; verify graceful degradation and system/error frames
	•	Load: 100 concurrent WS users; monitor send errors, LLM latency, queue depth

⸻

8) Observability & Ops
	•	Metrics: latency, queue time, WS active, WS send errors, tool success/fail, agent routing counts
	•	Tracing: correlation IDs stitched across HTTP 202 → Celery → WS
	•	Dashboards: WS panels (already added), add agent routing and tool error rates
	•	Runbooks: docs/runbooks/*.md for common alerts (WS spike, 401 storm, queue backlog)

⸻

9) Security & Privacy
	•	PII minimization; redact in logs
	•	Cookie settings: HttpOnly/Secure/Lax; no tokens in URLs
	•	CSRF: SameSite=Lax + future token for non‑GET if needed
	•	Access controls on admin features; audit trails for registry changes

⸻

10) Decision Records (ADR Index)

Create ADRs as we finalize choices. Examples to add:
	•	ADR‑001: Cookie‑first JWT for HTTP/WS
	•	ADR‑002: WS schema v1.0 and validation at send‑time
	•	ADR‑003: Supervisor/Agent contract
	•	ADR‑004: Feature flags policy

⸻

11) Immediate Next Actions (Starting Now)
	1.	Finish S1: Interface Freeze & Contracts

	•	Create JSON Schemas for HTTP enqueue and WS events (v1.0)
	•	Wire runtime validation & CI snapshot tests

	2.	Start S2: Core Agent Runtime + Real Estate Skeleton

	•	Add agent runtime, supervisor wiring, and real_estate skeleton with fixtures
	•	Render basic property card in UI; include agent badge
	•	Add E2E that asserts agent=real_estate appears in the WS assistant_message

	3.	Keep Guardrails Tight

	•	Fail PRs that touch schemas without version bumps
	•	Keep feature flags default‑off until staging verification

⸻

12) How to Ask for Work (Template)

[Context]
Active Sprint: S2 — Core Agent Runtime + Real Estate Skeleton
Goal: deliver fixture‑backed property suggestion via agent
Contracts: docs/contracts/v1.0 (HTTP/WS)

[Ask]
Implement search_listings(params) tool (backend) + render PropertyCard (frontend)

[Done When]
E2E test passes: prompt → WS assistant_message with agent=real_estate and a property card rendered.


⸻

13) FAQ

Q: When do we start building core agent functionality?
A: Sprint S2 (now) — build the agent runtime + Real Estate Agent skeleton immediately after locking S1 contracts.

Q: How do we keep context so we don’t backslide?
A: Use this file as the canonical plan, prepend the Context Header to complex asks, and block merges that change contracts without versioning.

Q: Can we reach a production MVP?
A: Yes — with S3/S4 MVPs for Real Estate and Car Rental, S5 registry, and S7 hardening, we can serve real users behind flags.

⸻

14) Appendices
	•	Paths to watch in CI: assistant/routing.py, assistant/consumers.py, easy_islanders/asgi.py, easy_islanders/startup_checks.py, requirements.txt, tests/test_ws_*.py, docs/contracts/**/*, schema/**/*
	•	Environment modes: dev, staging (.env.staging), prod
	•	Smoke commands: manage.py chat_smoke_test (takes creds or token)

⸻

Reminder: If you make a design decision in a thread, copy it into an ADR and link it here. This Bible is how we eliminate regressions and keep the whole team (and the assistant) in context.