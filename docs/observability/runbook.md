# Easy Islanders - Observability Runbook

## Overview
This runbook provides step-by-step procedures for operating, troubleshooting, and maintaining the Easy Islanders observability stack.

## Service Management

### Starting Services

#### Registry Service
```bash
# Development
cd /Users/apple_trnc/Desktop/work/easy_islanders_project
export DATABASE_URL=postgresql://apple_trnc@localhost:5432/easy_islanders
export REGISTRY_API_KEY=dev-key
python3 -m uvicorn registry_service.main:app --host 0.0.0.0 --port 8081 --reload

# Production
export ENVIRONMENT=production
export ENABLE_OTEL_METRICS=true
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
export OTEL_TRACES_SAMPLER_ARG=0.2
export PROM_SCRAPE_ENABLED=true
python3 -m uvicorn registry_service.main:app --host 0.0.0.0 --port 8081
```

#### Django Service
```bash
# Development
cd /Users/apple_trnc/Desktop/work/easy_islanders_project
export ENVIRONMENT=staging
export ENABLE_OTEL_METRICS=true
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_TRACES_SAMPLER_ARG=1.0
python3 manage.py runserver 8000

# Production
export ENVIRONMENT=production
export OTEL_TRACES_SAMPLER_ARG=0.2
python3 manage.py runserver 8000
```

### Stopping Services
```bash
# Stop registry service
pkill -f "uvicorn registry_service.main:app"

# Stop Django service
pkill -f "python3 manage.py runserver"

# Stop all services
pkill -f "uvicorn\|manage.py"
```

### Restarting Services
```bash
# Restart registry service
pkill -f "uvicorn registry_service.main:app"
sleep 3
# Start registry service (see starting services)

# Restart Django service
pkill -f "python3 manage.py runserver"
sleep 3
# Start Django service (see starting services)
```

## Health Checks

### Service Health Verification
```bash
# Registry service health
curl -sf http://localhost:8081/v1/healthz
# Expected: {"ok":true}

# Django service health (if health endpoint exists)
curl -sf http://localhost:8000/api/health/
# Expected: HTTP 200

# Metrics endpoint
curl -sf http://localhost:8081/metrics | head -5
# Expected: Prometheus text format
```

### Database Connectivity
```bash
# Test database connection
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "SELECT 1;"
# Expected: 1

# Check registry service database
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "SELECT COUNT(*) FROM service_terms;"
# Expected: Count of terms
```

### Redis Connectivity
```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# Check Redis keys
redis-cli keys "*"
# Expected: List of keys or empty
```

## Monitoring and Metrics

### Viewing Metrics
```bash
# Registry service metrics
curl -sf http://localhost:8081/metrics

# Django service metrics (if enabled)
curl -sf http://localhost:8000/api/metrics/

# Specific metric queries
curl -sf http://localhost:8081/metrics | grep registry_terms_search_latency_seconds_count
curl -sf http://localhost:8081/metrics | grep registry_text_fallback_total
```

### Key Metrics to Monitor
```bash
# Request count
curl -sf http://localhost:8081/metrics | grep registry_terms_search_latency_seconds_count | grep -v "#"

# Error rate
curl -sf http://localhost:8081/metrics | grep registry_text_fallback_total | grep -v "#"

# Latency distribution
curl -sf http://localhost:8081/metrics | grep registry_terms_search_latency_seconds_bucket | grep -E "(le=\"0.5\"|le=\"1.0\"|le=\"\+Inf\")"

# Memory usage
curl -sf http://localhost:8081/metrics | grep python_gc_objects_collected_total | head -1
```

### Prometheus Queries
```promql
# P95 latency
histogram_quantile(0.95, rate(registry_terms_search_latency_seconds_bucket[5m]))

# Error rate
rate(registry_text_fallback_total[5m]) / rate(registry_terms_search_latency_seconds_count[5m]) * 100

# Request rate
rate(registry_terms_search_latency_seconds_count[5m])

# Memory usage
process_resident_memory_bytes / 1024 / 1024
```

## Tracing and Debugging

### Viewing Traces
```bash
# Generate test trace
curl -H "X-Request-ID: debug-trace-$(date +%s)" \
     -H "Authorization: Bearer dev-key" \
     http://localhost:8081/v1/terms/search \
     -X POST -H "Content-Type: application/json" \
     -d '{"text": "immigration office", "market_id": "CY-NC", "language": "en", "k": 1}'

# Check Jaeger UI (if available)
# http://localhost:16686
# Service: easy-islanders
# Look for trace with X-Request-ID
```

