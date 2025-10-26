CREATE TABLE IF NOT EXISTS local_entities (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  category       TEXT NOT NULL,
  subcategory    TEXT,
  city           TEXT NOT NULL,
  address        TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  phone          TEXT,
  website        TEXT,
  localized_data JSONB DEFAULT '{}'::jsonb,
  last_verified  TIMESTAMPTZ,
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS le_idx_market_cat_city ON local_entities(market_id, category, city);
CREATE INDEX IF NOT EXISTS le_idx_geo ON local_entities(latitude, longitude);
