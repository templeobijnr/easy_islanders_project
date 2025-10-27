-- Intent Router schema (seed SQL for Postgres + pgvector)

-- Enable pgvector extension if not present
CREATE EXTENSION IF NOT EXISTS vector;

-- Registered agents and domains
CREATE TABLE IF NOT EXISTS agent_registry (
  agent_id TEXT PRIMARY KEY,
  domain   TEXT NOT NULL,
  description TEXT NOT NULL,
  coverage JSONB NOT NULL,
  version  TEXT NOT NULL DEFAULT 'v1'
);

-- Intent taxonomy versions
CREATE TABLE IF NOT EXISTS intent_schema (
  intent_key TEXT PRIMARY KEY,
  domain     TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('active','deprecated')),
  parent_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Few-shot exemplars stored as embeddings and text
CREATE TABLE IF NOT EXISTS intent_exemplars (
  exemplar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key  TEXT REFERENCES intent_schema(intent_key),
  text        TEXT NOT NULL,
  vector      VECTOR(1024) NOT NULL,
  locale      TEXT,
  geo_region  TEXT,
  metadata    JSONB
);

-- Domain centroids for embedding router
CREATE TABLE IF NOT EXISTS domain_centroids (
  domain     TEXT PRIMARY KEY,
  vector     VECTOR(1024) NOT NULL,
  support_n  INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Router events and calibration store
CREATE TABLE IF NOT EXISTS router_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT,
  utterance TEXT,
  context_hint JSONB,
  stage1_safe BOOLEAN,
  domain_pred TEXT,
  domain_conf NUMERIC,
  in_domain_intent TEXT,
  action TEXT,
  latency_ms INTEGER,
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calibration_params (
  model_name TEXT PRIMARY KEY,
  method     TEXT NOT NULL,
  params     JSONB NOT NULL,
  evaluated_on TIMESTAMPTZ NOT NULL
);

-- Suggested indexes
-- CREATE INDEX IF NOT EXISTS ix_intent_exemplars_vec ON intent_exemplars USING ivfflat (vector);
-- CREATE INDEX IF NOT EXISTS ix_router_events_created ON router_events (created_at);
-- CREATE INDEX IF NOT EXISTS ix_router_events_ctx ON router_events USING GIN (context_hint);

