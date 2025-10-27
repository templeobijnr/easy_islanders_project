Below is a concise, opinionated blueprint you can use to steer design decisions now, plus a ready‑to‑circulate Technical Discovery Questionnaire at the end.



⸻



📌 Recommended defaults at a glance

• Graph vs procedural: Use a hybrid: a small, typed DAG “spine” (LangGraph‑style) for stable control flow; keep procedural orchestration inside nodes for flexibility.

• Memory: Layered memory: (1) hot session memory in Redis (small, keyed “slots”); (2) pinned facts & transactions in Postgres JSONB; (3) background vector indexing; query the vector store only on triggers (cold start, knowledge intents).

• Supervisor: Start embedded in Django (lower latency, easier coupling). Break out into a micro‑agent coordinator once you have ≥3 independent agents, shared across >1 product surface, or routing p95 > 500 ms.

• Resilience: Persist a minimal DAG context snapshot per request (idempotency token + edge position + tool args). Tag “degraded mode” in both the JSON envelope (customer‑visible) and telemetry (trace attributes).

• LLM orchestration: Keep Pydantic schemas as the hard I/O boundary; adopt LCEL pipelines where composition/reuse matters.

• Models: Dual‑model: small, fast router (classification/planning) + stronger model for synthesis/grounded reasoning. Add a lightweight evaluator for guardrails.

• RAG: Hybrid retrieval (structured SQL + vector) with a single embedding backend (start with pgvector for simplicity/ACID; you can swap later).

• Function routing: Prefer explicit supervisor dispatch for auditability; allow model tool‑calling at the leaf level only.

• Telemetry: Async OTLP export with batching; propagate one trace_id from the HTTP boundary through agents, LLMs, and tools (W3C trace context).

• Metrics: Start with fixed log‑scale hist buckets; evaluate dynamic buckets after you’ve collected a few weeks of histograms.

• Deployment: One process in dev, split containers in prod per agent class or latency domain. Use Redis Streams/Celery for async chaining; keep critical paths synchronous for UX.

• Checkpoints: Move from cache to Postgres JSONB for durability; keep Redis for hot state and cross‑request speed.

• HITL: Capture explicit thumbs‑up/down + rationale; store annotated exemplars for SFT/DPO later; expose confidence as qualitative tiers (Low/Med/High).

• Safety: Global guardrails agent for policy + per‑tool validators for inputs/outputs. Enforce call budgets, max depth, and critical‑tool whitelists.

• Release & models: Pin model versions per release; optionally discover available models at runtime to warn/prepare on drift using the /models endpoint.  



⸻



I. Architectural Direction



1) Agent Graph Design



Recommendation: Adopt a LangGraph‑like DAG for the control plane (nodes = agent roles/tools, edges = typed outcomes), while keeping procedural logic inside nodes (Python functions/coroutines).

Why: DAGs give replayability, determinism, and state inspection. Embedding procedural code within nodes preserves speed and creativity without turning everything into a graph.

How:

• Node state is a typed Pydantic model (request, working memory slots, tool results).

• Edge conditions are pure predicates over node state (e.g., needs_more_retrieval, satisfied, escalate_hitl).

• Maintain a graph registry; version graphs and emit graph_version into telemetry.



Long‑lived memory without per‑request vector hits

Use a three‑tier memory:

1. Hot session memory (Redis): Small “slots” (identity, goals, preferences, open‑loops, last‑tools) keyed by session_id. Read every request; TTL minutes‑hours.

2. Pinned facts/transactions (Postgres JSONB): Durable records (orders, SLAs, profiles). Query by primary keys or narrow indexes, not vectors.

3. Vector store (pgvector/Faiss) in write‑behind: Background job embeds new artifacts and updates an “active memory synopsis” (50–200 tokens) stored in Redis. Only query vectors when:

• Cold start (no session memory),

• Knowledge intent detected by router, or

• Answer quality check fails (low coverage).



Decouple the supervisor?

