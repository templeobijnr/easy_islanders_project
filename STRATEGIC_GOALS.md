# Easy Islanders - Strategic Goals & Roadmap

**Document Date:** November 2025  
**Planning Horizon:** 18 months (Q4 2025 - Q2 2027)

---

## Vision Statement

**"Build the conversational AI marketplace for island communities, making it effortless for locals and visitors to discover, request, and book accommodations, vehicles, services, and products through natural language."**

### Mission
Enable sustainable commerce on island economies through intelligent AI-driven matching between buyers and sellers, reducing friction and information asymmetry.

### Core Values
- **User-Centric**: Conversational, not transactional
- **Data-Driven**: Metrics guide every decision
- **Community-First**: Local priorities over global scale
- **Transparency**: Clear pricing, no hidden fees
- **Reliability**: Production-grade systems, not startups hacks

---

## Current State Assessment (November 2025)

### ✅ What We Have
- **Production-Ready Core**: Django + React + PostgreSQL + WebSocket architecture
- **Secure Authentication**: HttpOnly JWT cookies, role-based access
- **Intent Router v1.5**: 92% accuracy with calibration and governance guardrails
- **Real Estate Agent (Step 1-2/5)**: Basic supervisor integration, tenure support in DB
- **Booking System**: Full short-term + long-term booking models and UI
- **Observability**: Prometheus metrics, Grafana dashboards, structured logging
- **Multi-Language**: 5 languages supported (en, tr, ru, pl, de)
- **Test Coverage**: Unit, integration, E2E tests with CI gates
- **Deployment Ready**: Docker, Docker Compose, Railway/Fly.io compatible

### ⚠️ What We're Missing
- **Payment Processing**: No Stripe/PayPal integration
- **SMS/Email**: Notifications ready, but not fully wired
- **Reviews/Ratings**: No post-booking feedback system
- **Seller Analytics**: No demand insights for businesses
- **Mobile App**: Web-only
- **Second Agent**: Only Real Estate + stub agents
- **User Recommendations**: No ML-based personalization
- **Dynamic Pricing**: Fixed pricing only
- **Community Expansion**: Cyprus-only, no geographic scaling yet

### 🎯 Key Metrics (Baseline)
- Router accuracy: 92%
- WebSocket p95 latency: ~150ms (post-fix)
- Real Estate search: ~100ms (p95)
- Test pass rate: 100%
- Production uptime: 99%+ (staging)
- User count: ~50 (internal testing)
- Listings in system: ~6 (seeded)
- Bookings: 0 (pre-launch)

---

## Phase 1: Production Stabilization (90 Days - Q4 2025)

### Goal
**Launch to production with 24-hour monitoring, achieve 99.5% uptime SLA, onboard first 100 real users.**

### Objectives

#### 1.1 WebSocket Stability & Monitoring
**Owner:** Backend Lead  
**Timeline:** Week 1-2

**Tasks:**
- [ ] Deploy WebSocket fixes to staging
- [ ] Run 24h soak test with synthetic load (100+ concurrent connections)
- [ ] Create Grafana dashboard: WebSocket health (connections, message rate, latency, errors)
- [ ] Set up alerts: connection failure spike, p95 latency > 500ms, memory leak detection
- [ ] Document runbook for WebSocket issues

**Success Criteria:**
- Zero spikes in `ws_closes_total{code="4401"}` for 24h
- p95 connection duration ≥ 2 hours
- Memory stable after 8h sustained connections
- All 4 WebSocket metrics emitting correctly

**Resources:**
- 2 engineers, 1 DevOps
- Staging server with sustained load

---

#### 1.2 Real Estate Agent - Complete Steps 3-5
**Owner:** Agent Lead  
**Timeline:** Week 2-4

**Step 3: Contract Locks v1.0**
- [ ] Freeze WebSocket + Agent contracts as JSON schemas
- [ ] Create 7 snapshot tests (golden frames)
- [ ] Add CI workflow to validate schema drift
- Deliverable: `schema/ws/1.0/` and `schema/agent/real_estate/1.0/`

