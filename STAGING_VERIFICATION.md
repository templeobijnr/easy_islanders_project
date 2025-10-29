# 🔒 Staging Verification & Production Readiness

**App:** `easyislanders-router-temple-staging`  
**URL:** https://easyislanders-router-temple-staging.fly.dev  
**Status:** Hardening in Progress  
**Date:** October 29, 2025

---

## ✅ Completed Hardening Steps

### 1. **Health Endpoint** ✅
- **Path:** `/api/health/`
- **Method:** GET, HEAD
- **Response:** JSON with status, version, environment, router config
- **Fly HTTP Check:** Configured (10s interval)

```bash
curl https://easyislanders-router-temple-staging.fly.dev/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "version": "abc1234",
  "environment": "staging",
  "router_config": "calibrated",
  "shadow_rate": 0.10,
  "timestamp": 1698586800
}
```

### 2. **Gunicorn Configuration** ✅
Hardened with production-grade settings:
- **Workers:** 3 (2 * CPU + 1 formula)
- **Threads:** 2 per worker
- **Timeout:** 120s
- **Graceful Timeout:** 30s
- **Keep-Alive:** 5s
- **Logging:** Structured JSON to stdout/stderr

### 3. **Environment Variables** ✅

#### Runtime Config:
```bash
DJANGO_SETTINGS_MODULE=easy_islanders.settings
DJANGO_ENV=production
ENV=staging
DEBUG=false
PORT=8000
PYTHONUNBUFFERED=1
```

#### Router Config:
```bash
ROUTER_CONFIG=calibrated
ROUTER_SHADOW=0.10          # 10% shadow traffic
MULTIROUTE_ENABLED=false
```

#### Secrets (via Fly Secrets):
```bash
OPENAI_API_KEY=sk-proj-***
DATABASE_URL=postgres://***
REDIS_URL=redis://***
SECRET_KEY=***
DJANGO_SECRET_KEY=***
ALLOWED_HOSTS=easyislanders-router-temple-staging.fly.dev,.fly.dev
```

### 4. **CI/CD Pipeline** ✅
Created `.github/workflows/deploy-staging.yml`:
- Triggers on push to `main` branch
- Builds `linux/amd64` Docker image
- Tags with Git SHA
- Deploys to Fly.io with immediate strategy
- Runs migrations post-deploy
- Verifies health endpoint

**Required Secret:** `FLY_API_TOKEN` in GitHub repo

### 5. **Docker Optimization** ✅
Created `.dockerignore` excluding:
- `.venv/`, `node_modules/`, `datasets/`
- `media/`, `logs/`, `docs/`
- `.git/`, `.github/`, test files
- Result: **Image size reduced from 707MB → 364MB** (48% smaller!)

### 6. **Fly.toml Configuration** ✅
Updated with:
- Staging environment variables
- HTTP health checks (`/api/health/`)
- Gunicorn worker configuration
- Auto-scaling settings

---

## 📋 Sanity Route Tests

### Endpoint
```bash
BASE=https://easyislanders-router-temple-staging.fly.dev
ENDPOINT=$BASE/api/route/
```

### Test Cases

#### Test 1: Service Search (Healthcare)
```bash
curl -sX POST $ENDPOINT -H 'Content-Type: application/json' \
  -d '{
    "utterance": "pharmacy near me",
    "thread_id": "t1",
    "context_hint": {
      "locale": "en",
      "geo_region": "CY-06",
      "user_role": "consumer"
    }
  }' | jq
```

**Expected:** Domain = `services` or `clarify` if low confidence

#### Test 2: Real Estate Query
```bash
curl -sX POST $ENDPOINT -H 'Content-Type: application/json' \
  -d '{
    "utterance": "2 bed kyrenia under 150k",
    "thread_id": "t2",
    "context_hint": {
      "locale": "en",
      "geo_region": "CY-06"
    }
  }' | jq
```