• Now: Keep it in Django (simpler context sharing, transaction scoping, auth).

• Later: Extract to a micro‑agent coordinator when: (a) you have >1 product surface; (b) routing p95 > 500 ms; (c) you need independent release cadence/scaling; (d) you require language/runtime heterogeneity.



2) Resilience & Fallback Semantics

• Checkpointing: Persist a minimal DAG context snapshot per step:

{request_id, graph_version, node_id, edge_candidates, tool_args, partial_outputs, idempotency_key, retries}.

This supports replay and exactly‑once external side‑effects (via idempotency keys).

• Degraded mode tagging:

• Application envelope: {"mode": "degraded", "reason": "...", "capabilities_disabled": [...]} (user‑visible).

• Telemetry: span attrs agent.degraded=true, agent.degraded.reason, llm.circuit_state=OPEN (for correlation).

• Self‑isolation thresholds (circuit breaker): Start with:

• Open circuit if (rolling error_rate ≥ 30% over 2 min) AND (p95 latency ≥ 2× SLO) OR time‑outs ≥ 5/min.

• Half‑open after 60 s; require success_count ≥ 5 before closing.

• Maintain per‑model/per‑tool breakers to avoid global brownouts.



⸻



II. LLM and Cognitive Layer



3) Prompt Orchestration

• LCEL vs Pydantic + tool calling: Keep Pydantic as the contract for all tool I/O and agent intents; introduce LCEL where you need composable pipelines (retrieval → routing → synthesis → validation). This yields reusability without losing strong typing.

• Deterministic vs generative: Use a dual‑model:

• Router/classifier: small, fast model for intent, safety, and plan stubs (deterministic temperature, short tokens).

• Enterprise agent: stronger model for grounded synthesis, with tool‑only or tool‑preferred prompting.

• Optionally add a third “evaluator” (cheap) to check source coverage, policy, and format before release.

• Constraining semantic drift:

• Tool‑first prompting: “If sources are insufficient, return INSUFFICIENT_GROUNDING.”

• JSON‑only outputs with strict Pydantic validation + regex/JSON schema guards.

• Coverage gate: require ≥K unique sources or coverage_score ≥ threshold; otherwise trigger re‑retrieve or clarify.

• Argument allowlists for local_lookup (columns, operators, max_rows).

• Self‑check step: ask the model to emit a fact list tied to source_ids (not chain‑of‑thought) and validate programmatically.



4) Knowledge & RAG Strategy

• Hybrid retrieval (recommended):

• Structured: direct SQL/ORM for listings, filters, sort, pagination.

• Unstructured: vector search + BM25 rerank for docs, emails, notes.

• A router chooses path or joins results (e.g., listing + owner bio).

• One embedding backend (start): Postgres + pgvector keeps data, metadata, and transactions in one DB with ACID and backups; swap to Faiss/Weaviate only if you hit memory/throughput limits.

• Function routing: Explicit supervisor dispatch for predictability/audit; allow LLM tool‑calling only at leaves to reduce orchestration chatter and simplify incident analysis.



⸻



III. Observability, Metrics, and Tracing



5) Telemetry Strategy

• OTLP transport: Use async, batched exporters (OTel SDK) to avoid inflating tail latencies. Fall back to local UDP or file when the collector is unavailable.

• Unified trace schema:

• Generate/accept a trace_id at the HTTP boundary; propagate via W3C traceparent through Django → supervisor → tools → DB/HTTP.

• Create custom spans for llm.call, retrieval.query, tool.invoke, graph.edge_decision.

• Minimal recommended attributes:

• agent.name, agent.version, graph.version, node, edge

• llm.model, llm.provider, llm.input_tokens, llm.output_tokens, llm.cache_hit

• retrieval.topk, retrieval.latency_ms, retrieval.corpus, retrieval.source_ids

• tool.name, tool.retry, tool.circuit_state

• mode (normal/degraded), user_tier, region

• Latency histograms: Start fixed log‑scale buckets (seconds):