**Step 4: Golden Session Tests**
- [ ] Record 5 end-to-end conversations: short-term, long-term, no results, error handling, disambiguation
- [ ] Create fixtures with expected outputs
- [ ] Add integration tests validating agent behavior matches golden
- Deliverable: `tests/golden/agent/v1.0/` with 5 JSON frames

**Step 5: Staging Rollout & Monitoring**
- [ ] Deploy RE agent to staging
- [ ] Create metrics dashboard: search volume, tenure split, execution time, error rate
- [ ] Validate all 4 metrics emitting: requests_total, execution_seconds, results_count, tenure_label
- [ ] 48h staging monitoring before production

**Success Criteria:**
- Contract validation passes in CI
- Golden tests all passing (5/5)
- Agent metrics dashboard shows expected behavior
- No regressions vs. stub agent

**Resources:**
- 2 engineers, 1 QA
- 2 days staging time

---

#### 1.3 Database Readiness
**Owner:** Database Admin  
**Timeline:** Week 1-2

**Tasks:**
- [ ] Production PostgreSQL: RDS or managed Postgres (2 cores, 16GB RAM minimum)
- [ ] Verify pgvector extension installed
- [ ] Run migrations: real_estate, listings, assistant, users, bookings
- [ ] Create indexes: composite indexes for real estate search, availability lookups
- [ ] Setup automated backups: daily snapshots, 30-day retention
- [ ] Test restore procedure from backup
- [ ] Configure connection pooling: pgbouncer (50 connections)

**Success Criteria:**
- All migrations apply cleanly
- Composite indexes created and verified
- Query plans use indexes for key searches
- Backup/restore tested and documented

**Resources:**
- 1 database engineer, 1 DevOps
- Production infrastructure

---

#### 1.4 Authentication Security Audit
**Owner:** Security Lead  
**Timeline:** Week 1-3

**Tasks:**
- [ ] Penetration test: JWT token validation, cookie security, CORS
- [ ] Verify HttpOnly flag on all cookies (no JavaScript access)
- [ ] Test token refresh flow under high concurrency
- [ ] Validate rate limiting: 5 auth attempts/min per IP
- [ ] Check CSRF protection: SameSite=Lax on all cookies
- [ ] Review PII handling: logs redaction, encryption in transit
- [ ] Document security checklist for deployments

**Success Criteria:**
- Zero critical findings
- All security headers present
- Token refresh handles concurrent requests correctly
- Rate limiting working as specified

**Resources:**
- 1 security engineer, 1 backend engineer
- External penetration tester (optional)

---

#### 1.5 User Onboarding & First 100 Users
**Owner:** Product/Ops Lead  
**Timeline:** Week 3-4

**Tasks:**
- [ ] Create internal test user accounts (20-30)
- [ ] Write onboarding guide: how to search, book, create requests
- [ ] Record demo video: end-to-end workflow
- [ ] Setup feedback collection: Google Form + email address
- [ ] Plan user testing sessions: 10-15 external users
- [ ] Prepare support runbook: common issues and resolutions

**Success Criteria:**
- 100 internal + external testers active
- 50+ bookings created in staging
- NPS score collected (target: > 50)
- Zero critical issues blocking usage

**Resources:**
- 1 product manager, 1 customer success, 1 engineer (support)

---

### Phase 1 Deliverables

| Deliverable | Owner | Status |
|-------------|-------|--------|
| WebSocket soak test, alerts, runbook | Backend | Week 2 |
| RE Agent contracts v1.0 + CI validation | Agent | Week 3 |
| Golden session tests (5 frames) | QA | Week 4 |
| Production PostgreSQL + backups | DevOps | Week 2 |
| Security audit + findings remediation | Security | Week 3 |
| 100 test users + booking data | Product | Week 4 |
| Production deployment checklist | All | Week 4 |

