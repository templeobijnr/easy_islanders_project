## Easy Islanders – Agent Roadmap

### Vision
Build a single AI agent for North Cyprus that can help with everything (housing, services, knowledge, tourism, jobs, shopping). Phase 1 delivers a production-capable Real Estate MVP to prove the model and establish the core platform.

### Guiding Principles
- **Understand-first**: The AI must analyze user intent before calling tools.
- **Internal-first**: Search internal DB first; only fall back to live hunts when needed.
- **Source-agnostic**: Never reveal original listing sources to users.
- **Automation**: Proactive seller outreach and automatic media ingestion.
- **Multilingual**: EN, TR, RU, PL, DE.
- **Privacy & Safety**: Keep contact/source private; secure webhooks; HTTPS in prod.
- **Measurable**: Define KPIs per phase.

---

## Phase 1 — Real Estate MVP (Now)

### Goals
- Parse diverse property requests (e.g., “2+1 in Girne”, “studio daily in Famagusta”).
- Search internal DB, rank matches, and render recommendation cards.
- Contact agents automatically via WhatsApp when photos/details are missing.
- Ingest seller replies (media) via Twilio webhook, store to S3/CDN (or default storage), update listing, and surface new photos immediately.
- Ingest supply/demand from external sources via the Devi webhook to keep DB fresh.

### Deliverables (Backend)
- AI Brain: `assistant/ai_assistant.py` (intent analysis, tool routing, AI matcher, memory).
- Tools: `assistant/tools/__init__.py`
  - `search_internal_listings`, `find_rental_property`, `find_used_car`, `search_services`, `get_knowledge`, `perform_google_search`, `initiate_contact_with_seller`.
- Models: `assistant/models.py`
  - `Listing`, `DemandLead`, `Conversation`, `Message`, `ServiceProvider`, `KnowledgeBase`.
- Endpoints: `assistant/urls.py`, `assistant/views.py`
  - Chat: `POST /api/chat/`
  - Listings (details): `GET /api/listings/{id}/`
  - Agent Outreach: `POST /api/listings/outreach/` and `POST /api/listings/{id}/outreach/`
  - Twilio Webhook: `POST /api/webhooks/twilio/`
  - Devi Webhook: `POST /api/webhooks/devi/`

### Deliverables (Frontend)
- Chat UI with conversation memory and multi-language prompt: `frontend/src/components/chat/EasyIslanders.jsx`.
- Recommendation cards compatible with internal card shape.
- “Contact Agent” button calling outreach endpoint.

### Data Flows
1) User Search → AI Intent → `search_internal_listings`/AI Matcher → Cards.
2) Contact Agent → Twilio WhatsApp → Seller Reply (media) → `POST /api/webhooks/twilio/` → Store → Update `Listing.structured_data.image_urls` → Cards show photos.
3) External Feeds → `POST /api/webhooks/devi/` → AI structure/route → Create `Listing` or `DemandLead`.

### Webhook Contracts
- Devi (ingestion)
  - Request JSON: `{ "items": [ {"id": "ext_123", "provider": "facebook|telegram|whatsapp|...", "content": "raw post", "postedAt": "ISO8601", "url": "...", "authorName": "...", "keywords": ["..."] } ] }`
  - Response JSON: `{ "status": "ok", "processed": N, "skipped": M, "errors": E }`
- Twilio (WhatsApp)
  - Form fields: `From`, `Body`, `MessageSid`, `MediaUrl0..9`.
  - Response JSON: success/error; updates targeted listing media and marks `verified_with_photos`.

### Success Criteria (MVP)
- T1: AI correctly understands property requests and responds in user language.
- T2: Returns at least 3 relevant internal matches where data exists.
- T3: Outreach button triggers WhatsApp message to seller; audit trail recorded.
- T4: When seller sends photos via WhatsApp, images persist and appear in cards.
- T5: Devi webhook can ingest and create new `Listing`/`DemandLead` rows.

### KPIs
- Search success rate (non-empty results): ≥ 70%.
- Outreach send success via Twilio: ≥ 95%.
- Media-to-card latency (Twilio receive → image visible): ≤ 30s (dev), ≤ 5s (prod).
- New listings ingested/day via Devi: target threshold configurable.

