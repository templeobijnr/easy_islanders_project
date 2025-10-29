# Easy Islanders

🔗 [Router Demo Guide](#-router-demo-local-validation)

## 🚀 Router v1.5 (Sprint 5) - Classifier + Calibration + Governance Integration

The router now includes supervised classification, probability calibration, and governance checks for production-ready routing.

### New Features
- **Supervised Classification**: scikit-learn logistic regression classifier trained on router events
- **Probability Calibration**: Platt scaling ensures confidence scores reflect true accuracy
- **Governance Guardrail**: Automatic clarification for low-confidence predictions
- **Self-Evaluation**: Periodic retraining and calibration using recent routing data
- **Enhanced Metrics**: ECE (Expected Calibration Error), accuracy, and uncertainty tracking

### API Response Format
```json
{
  "domain_choice": {
    "domain": "real_estate",
    "confidence": 0.84,
    "calibrated": 0.81,
    "policy_action": "dispatch"
  }
}
```

### Metrics Available
- `router_confidence_histogram` - Confidence score distribution
- `router_calibration_ece` - Expected Calibration Error by domain
- `router_accuracy_total` - Prediction accuracy counters
- `router_uncertain_ratio` - Ratio of uncertain predictions

### Management Commands
```bash
# Update calibration parameters (run nightly)
python3 manage.py update_calibration_params

# Evaluate with new thresholds
python3 scripts/eval_router.py  # accuracy ≥ 0.92, ECE ≤ 0.05, p95 < 120ms
```

## 🧭 Router Demo (Local Validation)

This demo verifies that the intent router works end-to-end in a local dev setup.

### Prerequisites
- Postgres running locally with the `pgvector` extension created:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- Redis optional (set `USE_REDIS_CACHE=true` to enable caching).
- `.env` configured with `DEBUG=True`, `ENABLE_INTENT_PARSER=true`, and a valid `OPENAI_API_KEY` (optional; the router falls back to a hashing-based embedding).

### 1. Apply migrations
```bash
authenv && python3 manage.py migrate
```

### 2. Seed centroids (cached)
```bash
python3 scripts/update_centroids.py
```

### 3. Seed exemplars
```bash
python3 manage.py seed_intent_exemplars
```

### 4. Run the router evaluation
```bash
python3 scripts/eval_router.py --corpus scripts/router_eval_corpus.json
```
Expected: accuracy ≈ 1.00, p95 latency ≪ 120 ms.

### 5. Test the live router
Authenticate and test `/api/route`:
```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass"}' | \
  python -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -X POST http://127.0.0.1:8000/api/route/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"utterance":"2br apartment in kyrenia","thread_id":"'"$(uuidgen)"'"}'
```

### 6. View metrics
```bash
curl -sL http://127.0.0.1:8000/api/metrics/ | \
  grep -E "router_requests_total|router_uncertain_total|router_latency_seconds"
```

### 7. Inspect in Admin
Run server:
```bash
python3 manage.py runserver
```
Visit: http://127.0.0.1:8000/admin

Check entries under Router Service → Intent Exemplars / Domain Centroids / Router Events.

---

### Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| role "easy_user" does not exist | Postgres user missing | Create with `CREATE ROLE easy_user LOGIN PASSWORD 'easy_pass';` |
| permission denied to create extension "vector" | Missing superuser privilege | Run `CREATE EXTENSION vector;` as `postgres` |
| IndexError: list index out of range during eval | Missing corpus argument | Use `--corpus scripts/router_eval_corpus.json` |

---

Once this flow passes locally, CI will gate on the same script to ensure latency and accuracy thresholds stay green.

This makes the local validation loop explicit and repeatable.