### Phase 1 Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| WebSocket connection success rate | ≥ 99.5% | Backend |
| p95 WebSocket message latency | < 200ms | Backend |
| Real Estate agent accuracy | ≥ 95% (golden tests) | Agent |
| Production uptime (24h soak) | ≥ 99.5% | DevOps |
| Security audit findings | 0 critical | Security |
| Test user NPS | ≥ 50 | Product |
| Booking conversion rate | ≥ 10% (50/500 sessions) | Product |

### Phase 1 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| WebSocket memory leak under load | Medium | High | Load testing + heap snapshots |
| Router accuracy drops in production | Low | Medium | A/B test new classifier, gradual rollout |
| Database performance degradation | Low | High | Index validation, query plan review, load test |
| User onboarding churn | Medium | Medium | Early feedback loops, support hotline |

---

## Phase 2: Payment & Seller Tools (6 Months - Q1 2026)

### Goal
**Enable end-to-end monetization: payment processing, seller analytics, SMS notifications. Target 1,000 active users, 100 sellers, £50k GMV.**

### Objectives

#### 2.1 Payment Processing Integration
**Owner:** Payments Lead  
**Timeline:** Week 1-6

**Stripe Integration:**
- [ ] Create Stripe account, configure webhooks
- [ ] Implement payment endpoint: `POST /api/payments/create-checkout/`
- [ ] Handle webhook: booking confirmation on successful payment
- [ ] Add refund handling: refund on cancellation
- [ ] Implement commission calculation: Easy Islanders takes 5-10% per booking
- [ ] Add compliance: PCI DSS assessment, terms of service
- [ ] Create seller payout workflow: monthly payouts to seller bank accounts
- [ ] Implement analytics: revenue per day/week/month

**Frontend:**
- [ ] Booking confirmation page with Stripe Checkout embed
- [ ] Payment success/failure handling
- [ ] Order history with payment status
- [ ] Invoice generation and email delivery

**Success Criteria:**
- 100 test payments processed successfully
- Refund flow tested
- Webhook delivery reliable (99%+)
- Commission calculation audited

**Resources:**
- 2 engineers, 1 QA, 1 finance
- Stripe account + test keys

---

#### 2.2 SMS & Email Notifications
**Owner:** Communications Lead  
**Timeline:** Week 3-8

**SMS (Twilio):**
- [ ] Setup Twilio account, configure messaging API
- [ ] Implement SMS queue: booking confirmation, seller alert, payment receipt
- [ ] Create templates: 5 SMS templates (booking, payment, reminder, cancellation, new request)
- [ ] Add opt-in/opt-out: user preferences for SMS notifications
- [ ] Rate limiting: 1 SMS per minute per user
- [ ] Cost tracking: monitor SMS spend

**Email (SendGrid or Amazon SES):**
- [ ] Create email templates: 10+ templates (booking, payment, request, response, reminder)
- [ ] Implement batching: digest emails for inactive users
- [ ] Setup delivery monitoring: bounce rate, spam complaints
- [ ] Add unsubscribe links and compliance

**Celery Tasks:**
- [ ] Async task for SMS delivery with retry
- [ ] Async task for email delivery with retry
- [ ] Scheduled tasks for reminder emails (day before booking, 7 days after)

**Success Criteria:**
- 100 test SMS delivered successfully
- Email deliverability ≥ 98%
- SMS opt-in rate ≥ 60% of users
- Cost per booking notification < £0.05

**Resources:**
- 2 engineers, 1 communications designer
- Twilio + SendGrid/SES accounts

---

#### 2.3 Seller Analytics & Dashboard
**Owner:** Analytics Lead  
**Timeline:** Week 4-10

**Seller Dashboard:**
- [ ] Create dashboard endpoint: `GET /api/seller/analytics/`
- [ ] Display KPIs: total leads, response rate, conversion rate, revenue
- [ ] Implement filters: date range, booking type, category
- [ ] Add visualizations: Grafana embedded or custom charts

