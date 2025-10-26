# Easy Islanders Observability Setup

This document provides a complete guide for setting up OpenTelemetry, Prometheus, Grafana, and Jaeger for the Easy Islanders project.

## 🎯 Overview

The observability stack provides:
- **Distributed Tracing**: OpenTelemetry with request_id correlation
- **Metrics Collection**: Prometheus with custom metrics
- **Visualization**: Grafana dashboards
- **Sampling Policies**: Environment-specific sampling rates
- **Error Tracking**: Comprehensive error monitoring

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install OpenTelemetry packages
pip install -r requirements-observability.txt

# Or install individually
pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
pip install opentelemetry-instrumentation-django opentelemetry-instrumentation-requests
pip install prometheus-client
```

### 2. Start Observability Stack

```bash
# Start all services (Jaeger, Prometheus, Grafana)
./setup_observability.sh

# Or manually
docker-compose -f docker-compose.observability.yml up -d
```

### 3. Configure Environment

```bash
# Set environment variables
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export ENABLE_OTEL_METRICS=true
export ENVIRONMENT=staging  # or 'production'

# Start Django with observability
python manage.py runserver
```

### 4. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686

## 📊 Metrics Dashboard

The Grafana dashboard includes:

### Key Metrics
- **Request Rate (RPS)**: HTTP requests per second
- **Error Rate**: Errors per second by service
- **Response Time P95**: 95th percentile latency
- **Cache Hit Rate**: Cache performance percentage

### Detailed Views
- **HTTP Request Duration**: P50, P95, P99 latencies
- **Agent Execution Duration**: AI agent performance
- **Registry Operations**: Service-specific metrics
- **Fallback Counts**: RAG and web fallback usage
- **LLM Token Usage**: Token consumption by type
- **Error Rate by Service**: Error breakdown

## 🔧 Configuration

### Environment Variables

```bash
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=easy-islanders
OTEL_SERVICE_VERSION=1.0.0
ENVIRONMENT=staging

# Sampling Configuration
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=1.0  # 1.0 for staging, 0.2 for production
OTEL_ERROR_SAMPLER_ARG=1.0   # Always sample errors

# Enable Features
ENABLE_OTEL_METRICS=true
```

### Sampling Policies

| Environment | Sampling Rate | Error Sampling | Notes |
|-------------|---------------|----------------|-------|
| **Staging** | 100% (1.0) | 100% (1.0) | Full visibility for debugging |
| **Production** | 20% (0.2) | 100% (1.0) | Cost-effective with error tracking |
| **Errors** | 100% (1.0) | 100% (1.0) | Always sample for debugging |

## 🏗️ Architecture

### Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Django App    │    │  Registry API   │    │   Frontend      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │OpenTelemetry│ │    │ │OpenTelemetry│ │    │ │   Browser   │ │
│ │Middleware   │ │    │ │Instrumentation│ │    │   Tracing    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐        ┌────────▼────────┐
            │   Jaeger       │        │   Prometheus    │
            │   (Traces)     │        │   (Metrics)     │
            └────────────────┘        └─────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                          ┌───────▼────────┐
                          │    Grafana     │
                          │ (Visualization)│
                          └────────────────┘
```

### Request Flow

1. **Request arrives** → OpenTelemetry middleware creates span
2. **Request ID generated** → Correlates across all services
3. **Agent execution** → Nested spans for each operation
4. **Metrics recorded** → Prometheus counters and histograms
5. **Spans exported** → Jaeger for trace visualization
6. **Metrics scraped** → Prometheus for metrics storage

## 🔍 Request ID Correlation

Every request gets a unique `request_id` that flows through:

```python
# Django middleware adds request_id to all requests
request.request_id = "req-12345-abc"

# OpenTelemetry spans include request_id
span.set_attribute("request_id", request.request_id)

# Agent operations inherit request_id
with create_agent_span("supervisor", "route", request.request_id) as span:
    # All nested operations use same request_id
    pass
```

## 📈 Custom Metrics

### HTTP Metrics
```python
record_http_metrics(
    method="GET",
    endpoint="/api/chat",
    status_code=200,
    duration=0.5,
    service="django"
)
```

### Agent Metrics
```python
record_agent_execution(
    agent_name="supervisor",
    operation="route",
    duration=1.2,
    success=True
)
```

### Registry Metrics
```python
record_registry_operation(
    operation="search",
    status="success",
    duration=0.1,
    market_id="CY-NC",
    language="en"
)
```

## 🐛 Debugging

### Check OpenTelemetry Status

```bash
# Run the test suite
python test_observability.py

# Check if spans are being created
curl -H "X-Request-ID: test-123" http://localhost:8000/api/chat
```

### View Traces in Jaeger

1. Go to http://localhost:16686
2. Select service: `easy-islanders`
3. Search for traces with request_id
4. Click on trace to see span details

### View Metrics in Prometheus

1. Go to http://localhost:9090
2. Query: `http_requests_total`
3. Query: `rate(http_request_duration_seconds_bucket[5m])`

### View Dashboard in Grafana

1. Go to http://localhost:3001
2. Login: admin/admin
3. Navigate to "Easy Islanders - Production Monitoring"

## 🚨 Troubleshooting

### Common Issues

1. **No traces in Jaeger**
   - Check `OTEL_EXPORTER_OTLP_ENDPOINT` is set
   - Verify Jaeger is running on port 4317
   - Check Django logs for OpenTelemetry errors

2. **No metrics in Prometheus**
   - Verify `/metrics` endpoint is accessible
   - Check Prometheus configuration
   - Ensure services are running

3. **Dashboard not loading**
   - Check Grafana datasource configuration
   - Verify Prometheus is accessible from Grafana
   - Check dashboard JSON syntax

### Logs

```bash
# Check Django logs
tail -f logs/django.log | grep -i otel

# Check Jaeger logs
docker logs easy-islanders-jaeger-1

# Check Prometheus logs
docker logs easy-islanders-prometheus-1
```

## 🔧 Advanced Configuration

### Custom Samplers

```python
from assistant.monitoring.otel_config import ErrorAwareSampler

# Custom sampler that always samples errors
sampler = ErrorAwareSampler(base_rate=0.2, error_rate=1.0)
```

### Custom Metrics

```python
from assistant.monitoring.metrics import record_custom_metric

# Add your own metrics
record_custom_metric("business_metric", value=42, labels={"type": "conversion"})
```

### Alerting Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: easy-islanders
    rules:
      - alert: HighErrorRate
        expr: rate(error_rate_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
```

## 📚 References

- [OpenTelemetry Python Documentation](https://opentelemetry.io/docs/instrumentation/python/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

## 🤝 Contributing

To add new metrics or modify the observability stack:

1. Update `assistant/monitoring/metrics.py` for new metrics
2. Update `grafana/dashboard.json` for new visualizations
3. Update `prometheus/prometheus.yml` for new scrape targets
4. Test with `python test_observability.py`
5. Update this documentation