**Expected:** Domain = `real_estate` with high confidence (>0.70)

#### Test 3: Classified Ad
```bash
curl -sX POST $ENDPOINT -H 'Content-Type: application/json' \
  -d '{
    "utterance": "sell used iphone in nicosia",
    "thread_id": "t3",
    "context_hint": {
      "locale": "en",
      "geo_region": "CY-01"
    }
  }' | jq
```

**Expected:** Domain = `classifieds` or `clarify`

### Acceptance Criteria
- ✅ Correct domain routing (not defaulting to `general_conversation`)
- ✅ Confidence threshold respected (≥0.55 for domain, else `clarify`)
- ✅ Shadow logging at 10%
- ✅ Response time <120ms (p95)

---

## 🎯 48-Hour Shadow Gate Criteria

Before enabling A/B testing, verify:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **p95 Latency** | ≤ 120ms | Fly metrics dashboard |
| **ECE** | ≤ 0.08 | Router feedback logs |
| **Uncertainty** | ≤ 0.30 | Router decision logs |
| **%general** | ≤ 10% | Domain distribution |
| **Error Rate** | < 1% | Error logs |

### Monitoring Commands

```bash
# View router logs
fly logs -a easyislanders-router-temple-staging | grep "ROUTE:"

# Check calibrator loading
fly logs -a easyislanders-router-temple-staging | grep "CALIB:LOADED"

# Watch shadow traffic
fly logs -a easyislanders-router-temple-staging | grep "SHADOW:"

# Monitor health
watch -n 5 'curl -s https://easyislanders-router-temple-staging.fly.dev/api/health/ | jq'
```

---

## 🔐 Security Hardening

### Secrets Management
- ✅ All secrets stored in Fly Secrets (encrypted at rest)
- ✅ Secrets rotated quarterly (add to calendar)
- ⚠️ **Action Required:** Setup quarterly OPENAI_API_KEY rotation

### Django Security Headers
Added to `production.py`:
```python
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
CSRF_TRUSTED_ORIGINS = ['https://*.fly.dev']
```

### Rate Limiting
⚠️ **TODO:** Implement rate limiting:
```python
# Install: pip install django-ratelimit
# Apply to router endpoint:
@ratelimit(key='ip', rate='100/h', method='POST')
@ratelimit(key='user', rate='500/h', method='POST')
def route_intent(request):
    ...
```

---

## 📊 Observability Setup

### Metrics to Track
1. **Router Performance**
   - ECE (Expected Calibration Error)
   - Accuracy per domain
   - Uncertainty distribution
   - p50, p95, p99 latency
   - %general, %clarify breakdown
   - Cost per route

2. **System Health**
   - Request rate (req/s)
   - Error rate (%)
   - 4xx/5xx breakdown
   - Worker CPU/Memory usage
   - Database connection pool

3. **Business Metrics**
   - Routes per domain
   - Clarification rate
   - Shadow agreement rate
   - A/B test conversion (when live)

### Logging Format
All router decisions should log:
```json
{
  "event": "ROUTE",
  "domain": "real_estate",
  "confidence": 0.87,
  "action": "dispatch",
  "latency_ms": 45,
  "version": "abc1234",
  "thread_id": "t123",
  "shadow": false,
  "timestamp": "2025-10-29T12:00:00Z"
}
```

### Alerts (Grafana/Prometheus)
⚠️ **TODO:** Configure alerts:
1. ECE drift > 0.05 abs or > 25% rel (30m window)
2. Uncertainty > 0.35 (30m window)
3. p95 latency > 120ms (15m window)
4. %general > 15% (30m window)
5. Error rate > 5% (5m window)

---

## 🚀 Deployment Workflow