**Metrics to Track:**
- Requests received (by category, tenure)
- Response rate (avg time to respond)
- Conversion rate (requests → bookings)
- Revenue (total, by property, by month)
- Booking duration (avg, trend)
- Customer ratings (avg score)

**Reports:**
- [ ] Monthly seller report: PDF export with key metrics
- [ ] Weekly digest email: top performing properties, new leads
- [ ] Custom reports: seller can filter/export data

**Success Criteria:**
- Seller dashboard loading in < 500ms
- Metrics accuracy validated against raw data
- Export to CSV/PDF working
- 80% seller adoption in Q1

**Resources:**
- 1 backend engineer, 1 frontend engineer, 1 data analyst
- Grafana or dashboard library (e.g., Apache Superset)

---

#### 2.4 Second Agent: Vehicle/Car Rental
**Owner:** Agent Lead  
**Timeline:** Week 5-12

**Vehicle Agent Specification:**
- **Intent**: "I need a car rental for 3 days next month"
- **Slots**: vehicle_type (sedan, suv, van), duration_days, location, budget
- **Tools**: search_vehicles, check_availability, calculate_price
- **Database**: vehicle_listing, vehicle_availability (similar to real_estate)

**Implementation:**
- [ ] Create vehicle_listing and vehicle_availability models
- [ ] Implement vehicle search tool: filter by type, location, price, availability
- [ ] Update router: add vehicle_rental intent (test on corpus)
- [ ] Create Vehicle Agent using same pattern as Real Estate
- [ ] Add golden frames: 3 tests (found results, no results, wrong query)
- [ ] Integrate with payment: calculate rental total, handle payment

**Success Criteria:**
- Router detects vehicle_rental intent with 85%+ accuracy
- Vehicle search returns correct results within 150ms
- Golden tests passing (3/3)
- Vehicle agent integrated into supervisor

**Resources:**
- 2 engineers (1 backend, 1 agent specialist)
- 7 days development + 3 days testing

---

#### 2.5 Reviews & Ratings System
**Owner:** Product Lead  
**Timeline:** Week 6-10

**Models:**
- [ ] Create Review model: rating (1-5), text, booking, author, created_at
- [ ] Add property/seller rating calculation: avg rating, count, trend
- [ ] Implement moderation: flagging inappropriate reviews

**API:**
- [ ] `POST /api/bookings/{booking_id}/review/` - Post review after booking
- [ ] `GET /api/listings/{listing_id}/reviews/` - Get property reviews
- [ ] `GET /api/sellers/{seller_id}/rating/` - Get seller rating

**Frontend:**
- [ ] Review form component (1-5 stars + text)
- [ ] Review display on listing detail page
- [ ] Seller rating badge on cards

**Success Criteria:**
- Review submission in < 500ms
- Review loading with pagination
- Seller average rating displayed prominently
- Target: 30% of bookings reviewed by end of Q1

**Resources:**
- 1 backend engineer, 1 frontend engineer, 1 QA

---

### Phase 2 Deliverables

| Deliverable | Owner | Status |
|-------------|-------|--------|
| Stripe integration + payment flow | Payments | Week 6 |
| SMS + email notifications | Communications | Week 8 |
| Seller dashboard + analytics | Analytics | Week 10 |
| Vehicle Agent (Step 1-2) | Agent | Week 12 |
| Reviews & ratings system | Product | Week 10 |
| Admin moderation tools | Operations | Week 12 |

### Phase 2 Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Payment success rate | ≥ 95% | Payments |
| SMS delivery rate | ≥ 98% | Communications |
| Email deliverability | ≥ 98% | Communications |
| Seller dashboard adoption | ≥ 80% of active sellers | Analytics |
| Vehicle agent accuracy | ≥ 85% (corpus test) | Agent |
| Review submission rate | ≥ 30% of bookings | Product |
| Active users | 1,000+ | Product |
| Active sellers | 100+ | Product |
| GMV (Gross Merchandise Value) | £50k+ | Finance |