[0.025, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1, 1.5, 2, 3, 5, 8, 13]

Revisit after N weeks—if bucket saturation or clustering is poor, generate dynamic buckets offline and ship them as config.

• PerformanceTracker placement:

• Global middleware for request/trace scaffolding + standard tags.

• Tool‑local decorators for rich, domain‑specific metrics (DB, vector, third‑party) without bloating the global middleware.



6) Prometheus/Grafana



Baseline dashboards (by team):

• Agent overview: RPS, p50/p95/p99 latency, error rate, degraded‑mode rate, circuit states.

• LLM efficiency: token in/out, cost per request, latency per 1K tokens, cache hit rate.

• Retrieval: query latency, top‑k distribution, coverage score, failures/timeouts, corpus skew.

• Resilience: retries, breaker opens, fallback invocations, safe_execute rate.

• User impact: time‑to‑first‑token (TTFT), response streaming duration, abandonment.



Example PromQL snippets:



# p95 latency by agent

histogram_quantile(0.95, sum(rate(agent_latency_seconds_bucket[5m])) by (le, agent))



# Degraded mode rate

sum(rate(agent_degraded_total[5m])) by (agent) / sum(rate(agent_requests_total[5m])) by (agent)



# LLM cost per request (assuming you emit llm_usd_total counter)

sum(rate(llm_usd_total[5m])) by (agent) / sum(rate(agent_requests_total[5m])) by (agent)



# Breaker open fraction

sum(rate(circuit_open_total[5m])) by (component) / sum(rate(circuit_events_total[5m])) by (component)



Alerts: Start rule‑based thresholds (clear ownership, fewer false positives). Layer anomaly detection later (OTel Collector processors or Grafana ML) for early warning.

• p95 latency > SLO for 10m.

• Error rate ≥ 5% for 5m (per agent and per tool).

• Degraded‑mode rate ≥ 10% for 10m.

• Breaker is OPEN > 5m.

• Cost/run spikes (>2× baseline) for 15m.



⸻



IV. Infrastructure & Scaling



7) Deployment

• Dev: Run everything inside Django for fast iteration (hot reload, single debugger).

• Prod: Separate containers for (a) supervisor+agents, (b) vector/retrieval service, (c) async workers. Scale them independently.

• Env propagation: 12‑factor: all config via env; ship a single config manifest (e.g., Doppler/Vault/SSM Parameter Store) and inject at deploy. Include: OPENAI_API_KEY, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES, MODEL_DEFAULTS, circuit thresholds.

• Async chaining: Use Redis Streams / Celery for off‑path work (long retrieval, summarization, ETL). For user‑facing steps, keep synchronous until you must break the request boundary.



8) Database & Cache

• Checkpoints: Move from Django cache to Postgres JSONB (agent_checkpoints table) for cross‑instance recovery and audit; retain Redis for ephemeral step‑state and debounce.

• Embeddings metadata (explainability):

• Table documents(id, source_url, owner, created_at, pipeline_version, tags jsonb)

• Table chunks(id, document_id, char_start, char_end, checksum, summary, embedding vector, metadata jsonb)

• Table retrieval_events(id, session_id, query, topk jsonb[{chunk_id, score}], created_at)

Link answers to retrieval_events.topk and surface source_url + char_range in the UI for traceable grounding.



⸻



V. Human‑in‑the‑Loop (HITL) & Ethics



9) Feedback Integration

• Signals: thumbs up/down, reason codes, inline edits, and “cite‑missing” flags.

• Ingestion: write to feedback_events (rich context: prompt hash, model, sources, latency, user tier).

• Use:

• Immediate: route low‑confidence to review queue; pin accepted edits into pinned facts.

• Near‑term: curate SFT datasets and DPO pairs (good/bad).

• Long‑term: train a lightweight reward model to score drafts before release.



Confidence in UI: expose qualitative tiers derived from measurable signals (coverage, agreement between router & evaluator, tool success):

