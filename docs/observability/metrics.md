# Easy Islanders - Observability Metrics

## Overview
This document defines all metrics exposed by the Easy Islanders observability stack, including units, meanings, and interpretation guidelines.

## Registry Service Metrics

### Search Performance
- **`registry_terms_search_latency_seconds`** (Histogram)
  - **Unit**: Seconds
  - **Description**: Latency distribution for `/v1/terms/search` requests
  - **Buckets**: 0.05s, 0.1s, 0.25s, 0.5s, 1.0s, 2.0s, +Inf
  - **SLO Target**: P95 ≤ 600ms
  - **Interpretation**: Higher values indicate slower database queries or network issues

- **`registry_terms_search_latency_seconds_count`** (Counter)
  - **Unit**: Count
  - **Description**: Total number of search requests processed
  - **Interpretation**: Should increment steadily during normal operation

- **`registry_terms_search_latency_seconds_sum`** (Counter)
  - **Unit**: Seconds
  - **Description**: Total time spent on search requests
  - **Calculation**: Average latency = sum / count

### Fallback Behavior
- **`registry_text_fallback_total`** (Counter)
  - **Unit**: Count
  - **Description**: Number of times text-based search fallback was used
  - **SLO Target**: <1% of total requests
  - **Interpretation**: High values indicate vector search failures

### Embedding Operations
- **`registry_embeddings_requests_total`** (Counter)
  - **Unit**: Count
  - **Description**: Total embedding generation requests
  - **Interpretation**: Tracks OpenAI API usage and costs

- **`registry_operations_total`** (Counter)
  - **Unit**: Count
  - **Description**: Total registry service operations
  - **Labels**: `operation_type`, `status`

- **`registry_operation_duration_seconds`** (Histogram)
  - **Unit**: Seconds
  - **Description**: Duration of registry operations
  - **Labels**: `operation_type`

## Django Service Metrics

### HTTP Request Metrics
- **`http_requests_total`** (Counter)
  - **Unit**: Count
  - **Description**: Total HTTP requests processed
  - **Labels**: `method`, `endpoint`, `status_code`, `service`

- **`http_request_duration_seconds`** (Histogram)
  - **Unit**: Seconds
  - **Description**: HTTP request duration distribution
  - **Labels**: `method`, `endpoint`, `service`
  - **SLO Target**: P95 ≤ 1.8s (no web), ≤ 4.0s (web fallback)

### Agent Execution Metrics
- **`agent_execution_duration_seconds`** (Histogram)
  - **Unit**: Seconds
  - **Description**: Agent execution time
  - **Labels**: `agent_type`, `success`

- **`agent_execution_total`** (Counter)
  - **Unit**: Count
  - **Description**: Total agent executions
  - **Labels**: `agent_type`, `success`

### Error Metrics
- **`error_rate_total`** (Counter)
  - **Unit**: Count
  - **Description**: Error occurrences by service and type
  - **Labels**: `service`, `error_type`, `severity`
  - **SLO Target**: <1% error rate

## LLM Metrics

### Request Metrics
- **`llm_requests_total`** (Counter)
  - **Unit**: Count
  - **Description**: Total LLM requests
  - **Labels**: `provider`, `model_family`, `agent`, `tool`, `success`, `language`, `market_id`

- **`llm_request_errors_total`** (Counter)
  - **Unit**: Count
  - **Description**: LLM request errors
  - **Labels**: `provider`, `model_family`, `agent`, `tool`, `error_type`

### Token Usage
- **`llm_tokens_total`** (Counter)
  - **Unit**: Tokens
  - **Description**: Total tokens consumed
  - **Labels**: `provider`, `model_family`, `token_type` (prompt/completion)

### Cost Metrics
- **`llm_cost_total`** (Counter)
  - **Unit**: USD
  - **Description**: Total LLM costs
  - **Labels**: `provider`, `model_family`

## Cache Metrics

### Cache Operations
- **`cache_operations_total`** (Counter)
  - **Unit**: Count
  - **Description**: Cache operations
  - **Labels**: `operation`, `cache_layer`, `hit`

- **`cache_hit_rate`** (Gauge)
  - **Unit**: Percentage
  - **Description**: Cache hit rate
  - **SLO Target**: >80% for frequently accessed data

## System Metrics

### Python Runtime
- **`python_gc_objects_collected_total`** (Counter)
  - **Unit**: Count
  - **Description**: Objects collected by garbage collector
  - **Labels**: `generation`

- **`python_gc_collections_total`** (Counter)
  - **Unit**: Count
  - **Description**: Number of garbage collections
  - **Labels**: `generation`

### Memory Usage
- **`process_resident_memory_bytes`** (Gauge)
  - **Unit**: Bytes
  - **Description**: Resident memory usage
  - **SLO Target**: ±10% of baseline

## Key PromQL Queries

### Performance Monitoring
```promql
# P95 latency for registry searches
histogram_quantile(0.95, rate(registry_terms_search_latency_seconds_bucket[5m]))

# Error rate calculation
rate(registry_text_fallback_total[5m]) / rate(registry_terms_search_latency_seconds_count[5m]) * 100

# Request rate
rate(registry_terms_search_latency_seconds_count[5m])
```

### Health Checks
```promql
# Service availability
up{job="registry-service"}
up{job="django-service"}

# Memory stability
process_resident_memory_bytes / 1024 / 1024  # MB
```

### Cost Monitoring
```promql
# LLM cost per hour
rate(llm_cost_total[1h])

# Token usage rate
rate(llm_tokens_total[5m])
```

## Alerting Thresholds

- **Critical**: P95 latency > 1.0s
- **Warning**: P95 latency > 600ms
- **Critical**: Error rate > 5%
- **Warning**: Error rate > 1%
- **Critical**: Memory usage > 2GB
- **Warning**: Memory usage > 1.5GB

## Data Retention

- **Raw metrics**: 15 days
- **Aggregated metrics**: 90 days
- **Alert history**: 30 days
