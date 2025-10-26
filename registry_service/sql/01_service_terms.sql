CREATE TABLE IF NOT EXISTS service_terms (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  domain         TEXT NOT NULL,
  base_term      TEXT NOT NULL,
  language       TEXT NOT NULL,
  localized_term TEXT NOT NULL,
  route_target   TEXT,
  entity_id      BIGINT,
  monetization   JSONB DEFAULT '{}'::jsonb,
  metadata       JSONB DEFAULT '{}'::jsonb,
  embedding      VECTOR(1536),
  last_embedded_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_terms_market_base
  ON service_terms(market_id, domain, language, base_term);

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_terms_market_localized
  ON service_terms(market_id, domain, language, localized_term);

CREATE INDEX IF NOT EXISTS st_idx_market_domain_lang ON service_terms(market_id, domain, language);
CREATE INDEX IF NOT EXISTS st_idx_base_term ON service_terms(base_term);
CREATE INDEX IF NOT EXISTS st_idx_route_target ON service_terms(route_target);
CREATE INDEX IF NOT EXISTS st_idx_embedding ON service_terms USING ivfflat (embedding vector_cosine_ops);

-- Optional performance tuning (requires pgvector >= 0.5.0)
-- SET ivfflat.probes = 10;