### Risks & Mitigations
- Twilio/S3 config issues → stub mode fallback, clear logs, health checks.
- Inconsistent source formats → robust AI structuring + defensive parsing.
- Over-aggressive scraping → rate limits, ethical sourcing, cache.

### Milestones
- M1 Search core stable (internal DB, cards).
- M2 Outreach endpoint + Twilio send working.
- M3 Twilio webhook media → storage → listing update → UI refresh.
- M4 Devi webhook ingestion live, minimal dedupe.

---

## Phase 2 — Services Agent

### Goals
- Help users find local providers (plumber, electrician, handyman, legal, etc.).
- Use `ServiceProvider` model to return vetted providers with ratings and booking links.

### Deliverables
- Expand tool routing for `service_search` intents.
- Optional: Booking/appointment flow; provider outreach (WhatsApp/SMS) like real estate.

### KPIs
- First provider result relevance score (qual. checks).
- Provider contact success rate.

---

## Phase 3 — Knowledge & Practical Info Agent

### Goals
- Answer factual/practical queries: bills, visas, procedures, laws, where-to-find.
- Use `KnowledgeBase` (expand content; add multilingual entries).

### Deliverables
- Content population pipeline (manual + ingestion scripts).
- Improved `get_knowledge` tool prompts; richer response formatting.

### KPIs
- Coverage (topics answered without fallback): target ≥ 60% initially.
- User satisfaction on knowledge answers.

---

## Phase 4 — Tourism & Jobs

### Goals
- Tourism: activities, events, “things to do”, bookings with operators.
- Jobs: curated sources, guidance on permits, application assistance.

### Deliverables
- New listing types (e.g., `job_posting`, `tour_activity`) in `Listing.listing_type`.
- Outreach/booking patterns reused from Phase 1.

---

## Architecture Overview (Current)

- AI Brain: `assistant/ai_assistant.py`
  - Detect language, analyze intent, route tools, update memory (`Conversation`, `Message`).
  - Tools (OpenAI function-calling) defined in `get_function_definitions()`.
  - Private AI matcher for fuzzy ranking over internal `Listing`.
- Tools: `assistant/tools/__init__.py`
  - Internal search, scrapers, knowledge, services, outreach, Google fallback.
- Webhooks & Views: `assistant/views.py`
  - Chat, Devi ingest, Twilio WhatsApp, Outreach, Listing details.
- Twilio Client: `assistant/twilio_client.py`
  - WhatsApp send + media processing → storage → `Listing.structured_data` updates.
- Frontend: `frontend/src/components/chat/EasyIslanders.jsx`
  - Chat UX, recommendation cards, “Contact Agent” button.

---

## Ops & Configuration (Essentials)

- Environment
  - `OPENAI_API_KEY`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
  - Storage: `AWS_STORAGE_BUCKET_NAME`, `CDN_DOMAIN` (or Django default storage)
- Production
  - HTTPS for all webhooks; reverse proxy header handling enabled.
  - Webhook signature validation (Twilio) and rate limiting.

---

## Testing & Validation

- Chat: `POST /api/chat/` with a request like “2+1 in Girne”.
- Outreach: `POST /api/listings/outreach/ { listing_id, channel: "whatsapp" }`.
- Listing details: `GET /api/listings/{id}/`.
- Twilio webhook simulation: `POST /api/webhooks/twilio/` with form fields.
- Devi webhook simulation: `POST /api/webhooks/devi/` with `items` batch.

---

## Road to “Everything Agent”

1) Stabilize Phase 1 (measure KPIs, fix bottlenecks).
2) Enable Services (Phase 2) using existing patterns (search + outreach/booking).
3) Expand Knowledge base content and retrieval quality (Phase 3).
4) Add Tourism and Jobs as new listing types, reusing search/outreach flows (Phase 4).

---

## Acceptance Checklist (Phase 1)
- [ ] Internal search returns relevant cards for common requests.
- [ ] Outreach sends WhatsApp message and records audit trail.
- [ ] Twilio webhook stores photos and updates `Listing.structured_data.image_urls`.
- [ ] Cards display new photos without manual refresh (or via simple refresh/poll step).
- [ ] Devi webhook ingests sample items into `Listing`/`DemandLead`.