### Phase 2 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Payment processing complexity (PCI, refunds) | Medium | High | Early Stripe integration, legal review |
| SMS cost overruns | Medium | Medium | Rate limiting, opt-in only, cost monitoring |
| Vehicle agent data quality issues | Low | Medium | Manual data entry, seller validation, quality checks |
| Review spam/abuse | Medium | Low | Moderation queue, flagging, automated filters |

---

## Phase 3: Scale & Personalization (12 Months - Q2 2026)

### Goal
**Expand to 5,000 active users, 500 sellers, £500k GMV. Launch in second island community (Malta). Implement ML-powered recommendations.**

### Objectives

#### 3.1 Recommendation Engine
**Owner:** ML Lead  
**Timeline:** Week 1-8

**Collaborative Filtering:**
- [ ] Collect user interaction data: searches, bookings, reviews
- [ ] Build user-property embedding model
- [ ] Implement recommendation endpoint: `GET /api/recommendations/`
- [ ] A/B test: recommendations vs. trending listings
- [ ] Track CTR, conversion, session duration

**Content-Based Filtering:**
- [ ] Extract property features: location, price, amenities, reviews
- [ ] Build similarity model: "similar to property X"
- [ ] Display: "Properties similar to your last booking"

**Success Criteria:**
- Recommendation CTR ≥ 2x baseline
- Conversion rate improvement: +15% (A/B test)
- Latency: < 500ms for recommendation generation
- Cold start handled gracefully (trending listings)

**Resources:**
- 1 ML engineer, 1 data scientist, 1 backend engineer

---

#### 3.2 Geographic Expansion: Malta
**Owner:** Expansion Lead  
**Timeline:** Week 4-12

**Localization:**
- [ ] Seed Maltese listings (50+) in real_estate DB
- [ ] Add Malta cities to search filters
- [ ] Add Maltese language support (optional)
- [ ] Localize payment: EUR currency, Maltese banks
- [ ] Adjust SMS/email: country codes, local compliance

**Seller Onboarding:**
- [ ] Recruit 50-100 Maltese sellers
- [ ] Create onboarding video in local context
- [ ] Setup support: Maltese-speaking team
- [ ] Monitor: listing quality, response rates

**Marketing:**
- [ ] Localized landing page
- [ ] Facebook/Instagram ads targeting Malta
- [ ] Partnerships with local tourism boards
- [ ] Press outreach to local media

**Success Criteria:**
- 50+ active Maltese sellers by end of phase
- 200+ Maltese listings
- Malta bookings: 10% of total by month 12
- Seller satisfaction: NPS ≥ 50

**Resources:**
- 1 expansion lead, 1 community manager (Malta-based), 1 engineer
- Marketing budget: £20k

---

#### 3.3 Mobile App (React Native)
**Owner:** Mobile Lead  
**Timeline:** Week 5-16

**MVP Features:**
- [ ] Chat interface (message sending/receiving)
- [ ] Property search and browse
- [ ] Booking creation and management
- [ ] Push notifications
- [ ] Authentication via same JWT cookies

**Architecture:**
- [ ] React Native + Expo for faster development
- [ ] Reuse API client code from web
- [ ] Local storage for offline messages (sync on reconnect)
- [ ] Native push notifications (Firebase Cloud Messaging)

**Testing & Launch:**
- [ ] Beta testing: 100 testers
- [ ] iOS + Android app store submission
- [ ] Monitor crash rates, performance

**Success Criteria:**
- App store rating ≥ 4.5 stars
- 20% of MAU using mobile app
- Crash-free sessions ≥ 99%
- Installation: 500+ in first month

**Resources:**
- 2 mobile engineers, 1 QA, 1 designer
- Expo, Firebase accounts

---

#### 3.4 Dynamic Pricing
**Owner:** Revenue Lead  
**Timeline:** Week 8-14

