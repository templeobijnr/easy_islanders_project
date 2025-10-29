# Sprint 6 - Validation and Debugging Plan

**Purpose**: Confirm router-ops v1.5 is stable, calibrated, alerting correctly, and rollback-safe.

## A. Functional Verification

### 1. Configuration & Flags

**Goal**: Ensure all new settings load and propagate.

**Test**:
```bash
python3 manage.py shell -c "
from django.conf import settings;
print(settings.ROUTER_FUSION_WEIGHTS, settings.ROUTER_TAU_DEFAULT,
      settings.ROUTER_DELTA_TOP2, settings.ROUTER_CALIBRATION_VERSION)"
```

**Expected**: Values match constants; no ImproperlyConfigured errors.

**If missing** → check `easy_islanders/settings/base.py` and `.env`.

### 2. Guardrail Threshold Override

**Goal**: Per-domain τ YAML overrides work.

**Test**:
```python
from assistant.brain.config import load_router_thresholds
print(load_router_thresholds('config/router_thresholds.yaml'))
```

**Expected**: Dict of domains with floats.

Then call `/api/route` for a domain with τ override and inspect `decision['clarify']` threshold shift.

### 3. Router Fusion Path

**Goal**: Embed + clf + rule weights applied.

**Test**:
- Temporarily log inside `node_domain_router`:

```python
logger.info(f"fusion=({embed_score:.3f},{clf_prob:.3f},{rule_vote:.3f}) -> {score:.3f}")
```

- Run 3 distinct utterances.
- Verify scores and calibrated probabilities vary by weight ratios.

### 4. Fallback Policy

**Goal**: Clarify on missing/stale calibration or low confidence.

**Test sequence**:
1. Drop CalibrationParams table row → rerun `/api/route`.
2. Verify `"policy_action": "clarify"`.
3. Reinsert row → rerun → normal dispatch resumes.

### 5. A/B Harness

**Goal**: Deterministic arm assignment.

**Test**:
```python
from assistant.brain.ab import assign_arm
assert assign_arm('thread_123') == assign_arm('thread_123')
```

Then enable `ROUTER_ENABLE_AB=True`, hit `/api/route` twice; confirm logged `router_arm`.

## B. Data Pipeline

### 6. Router Events Logging

After routing 3 utterances:
```sql
select domain, policy_action, correct_label, split from router_events order by created_at desc limit 3;
```

**Expected**: New rows with `split='train'`.

**If none** → confirm signal in `/api/route` writes events.

### 7. Backfill Script

```bash
python3 scripts/backfill_router_events.py --domain real_estate --sample 1000
```

Verify 1000 rows inserted, PII fields absent.

**If IntegrityError**: Check column defaults and ENUM type.

### 8. Split Assignment

```bash
python3 manage.py assign_router_splits
```

```sql
select split, count(*) from router_events group by split;
```

**Expected**: 70/20/10 distribution.

## C. Calibration Pipeline

### 9. Manual Training

```bash
python3 manage.py update_calibration_params --force
```

**Expected logs**:
```
Train: 0.92 accuracy, ECE=0.04 ↓ baseline
CalibrationParams updated for 3 domains
```

**If "no data"** → confirm `router_events` populated.

### 10. Calibration Effect

Run `/api/route` before and after training; compare confidence vs calibrated values.

**Expected**: Calibrated ≈ observed accuracy range.

## D. Metrics & Alerts

### 11. Prometheus Metrics

```bash
curl -s localhost:8000/api/metrics | grep router_ece
```

Should show lines per domain.

**If missing** → ensure metrics registered in `assistant/monitoring/metrics.py`.

### 12. Grafana Dashboard

Open dashboard → verify:
- ECE ≤ 0.08
- p95 ≤ 120 ms
- fallback ≤ 12 %

**If panels empty** → check Prometheus scrape target name.

## E. CI/CD Validation

### 13. Workflow Run

Manually trigger GitHub Action `router_calibration.yml`.

Inspect artifacts: `calib.json`, `report.md`.

**Expected report summary**:
```
Accuracy: 0.93
ECE: 0.04
p95: 108ms
```

**If job fails** → open pipelines/eval.py logs.

## F. Regression Tests

### 14. Unit Tests

```bash
pytest -q tests/router/
```

**Expected all pass**:
- `test_guardrail.py`
- `test_calibration.py`
- `test_fallbacks.py`

**If failures** → inspect printed threshold or ECE values.

### 15. Eval Script

```bash
python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json
```

**Pass criteria**:
```
accuracy ≥ 0.92 ECE ≤ 0.05 p95 < 120 ms → exit 0
```

Else → non-zero exit triggers CI alert.

## G. Debugging Playbook

| Symptom | Diagnostic Command | Likely Cause | Fix |
|---------|-------------------|--------------|-----|
| `/api/route` latency > 120 ms | `curl -w "%{time_total}\n"` | Redis/DB latency | check Redis health |
| Always clarify | `select * from calibration_params;` | Missing ECE or stale params | retrain calibration |
| ECE > 0.1 alert | Grafana panel | poor training data | rerun calibration, verify features |
| RouterEvents empty | DB query | logging not connected | add create_event in `/api/route` |
| A/B arms skewed | SQL count per arm | bad hash seed | fix assign_arm() seed |
| Prometheus metrics missing | `/api/metrics` | metrics not registered | import module early |
| CI calibration job fails | Actions logs | path or missing deps | install scikit-learn, pyyaml |

## Pass Criteria for Sprint 6

1. `eval_router.py` passes gates.
2. Prometheus reports ECE ≤ 0.08.
3. Alerts and dashboard active.
4. Weekly calibration job runs and artifact stored.
5. Fallback and clarify policies function as designed.
6. A/B harness deterministic, off by default.

**Once all tests green and alerts visible, router-ops v1.5 is confirmed operational and production-ready.**