### Log Analysis
```bash
# Registry service logs
tail -f /var/log/registry-service.log

# Django service logs
tail -f /var/log/django-service.log

# System logs
tail -f /var/log/syslog | grep -E "(registry|django)"
```

### Debugging Slow Queries
```bash
# Test search performance
time curl -H "Authorization: Bearer dev-key" \
          http://localhost:8081/v1/terms/search \
          -X POST -H "Content-Type: application/json" \
          -d '{"text": "immigration office", "market_id": "CY-NC", "language": "en", "k": 1}'

# Check database query performance
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "
EXPLAIN ANALYZE 
SELECT * FROM service_terms 
WHERE market_id = 'CY-NC' 
AND language = 'en' 
AND (base_term ILIKE '%immigration%' OR localized_term ILIKE '%immigration%')
LIMIT 1;"
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check port availability
lsof -i :8081
lsof -i :8000

# Check environment variables
env | grep -E "(ENVIRONMENT|OTEL|PROM)"

# Check dependencies
pip list | grep -E "(uvicorn|fastapi|django)"

# Check logs
journalctl -u registry-service
journalctl -u django-service
```

#### High Latency
```bash
# Check system resources
top
htop
iostat -x 1

# Check database performance
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Check network connectivity
ping localhost
telnet localhost 8081
telnet localhost 8000
```

#### High Error Rate
```bash
# Check error logs
grep -i error /var/log/registry-service.log | tail -20
grep -i error /var/log/django-service.log | tail -20

# Check API limits
curl -H "Authorization: Bearer dev-key" \
     http://localhost:8081/v1/terms/search \
     -X POST -H "Content-Type: application/json" \
     -d '{"text": "", "market_id": "INVALID", "language": "xx", "k": -1}'

# Check database connectivity
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "SELECT 1;"
```

#### Memory Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check Python memory
curl -sf http://localhost:8081/metrics | grep python_gc_objects_collected_total

# Restart service if needed
pkill -f "uvicorn registry_service.main:app"
# Restart service
```

### Performance Optimization

#### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'service_terms';

-- Analyze tables
ANALYZE service_terms;
ANALYZE local_entities;
```

#### Cache Optimization
```bash
# Check Redis memory usage
redis-cli info memory

# Check cache hit rate
curl -sf http://localhost:8081/metrics | grep cache_hit_rate

# Clear cache if needed
redis-cli flushall
```

## Maintenance Procedures

### Daily Maintenance
```bash
# Check service health
./staging_soak_monitor.sh

# Check disk space
df -h

# Check log rotation
ls -la /var/log/ | grep -E "(registry|django)"

# Check metrics
curl -sf http://localhost:8081/metrics | grep registry_terms_search_latency_seconds_count
```

### Weekly Maintenance
```bash
# Update dependencies
pip list --outdated
pip install --upgrade package-name

# Check database maintenance
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "VACUUM ANALYZE;"

# Review alert rules
# Check Grafana dashboards
# Review log retention
```

### Monthly Maintenance
```bash
# Security updates
pip install --upgrade pip
pip install --upgrade -r requirements.txt

# Database maintenance
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "REINDEX DATABASE easy_islanders;"

# Review and update documentation
# Review alert thresholds
# Update runbook procedures
```

## Emergency Procedures

### Service Recovery
```bash
# Complete service restart
pkill -f "uvicorn\|manage.py"
sleep 5
# Start services (see starting services)

# Database recovery
sudo systemctl restart postgresql
psql postgresql://apple_trnc@localhost:5432/easy_islanders -c "SELECT 1;"

# Redis recovery
sudo systemctl restart redis
redis-cli ping
```

### Rollback Procedures
```bash
# Rollback to previous version
git checkout previous-stable-tag
pip install -r requirements.txt
# Restart services

# Database rollback
psql postgresql://apple_trnc@localhost:5432/easy_islanders -f backup.sql
```

### Contact Information
- **On-call Engineer**: Check PagerDuty
- **Team Lead**: Check Slack #alerts
- **Engineering Manager**: Check escalation procedures
- **Emergency**: Follow P0 escalation path