**Algorithm:**
- [ ] Collect pricing data: similar properties, demand, seasonality
- [ ] Build pricing model: recommend price based on demand/supply
- [ ] Implement A/B test: dynamic pricing vs. fixed pricing
- [ ] Track: revenue uplift, booking rate impact

**Implementation:**
- [ ] Add price_suggested field to property
- [ ] Create pricing recommendation API: `GET /api/listings/{id}/price-suggestion/`
- [ ] Allow sellers to accept/reject suggestions
- [ ] Dashboard: pricing analytics

**Success Criteria:**
- Dynamic pricing sellers earn 10%+ more
- Booking rate impact: < -5% (acceptable trade-off)
- Adoption: 50%+ of sellers use dynamic pricing

**Resources:**
- 1 revenue engineer, 1 data scientist
- Historical pricing data

---

### Phase 3 Deliverables

| Deliverable | Owner | Status |
|-------------|-------|--------|
| ML recommendation engine | ML | Week 8 |
| Malta localization + seller onboarding | Expansion | Week 12 |
| Mobile app MVP (iOS + Android) | Mobile | Week 16 |
| Dynamic pricing algorithm | Revenue | Week 14 |
| Agent #3: General Services | Agent | Week 16 |

### Phase 3 Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Active users | 5,000+ | Product |
| Active sellers | 500+ | Product |
| GMV | £500k+ | Finance |
| Recommendation CTR | ≥ 2% | ML |
| Mobile app users | 20% of MAU | Mobile |
| Dynamic pricing adoption | 50% of sellers | Revenue |
| Mali GMV contribution | 10% of total | Expansion |

---

## Phase 4: Platform & Ecosystem (18 Months - Q3-Q4 2026)

### Goal
**Establish Easy Islanders as the marketplace platform for island communities. Enable white-label deployments. Achieve profitability.**

### Objectives

#### 4.1 White-Label Platform
- [ ] Create tenant isolation in app
- [ ] Build admin portal for community operators
- [ ] Customize branding, colors, languages per tenant
- [ ] Separate databases per tenant (or row-level security)
- [ ] Pricing: £500-2000/month per tenant

#### 4.2 Advanced Analytics & BI
- [ ] Create BI dashboard for operators (marketplace health)
- [ ] Export functionality: seller data, transaction data
- [ ] Fraud detection: unusual booking patterns
- [ ] Demand forecasting: predict bookings by season/location

#### 4.3 Fintech Integration
- [ ] Escrow for high-value bookings
- [ ] Insurance options for short-term rentals
- [ ] Refund insurance for sellers
- [ ] Multi-currency support (EUR, GBP, TRY, etc.)

#### 4.4 Community Features
- [ ] Discussion forums: local Q&A
- [ ] Guides: neighborhood reviews, travel tips
- [ ] Events: book event spaces, catering
- [ ] Referral program: reward users for invites

---

## Cross-Cutting Themes

### Data & Analytics
**Owner:** Data Lead

**Milestones:**
- Phase 1: Basic metrics dashboards, event logging
- Phase 2: Seller analytics dashboard, cohort analysis
- Phase 3: ML recommendation engine, churn prediction
- Phase 4: BI platform, marketplace health indicators

**Tools:** Prometheus, Grafana, dbt, Tableau (future)

---

### Security & Compliance
**Owner:** Security Lead

**Milestones:**
- Phase 1: Security audit, HTTPS-only, CORS policy
- Phase 2: PCI DSS compliance (payment processing), GDPR data export
- Phase 3: SOC 2 Type II audit, encryption at rest
- Phase 4: Penetration testing annually, insurance policy

**Compliance:** GDPR (EU users), local data protection laws, financial regulations

---

### Quality & Reliability
**Owner:** QA Lead

**Milestones:**
- Phase 1: Unit + integration tests, 99.5% uptime SLA
- Phase 2: E2E tests with Playwright, 99.9% uptime SLA
- Phase 3: Load testing (10k concurrent users), chaos engineering
- Phase 4: Disaster recovery drills, multi-region failover