• High: ≥2 corroborating sources, evaluator pass.

• Medium: partial coverage or minor validator warnings.

• Low: low coverage or any critical validator fail → auto‑HITL.



10) Governance & Safety

• Prevent recursive escalation:

• Hard call budgets (tokens/tools), max recursion depth, allowed tool DAG, and critical‑tool allowlist.

• Require human approval for destructive actions or high‑impact costs.

• Central vs per‑tool: Use both:

• Global guardrails agent for policy (PII, compliance, unsafe topics).

• Per‑tool validators (schemas, regex, semantic checks) before and after execution.



⸻



VI. Development Workflow & Testing



11) Chaos & Reliability Testing

• LLM/API fault injectors in CI: deterministically simulate timeouts, 429s, 5xx, slow streams, schema‑breaking outputs, and malformed tool responses.

• Replay harness: feed recorded requests into graphs with seeded random and fixed model responses (fixtures) to validate degraded paths.

• Metrics: Aggregate safe_execute_* and guarded_llm_call_* into a single “resilience report” by build SHA.



12) Versioning & Rollout

• Model drift: Pin exact model IDs at release time. Monitor availability & deprecations; the /models endpoint lists available models and is your programmatic source of truth; also watch the official Deprecations and Changelog pages.  

• If you detect an ID mismatch, warn & fallback (config‑controlled), but do not silently swap without an ADR.

• Blue‑green / canary:

• Run graph_version=N+1 behind a header or user‑bucket (1–5%).

• Emit graph.version in spans and metrics; compare p95, error, and degraded rates before graduating.



⸻



📄 Technical Discovery Questionnaire (Markdown / Notion‑ready)



Purpose: Canonical audit sheet to drive Sprint 3 decisions (Observability & HITL) and the next phase of agentization.



Header

• Workstream: Agents / Observability / HITL

• Owner: ☐

• Stakeholders: ☐ Product ☐ Eng ☐ Data ☐ Security ☐ Legal

• Target release: ☐

• ADR link: ☐



⸻



I. Architectural Direction

1. Graph shape

• Decision: ☐ Hybrid DAG (recommended) ☐ Procedural only ☐ Full DAG

• Node state schema defined? ☐ Yes (link) ☐ No

• Edge predicates enumerated & tested? ☐ Yes ☐ No

2. Memory strategy

• Slots defined (identity/goals/preferences/open‑loops)? ☐ Yes (list) ☐ No

• Pinned facts in Postgres JSONB? ☐ Yes ☐ No

• Vector query triggers: ☐ Cold start ☐ Knowledge intents ☐ Low coverage re‑query

3. Supervisor placement

• ☐ Embedded in Django (now) ☐ Standalone coordinator (when thresholds hit)

• Extraction criteria & SLOs documented? ☐ Yes (link) ☐ No



II. LLM & Cognitive Layer

4. Orchestration

• Hard I/O boundary with Pydantic? ☐ Yes ☐ No

• LCEL pipelines identified (where composition helps)? ☐ Yes (list) ☐ No

5. Model policy

• Routing model: ☐ chosen (id) ☐ TBD

• Synthesis model: ☐ chosen (id) ☐ TBD

• Evaluator step in place? ☐ Yes ☐ No

6. Drift constraints

• JSON schema validation enforced? ☐ Yes ☐ No

• Coverage threshold (K sources / score): ☐ value

• INSUFFICIENT_GROUNDING fallback path implemented? ☐ Yes ☐ No



III. Observability & Tracing

7. Trace model

• Single trace_id from HTTP boundary? ☐ Yes ☐ No

• Custom spans: ☐ llm.call ☐ retrieval.query ☐ tool.invoke ☐ graph.edge_decision

• Standard attrs emitted (model, tokens, coverage, mode)? ☐ Yes ☐ No

8. Metrics

• Latency hist buckets agreed (list)? ☐

• SLOs per agent/tool documented? ☐ Yes ☐ No

9. Dashboards & alerts

