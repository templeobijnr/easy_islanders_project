-- STEP 7.2: Real Estate Offer Surface Indexes
-- Performance optimization for availability_summary queries

-- Assuming properties table with columns:
-- city, rental_type, price, currency, bedrooms

-- Individual column indexes for flexibility
CREATE INDEX IF NOT EXISTS idx_prop_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_prop_rental_type ON properties (rental_type);
CREATE INDEX IF NOT EXISTS idx_prop_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_prop_bedrooms ON properties (bedrooms);

-- Composite index for common filter combinations
-- Covers: city + rental_type + price filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_prop_city_type_price ON properties (city, rental_type, price);

-- Alternative composite for budget-first queries
CREATE INDEX IF NOT EXISTS idx_prop_price_city ON properties (price, city);

-- Note: These indexes optimize GROUP BY city queries with WHERE clauses
-- Expected p95 latency: < 150ms (uncached), < 60ms (cached)