**Testing:** pytest (backend), Jest (frontend), Playwright (E2E)

---

### Documentation & Knowledge
**Owner:** Technical Lead

**Milestones:**
- Phase 1: API documentation (OpenAPI/Swagger), deployment runbook
- Phase 2: Seller onboarding guide, admin documentation
- Phase 3: Architecture decision records (ADRs), runbook automation
- Phase 4: Internal wiki, best practices guide

---

## Quarterly Execution Plan

### Q4 2025 (Phase 1: Stabilization)
**Focus:** Production deployment, WebSocket stability, RE Agent completion

| Week | Milestone | Owner |
|------|-----------|-------|
| W48-49 | WebSocket soak test, RE Agent contracts | Backend, Agent |
| W50-51 | Database setup, security audit | DevOps, Security |
| W52 | User onboarding, first 100 testers | Product |

**Key Decision:** Go/no-go for production deployment (W52)

---

### Q1 2026 (Phase 2: Monetization)
**Focus:** Payment processing, seller tools, SMS/email, vehicle agent

| Week | Milestone | Owner |
|------|-----------|-------|
| W1-2 | Stripe integration + testing | Payments |
| W3-4 | SMS/email templates, notifications | Communications |
| W5-8 | Seller analytics dashboard | Analytics |
| W9-12 | Vehicle Agent (specs, implementation, testing) | Agent |

**Key Decision:** Payment processing go-live (W2), Vehicle Agent launch (W12)

---

### Q2 2026 (Phase 3: Scale & Personalization)
**Focus:** Recommendations, mobile app, Malta expansion, dynamic pricing

| Week | Milestone | Owner |
|------|-----------|-------|
| W13-16 | ML recommendation engine | ML |
| W17-20 | Mobile app (React Native) | Mobile |
| W21-24 | Malta expansion, localization | Expansion |

**Key Decision:** Mobile app store launch (W20), Malta go-live (W24)

---

### Q3-Q4 2026 (Phase 4: Platform)
**Focus:** White-label, fintech, community features, profitability

| Week | Milestone | Owner |
|------|-----------|-------|
| W25-32 | White-label architecture | Platform |
| W33-40 | Fintech integrations | Finance |
| W41-48 | Community features (forums, guides) | Product |

---

## Success Metrics Overview

### Phase 1 Metrics (By end Q4 2025)
- Production uptime: 99.5%+
- Test user count: 100+
- Router accuracy: 92%+
- Booking success rate: ≥ 90%

### Phase 2 Metrics (By end Q1 2026)
- Active users: 1,000+
- Active sellers: 100+
- GMV: £50k+
- Payment success rate: 95%+
- SMS delivery rate: 98%+

### Phase 3 Metrics (By end Q2 2026)
- Active users: 5,000+
- Active sellers: 500+
- GMV: £500k+
- Mobile app users: 20% of MAU
- Recommendation CTR: ≥ 2%
- Malta GMV: 10% of total

### Phase 4 Metrics (By end Q4 2026)
- Active users: 15,000+
- Active sellers: 1,500+
- GMV: £2M+
- White-label tenants: 2-3
- Mobile app rating: 4.5+ stars
- Profitability: EBITDA positive

---

## Dependencies & Assumptions

### Key Dependencies
- OpenAI API availability (intent classification, response generation)
- PostgreSQL + pgvector infrastructure
- Stripe API for payments
- Twilio API for SMS
- Cloud infrastructure (Railway, Fly.io, or AWS)

### Key Assumptions
- User demand exists in Cyprus/Malta for conversational marketplace
- Sellers willing to adopt new platform (10%+ market penetration realistic)
- Payment processing integration is straightforward (Stripe is mature)
- Mobile app provides meaningful engagement uplift (20%+ adoption)
- ML recommendations improve conversion by 10%+

### External Risks
- OpenAI API pricing increase or service disruption
- Competitive entry (e.g., OLX launches AI chat)
- Regulatory changes (EU AI Act, local payment regulations)
- Economic downturn reducing travel/rental demand

