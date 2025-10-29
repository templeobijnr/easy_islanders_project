# Router Operations Runbook

## Overview

The Easy Islanders router is a production-ready, self-evaluating routing layer that combines embedding similarity, rule-based classification, and supervised machine learning to route user utterances to appropriate domain agents.

## Architecture

### Core Components

- **Router Graph**: LangGraph-based state machine with safety filtering, domain routing, governance guardrails, and prompt assembly
- **Calibration System**: scikit-learn logistic regression with Platt scaling for probability calibration
- **Metrics & Monitoring**: Prometheus metrics with Grafana dashboards and alerting
- **A/B Testing**: Framework for testing different routing configurations in production

### Data Flow

```
User Utterance → Safety Filter → Domain Router → Governance Guardrail → In-Domain Classifier → Prompt Assembly
                      ↓              ↓              ↓                        ↓
                   Block        Fuse Scores    Enforce τ               Route to Agent
```

## Key Metrics

### Performance Metrics
- **Accuracy**: `rate(router_accuracy_total{correct="true"}[5m]) / rate(router_accuracy_total[5m])`
- **Latency P95**: `histogram_quantile(0.95, rate(router_latency_seconds_bucket[5m]))`
- **ECE (Expected Calibration Error)**: `router_calibration_ece`

### Health Metrics
- **Uncertain Ratio**: `router_uncertain_ratio` (should be < 0.3)
- **Request Rate**: `rate(router_requests_total[5m])`
- **Error Rate**: Standard Django error metrics

## Daily Operations

### Morning Checks

1. **Review Overnight Metrics**
   ```bash
   # Check Grafana dashboard for anomalies
   # Look for:
   # - Accuracy drops below 0.92
   # - Latency spikes above 120ms
   # - ECE increases above 0.05
   # - High uncertain ratio
   ```

2. **Check Calibration Freshness**
   ```bash
   # Verify calibration parameters are recent
   python manage.py update_calibration_params --evaluate-only
   ```

3. **Review Alert History**
   ```bash
   # Check Prometheus/Alertmanager for any router alerts
   ```

### Weekly Maintenance

1. **Retraining Calibration Models**
   ```bash
   # Run weekly calibration update
   python manage.py update_calibration_params
   ```

2. **Update Evaluation Corpus**
   ```bash
   # Add new test cases to router_eval_corpus.json
   # Run evaluation: python scripts/eval_router.py
   ```

3. **Review A/B Test Results**
   ```bash
   # Check performance of different routing configurations
   # Promote winning variants if statistically significant
   ```

## Incident Response

### High Latency (>120ms P95)

**Symptoms**: RouterLatency alert firing

**Investigation**:
1. Check system load: `uptime`, `top`
2. Review recent deployments
3. Check embedding service health
4. Examine calibration model size/complexity

**Mitigation**:
1. Scale router service horizontally
2. Temporarily reduce calibration model complexity
3. Roll back recent changes if deployment-related

### Low Accuracy (<0.92)

**Symptoms**: RouterAccuracy alert firing

**Investigation**:
1. Check calibration ECE - if >0.05, models need retraining
2. Review recent utterance patterns for domain shifts
3. Check for PII scrubbing issues in training data

**Mitigation**:
1. Immediate: Retrain calibration models
2. Short-term: Adjust confidence thresholds
3. Long-term: Update training data and evaluation corpus

### High Uncertainty Ratio (>0.3)

**Symptoms**: RouterUncertainRatio alert firing

**Investigation**:
1. Check if new utterance patterns are emerging
2. Verify calibration models are up-to-date
3. Review confidence threshold settings

**Mitigation**:
1. Lower confidence thresholds temporarily
2. Retrain models with recent data
3. Add clarification responses for edge cases

## Deployment Procedures

### Promoting Calibration Models

```bash
# Evaluate current shadow models
python manage.py update_calibration_params --evaluate-only

# If validation passes, promote to production
python manage.py update_calibration_params

# Verify metrics improve
# Check Grafana dashboard for 30 minutes
```

### Updating Router Configuration

```bash
# Modify settings/base.py or YAML configs
# Test locally: python scripts/eval_router.py
# Deploy with feature flags if needed
# Monitor metrics for 1 hour post-deployment
```

### A/B Testing New Features

```bash
# Define test variants in assistant/brain/ab.py
# Deploy with small user percentage (5-10%)
# Monitor metrics and user feedback
# Run statistical significance tests
# Promote winner or roll back
```

## Monitoring & Alerting

### Key Alerts

- **RouterHighLatency**: P95 latency > 120ms for 5+ minutes
- **RouterLowAccuracy**: Accuracy < 0.92 for 10+ minutes
- **RouterHighECE**: ECE > 0.05 for 15+ minutes
- **RouterHighUncertainRatio**: Uncertain ratio > 0.3 for 10+ minutes
- **RouterCalibrationStale**: Calibration params >7 days old

### Dashboard Panels

1. **Request Rate & Latency**: Track throughput and performance
2. **Accuracy Trends**: Monitor routing quality over time
3. **Calibration Health**: ECE and uncertainty metrics
4. **Domain Distribution**: Routing patterns by domain
5. **A/B Test Results**: Compare variant performance

## Troubleshooting

### Common Issues

**Calibration models not loading**
- Check database connectivity
- Verify CalibrationParams table exists and has data
- Clear Django cache: `python manage.py clear_cache`

**Metrics not appearing in Prometheus**
- Verify service discovery configuration
- Check `/api/metrics/` endpoint accessibility
- Restart Prometheus if configuration changed

**A/B tests not working**
- Verify user ID consistency
- Check variant weight configuration
- Ensure test is registered in `setup_default_ab_tests()`

**Router returning "clarify" too often**
- Check confidence threshold settings
- Verify calibration models are trained
- Review ECE metrics for model quality

### Debug Commands

```bash
# Test router directly
python -c "
from router_service.graph import run_router
result = run_router('test utterance', 'debug-user')
print(result)
"

# Check calibration status
python manage.py shell -c "
from router_service.calibration import get_calibration_metrics
print(get_calibration_metrics())
"

# Validate configuration
python manage.py check --settings=easy_islanders.settings.development
```

## Performance Optimization

### Latency Optimization

1. **Model Quantization**: Consider quantized calibration models for faster inference
2. **Caching**: Ensure centroid and calibration model caching is working
3. **Async Processing**: Move heavy computations to background tasks
4. **Horizontal Scaling**: Add more router service instances

### Accuracy Optimization

1. **Regular Retraining**: Keep calibration models fresh with recent data
2. **Feature Engineering**: Add more contextual features (time, user history)
3. **Ensemble Methods**: Combine multiple calibration approaches
4. **Domain-Specific Tuning**: Fine-tune thresholds per domain

## Security Considerations

- **PII Scrubbing**: All training data is automatically scrubbed of sensitive information
- **Model Poisoning**: Calibration models are trained only on validated router events
- **Access Control**: Management commands require appropriate Django permissions
- **Audit Logging**: All calibration updates and A/B test changes are logged

## Future Improvements

- **Multi-modal Routing**: Support for image/audio inputs
- **Contextual Routing**: Use conversation history for better decisions
- **Federated Learning**: Train models across multiple deployments
- **Auto-tuning**: Automatically adjust thresholds based on performance feedback