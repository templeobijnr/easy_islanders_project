# Easy Islanders - Dashboard Documentation

## Overview
This document explains the Grafana dashboards, panel configurations, and key PromQL queries used for monitoring the Easy Islanders observability stack.

## Dashboard Structure

### Main Dashboard: "Easy Islanders - Production Monitoring"
- **ID**: 1
- **Title**: Easy Islanders - Production Monitoring
- **Tags**: easy-islanders, production, monitoring
- **Style**: Dark
- **Timezone**: Browser

## Panel Descriptions

### 1. Request Rate (RPS)
- **Panel ID**: 1
- **Type**: Stat
- **Position**: Top-left (h:8, w:12, x:0, y:0)
- **Query**: `sum(rate(http_requests_total[5m]))`
- **Unit**: reqps
- **Description**: Shows requests per second across all services
- **Alert Threshold**: >100 RPS (investigate load)

### 2. Error Rate
- **Panel ID**: 2
- **Type**: Stat
- **Position**: Top-center (h:8, w:12, x:12, y:0)
- **Query**: `sum(rate(error_rate_total[5m]))`
- **Unit**: reqps
- **Description**: Shows error rate per second
- **Alert Threshold**: >1 error/sec (warning), >5 errors/sec (critical)

### 3. P95 Latency
- **Panel ID**: 3
- **Type**: Stat
- **Position**: Top-right (h:8, w:12, x:24, y:0)
- **Query**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- **Unit**: s
- **Description**: 95th percentile latency across all requests
- **Alert Threshold**: >0.6s (warning), >1.0s (critical)

### 4. Cache Hit Rate
- **Panel ID**: 4
- **Type**: Stat
- **Position**: Second row-left (h:8, w:12, x:0, y:8)
- **Query**: `cache_hit_rate * 100`
- **Unit**: percent
- **Description**: Percentage of cache hits
- **Alert Threshold**: <80% (investigate cache performance)

### 5. LLM Token Usage
- **Panel ID**: 5
- **Type**: Stat
- **Position**: Second row-center (h:8, w:12, x:12, y:8)
- **Query**: `sum(rate(llm_tokens_total[5m]))`
- **Unit**: tokens/sec
- **Description**: LLM token consumption rate
- **Alert Threshold**: >1000 tokens/sec (investigate usage)

### 6. Memory Usage
- **Panel ID**: 6
- **Type**: Stat
- **Position**: Second row-right (h:8, w:12, x:24, y:8)
- **Query**: `process_resident_memory_bytes / 1024 / 1024`
- **Unit**: MB
- **Description**: Resident memory usage
- **Alert Threshold**: >1.5GB (warning), >2GB (critical)

## Time Series Panels

### 7. HTTP Request Rate Over Time
- **Panel ID**: 7
- **Type**: Timeseries
- **Position**: Third row-left (h:9, w:12, x:0, y:16)
- **Query**: `sum by (method, endpoint, status_code) (rate(http_requests_total[$__rate_interval]))`
- **Description**: Request rate breakdown by method, endpoint, and status code
- **Legend**: `{{method}} {{endpoint}} ({{status_code}})`

### 8. HTTP Request Duration P95
- **Panel ID**: 8
- **Type**: Timeseries
- **Position**: Third row-right (h:9, w:12, x:12, y:16)
- **Query**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[$__rate_interval])) by (le, method, endpoint))`
- **Description**: P95 latency by method and endpoint
- **Legend**: `{{method}} {{endpoint}} P95`

### 9. Error Rate by Service and Type
- **Panel ID**: 9
- **Type**: Timeseries
- **Position**: Fourth row-left (h:9, w:12, x:0, y:25)
- **Query**: `sum by (service, error_type) (rate(error_rate_total[$__rate_interval]))`
- **Description**: Error rate breakdown by service and error type
- **Legend**: `{{service}} {{error_type}}`

### 10. LLM Cost Over Time
- **Panel ID**: 10
- **Type**: Timeseries
- **Position**: Fourth row-right (h:9, w:12, x:12, y:25)
- **Query**: `sum by (provider, model_family) (rate(llm_cost_total[$__rate_interval]))`
- **Description**: LLM costs by provider and model
- **Legend**: `{{provider}} {{model_family}}`

## Key PromQL Queries

### Performance Queries
```promql
# Overall request rate
sum(rate(http_requests_total[5m]))

# P95 latency across all services
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Error rate percentage
sum(rate(error_rate_total[5m])) / sum(rate(http_requests_total[5m])) * 100

# Registry service specific metrics
rate(registry_terms_search_latency_seconds_count[5m])
histogram_quantile(0.95, rate(registry_terms_search_latency_seconds_bucket[5m]))
```

### Health Queries
```promql
# Service availability
up{job="registry-service"}
up{job="django-service"}

# Memory usage
process_resident_memory_bytes / 1024 / 1024

# Cache performance
cache_hit_rate * 100
```

### Cost Queries
```promql
# LLM cost per hour
rate(llm_cost_total[1h])

# Token usage rate
rate(llm_tokens_total[5m])

# Cost by provider
sum by (provider) (rate(llm_cost_total[5m]))
```

### Error Analysis Queries
```promql
# Error rate by service
sum by (service) (rate(error_rate_total[5m]))

# Error rate by type
sum by (error_type) (rate(error_rate_total[5m]))

# Fallback usage
rate(registry_text_fallback_total[5m])
```

## Dashboard Variables

### Time Range
- **Variable**: `$__timeFilter()`
- **Description**: Current dashboard time range
- **Usage**: `http_requests_total{$__timeFilter()}`

### Service Selection
- **Variable**: `service`
- **Type**: Multi-value
- **Options**: registry-service, django-service
- **Usage**: `up{job=~"$service"}`

### Environment
- **Variable**: `environment`
- **Type**: Single value
- **Options**: staging, production
- **Usage**: `http_requests_total{environment="$environment"}`

## Alert Integration

### Panel Alerts
Each panel can be configured with alerts:
- **Request Rate**: Alert if >100 RPS
- **Error Rate**: Alert if >1 error/sec
- **P95 Latency**: Alert if >600ms
- **Memory Usage**: Alert if >1.5GB
- **Cache Hit Rate**: Alert if <80%

### Alert Rules
```yaml
# High latency alert
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.6
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High latency detected"
    description: "P95 latency is {{ $value }}s"

# High error rate alert
- alert: HighErrorRate
  expr: sum(rate(error_rate_total[5m])) > 1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors/sec"
```

## Dashboard Usage

### Daily Monitoring
1. **Check overall health**: Look at top row stats
2. **Review trends**: Check time series panels
3. **Investigate anomalies**: Drill down into specific metrics
4. **Verify alerts**: Check alert status

### Troubleshooting
1. **Identify issue**: Use error rate and latency panels
2. **Correlate events**: Check time series for patterns
3. **Drill down**: Use service-specific queries
4. **Monitor resolution**: Watch metrics improve

### Performance Analysis
1. **Baseline establishment**: Record normal metrics
2. **Trend analysis**: Monitor changes over time
3. **Capacity planning**: Use growth trends
4. **Optimization**: Identify bottlenecks

## Dashboard Maintenance

### Weekly Tasks
- Review panel performance
- Update alert thresholds
- Check data retention
- Validate queries

### Monthly Tasks
- Review dashboard design
- Update documentation
- Add new panels as needed
- Remove obsolete panels

### Quarterly Tasks
- Complete dashboard audit
- Update PromQL queries
- Review alert rules
- Plan dashboard improvements