---

## Investment Required

### Phase 1 (Q4 2025): €60k
- 4 engineers × €3k/month × 1 month = €12k
- Infrastructure (staging, production): €3k
- Tools/services: €1k
- Contingency: €2k

**Total Phase 1:** €60k

### Phase 2 (Q1 2026): €120k
- 6 engineers × €3k/month × 1 month = €18k
- Stripe setup + payment processing: €2k
- SMS/email service costs: €2k
- Cloud infrastructure: €4k
- Marketing/user acquisition: €20k
- Contingency: €4k

**Total Phase 2:** €120k

### Phase 3 (Q2 2026): €150k
- 8 engineers, 1 designer: €24k
- Cloud infrastructure (scale): €6k
- Mobile app distribution: €2k
- Marketing (Malta launch): €30k
- Contingency: €8k

**Total Phase 3:** €150k

### Phase 4 (Q3-Q4 2026): €200k
- Platform + compliance: €50k
- Fintech integrations: €20k
- Community building: €30k
- Marketing/expansion: €50k
- Contingency: €20k

**Total Phase 4:** €200k

**Total 18-Month Investment:** €530k

---

## Decision Gates

### End of Phase 1 (W52 2025)
**Decision:** Proceed to Phase 2 (Monetization) if:
- [ ] Production uptime ≥ 99.5% for 2 weeks
- [ ] 100+ users active
- [ ] Zero critical security issues
- [ ] Seller onboarding successful (10+ sellers signed up)

**If blocked:** Debug, extend Phase 1 by 2 weeks

---

### End of Phase 2 (W12 2026)
**Decision:** Proceed to Phase 3 (Scale) if:
- [ ] 1,000+ active users
- [ ] Payment processing working reliably (95%+ success rate)
- [ ] £50k+ GMV achieved
- [ ] Vehicle Agent integrated and tested
- [ ] Seller NPS ≥ 50

**If blocked:** Focus on user retention and seller support before expansion

---

### End of Phase 3 (W24 2026)
**Decision:** Proceed to Phase 4 (Platform) if:
- [ ] 5,000+ active users
- [ ] £500k+ GMV
- [ ] Mobile app adopted by 20%+ of users
- [ ] Malta expansion successful (100+ sellers)
- [ ] Profitability path clear (unit economics positive)

**If blocked:** Consolidate existing markets before new initiatives

---

## Quarterly Review Cadence

**Monthly Reviews (Last Friday of month):**
- Metrics dashboard review (users, GMV, uptime)
- Issue triage: blockers, escalations
- Team velocity: sprints completed, bugs fixed

**Quarterly Reviews (End of quarter):**
- Phase progress: on track, at risk, off track
- Decision gate evaluation: proceed, pause, pivot
- Budget review: actual vs. planned spend
- Roadmap adjustment: new learnings, market changes

---

## Conclusion

Easy Islanders is positioned to become the conversational AI marketplace for island communities. This 18-month roadmap focuses on:

1. **Phase 1 (Q4 2025):** Production readiness and user validation
2. **Phase 2 (Q1 2026):** Monetization and first 1,000 users
3. **Phase 3 (Q2 2026):** Scale to 5,000 users and geographic expansion
4. **Phase 4 (Q3-Q4 2026):** Platform and profitability

**Success requires:**
- Disciplined execution on core features (no scope creep)
- User-centric decision making (metrics over opinions)
- Technical excellence (99.5%+ uptime is non-negotiable)
- Community focus (sellers are the business, not just users)

**Target outcomes:**
- 15,000+ active users by end 2026
- 1,500+ active sellers
- £2M+ GMV
- Profitable unit economics
- Repeatable playbook for white-label expansion

---

**Document prepared by:** Product & Engineering Leadership  
**Approval date:** To be signed off by Executive Team  
**Next review:** Q4 2025 decision gate