• Grafana dashboards live? ☐ Agent ☐ LLM ☐ Retrieval ☐ Resilience

• Alerts: ☐ p95>SLO ☐ err>5% ☐ degraded>10% ☐ breaker open ☐ cost spike



IV. Infrastructure & Scaling

10. Deployment shape



• Dev: ☐ unified

• Prod: ☐ split (agents / retrieval / workers)



11. Env & secrets



• Centralized config (Vault/SSM/Doppler)? ☐ Yes ☐ No

• OTEL/Model configs versioned? ☐ Yes ☐ No



12. Async



• Redis Streams/Celery topology documented? ☐ Yes ☐ No

• Trace context propagation verified? ☐ Yes ☐ No



V. Data, Checkpoints, and RAG

13. Checkpoints



• Postgres JSONB schema (agent_checkpoints) ready? ☐ Yes ☐ No

• Idempotency keys enforced for side‑effects? ☐ Yes ☐ No



14. Explainability



• documents/chunks/retrieval_events tables deployed? ☐ Yes ☐ No

• UI shows source URLs & char ranges? ☐ Yes ☐ No



VI. HITL, Governance, Safety

15. Feedback



• Thumbs + rationale captured? ☐ Yes ☐ No

• Review queue & pinning flow defined? ☐ Yes ☐ No

• SFT/DPO dataset pipeline scheduled? ☐ Yes ☐ No



16. Safety



• Guardrails agent policies (PII, unsafe)? ☐ Yes ☐ No

• Per‑tool validators (schema/regex/semantic)? ☐ Yes ☐ No

• Budgets: ☐ token ☐ tool calls ☐ recursion depth



VII. Reliability & Rollout

17. Chaos tests



• Fault injection cases implemented (timeouts/429/5xx/schema errors)? ☐ Yes ☐ No

• Degraded‑mode replay scenarios in CI? ☐ Yes ☐ No



18. Model versioning



• Model IDs pinned per release? ☐ Yes ☐ No

• /models check & deprecation monitor in place? ☐ Yes ☐ No.  



19. Blue‑green / canary



• Header/bucket routing config? ☐ Yes ☐ No

• graph.version emitted + compared in Grafana? ☐ Yes ☐ No



⸻



Implementation snippets (copy/paste)



Minimal DAG snapshot (persist per step)



{

  "request_id": "uuid",

  "graph_version": "agents@1.3.2",

  "node": "retrieval",

  "edge_candidates": ["more_retrieval","satisfied","hitl"],

  "tool_args": {"query": "..."}, 

  "partial_outputs": {"topk_ids": ["c123","c456"]},

  "idempotency_key": "uuid",

  "retries": 1,

  "timestamp": "2025-10-27T10:15:33Z"

}



Response envelope (user‑visible)



{

  "mode": "degraded",

  "reason": "llm.circuit_state=OPEN",

  "capabilities_disabled": ["synthesis","long_retrieval"],

  "data": {...}

}



OTel span attributes (LLM call)



agent.name=enterprise_agent

graph.version=agents@1.3.2

llm.model=<model-id>

llm.input_tokens=812

llm.output_tokens=271

llm.cache_hit=false

retrieval.coverage_score=0.74

agent.degraded=false



Circuit breaker (pseudo)



if error_rate_2m >= 0.30 and p95_latency >= 2*SLO or timeouts_last_min >= 5:

    breaker.open(cooldown=60)





⸻



Why the /models reference matters for drift



The Models API can be queried at runtime to enumerate available models; monitoring the Deprecations and Changelog helps you plan migrations before IDs are removed or renamed. Use it for warning/telemetry, not for hot‑swapping in prod without an ADR.  



⸻



What I did for you

• Gave concrete recommendations (defaults + thresholds) for each decision point.

• Produced a ready‑to‑use discovery questionnaire you can paste into Notion/Confluence or commit as DISCOVERY.md.

• Included minimal JSON/PromQL/Python snippets for immediate adoption.