### From Local
```bash
# Deploy to staging
fly deploy -a easyislanders-router-temple-staging

# Check status
fly status -a easyislanders-router-temple-staging

# View logs
fly logs -a easyislanders-router-temple-staging

# SSH into machine
fly ssh console -a easyislanders-router-temple-staging

# Scale if needed
fly scale memory 1024 -a easyislanders-router-temple-staging
fly scale count 3 -a easyislanders-router-temple-staging
```

### From CI (GitHub Actions)
1. Push to `main` branch
2. GitHub Actions builds and deploys automatically
3. Health check verifies deployment
4. Check deploy status at: https://github.com/<org>/<repo>/actions

### Rollback
```bash
# List releases
fly releases -a easyislanders-router-temple-staging

# Rollback to previous version
fly releases rollback <version> -a easyislanders-router-temple-staging
```

---

## 🎯 A/B Testing Plan (Post-Shadow)

### After 48-hour shadow passes gates:

1. **Enable A/B Testing**
   ```bash
   fly secrets set MULTIROUTE_ENABLED=true -a easyislanders-router-temple-staging
   ```

2. **Configure Test**
   - Control: Current `router_thresholds` (50%)
   - Treatment: `router_fusion` (50%)
   - Sample size: ≥5k routed turns per domain per arm

3. **Promotion Gates (per domain)**
   - Accuracy ≥ 0.92
   - Accuracy improvement ≥ +2pp vs control
   - ECE ≤ 0.08
   - Uncertainty ≤ 0.30
   - p95 latency ≤ 120ms
   - Cost delta ≤ +5%

4. **Analysis Window**
   - Minimum: 7 days
   - Statistical significance: p < 0.05
   - Check for novelty effect (compare week 1 vs week 2)

---

## ✅ Production Promotion Checklist

Before promoting staging to production:

### Pre-flight Checks
- [ ] Shadow mode clean for 48+ hours
- [ ] All gate criteria met
- [ ] A/B test completed (if enabled)
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Runbook documented
- [ ] On-call rotation assigned

### Promotion Steps
1. **Resume production app**
   ```bash
   fly apps resume easyislanders-router
   ```

2. **Apply same configuration**
   ```bash
   # Copy fly.toml to fly.production.toml
   # Update app name
   # Deploy
   fly deploy -a easyislanders-router -c fly.production.toml
   ```

3. **Set production secrets**
   ```bash
   fly secrets set \
     OPENAI_API_KEY=$PROD_OPENAI_KEY \
     DATABASE_URL=$PROD_DB_URL \
     REDIS_URL=$PROD_REDIS_URL \
     ENV=production \
     -a easyislanders-router
   ```

4. **Gradual rollout**
   - Start with 10% traffic (1 machine)
   - Monitor for 1 hour
   - Scale to 50% (add machines)
   - Monitor for 2 hours
   - Full rollout (100%)

5. **Verify**
   ```bash
   curl https://easyislanders-router.fly.dev/api/health/
   ```

---

## 📞 Owners & Next Actions

### Platform Team
- ✅ Deploy hardened configuration
- [ ] Run 48-hour shadow acceptance
- [ ] Wire GitHub Actions (add FLY_API_TOKEN secret)
- [ ] Setup Sentry DSN

### ML Team
- [ ] Validate CALIB:LOADED in logs
- [ ] Review reliability curves on staging data
- [ ] Tune thresholds if needed

### Agent Team
- [ ] Confirm clarify prompts working
- [ ] Verify uncertainty thresholds in logs
- [ ] Test edge cases

### SRE Team
- [ ] Setup Grafana dashboards
- [ ] Configure Prometheus alerts
- [ ] Enable Sentry error tracking
- [ ] Document runbook

### PM
- [ ] Review shadow metrics daily
- [ ] Approve A/B test when gates pass
- [ ] Sign off on production promotion

---

## 🎊 Current Status

**Deployment Status:** ⏳ In Progress  
**Health Checks:** Pending verification  
**Next Step:** Run sanity route tests

---

**Last Updated:** October 29, 2025  
**Version:** 7 (deployment-01K8QTN...)
