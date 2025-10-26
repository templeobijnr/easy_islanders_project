# Easy Islanders - Production Environment Configuration

## Production Environment Variables

```bash
# Core Environment
ENVIRONMENT=production
ENABLE_OTEL_METRICS=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_TRACES_SAMPLER_ARG=0.2
PROM_SCRAPE_ENABLED=true

# Service Configuration
DATABASE_URL=postgresql://user:password@prod-db:5432/easy_islanders
REGISTRY_API_KEY=prod-secure-key-rotated-monthly
REDIS_URL=redis://prod-redis:6379/0

# Security
SECRET_KEY=production-secret-key-rotated-quarterly
ALLOWED_HOSTS=api.easyislanders.com,admin.easyislanders.com
CORS_ALLOWED_ORIGINS=https://easyislanders.com,https://www.easyislanders.com

# Monitoring
OTEL_SERVICE_NAME=easy-islanders-prod
OTEL_SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# Performance
WORKERS=4
MAX_CONNECTIONS=100
TIMEOUT=30
```

## Production Ingress Rules

### Nginx Configuration
```nginx
# Restrict /metrics to Prometheus IPs only
location /metrics {
    allow 10.0.0.0/8;      # Internal network
    allow 172.16.0.0/12;   # Docker networks
    allow 192.168.0.0/16;  # Private networks
    deny all;
    
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Main API endpoints
location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Registry service
location /v1/ {
    proxy_pass http://registry-backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Authorization $http_authorization;
}
```

### Kubernetes Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: easy-islanders-prod
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
spec:
  rules:
  - host: api.easyislanders.com
    http:
      paths:
      - path: /metrics
        pathType: Exact
        backend:
          service:
            name: prometheus-scraper
            port:
              number: 8080
      - path: /api/
        pathType: Prefix
        backend:
          service:
            name: django-service
            port:
              number: 8000
      - path: /v1/
        pathType: Prefix
        backend:
          service:
            name: registry-service
            port:
              number: 8081
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] All staging soak metrics pass SLO targets
- [ ] Documentation updated (metrics.md, alerts.md, runbook.md, dashboards.md)
- [ ] Security scan completed (PII redaction verified)
- [ ] Performance tests passed
- [ ] Backup procedures tested
- [ ] Rollback plan prepared

### Deployment Steps
1. **Update environment variables**
   ```bash
   export ENVIRONMENT=production
   export OTEL_TRACES_SAMPLER_ARG=0.2
   export REGISTRY_API_KEY=prod-secure-key
   ```

2. **Deploy services**
   ```bash
   # Deploy registry service
   kubectl apply -f k8s/registry-service-prod.yaml
   
   # Deploy Django service
   kubectl apply -f k8s/django-service-prod.yaml
   
   # Deploy monitoring stack
   kubectl apply -f k8s/monitoring-prod.yaml
   ```

3. **Verify deployment**
   ```bash
   # Check service health
   kubectl get pods -l app=easy-islanders
   
   # Check metrics endpoint
   curl -H "Authorization: Bearer prod-secure-key" \
        https://api.easyislanders.com/v1/healthz
   
   # Check sampling rate
   # Verify 20% sampling in Jaeger/Tempo
   ```

4. **Update ingress rules**
   ```bash
   kubectl apply -f k8s/ingress-prod.yaml
   ```

### Post-Deployment Verification
- [ ] All services healthy (HTTP 200)
- [ ] Metrics endpoint accessible (internal only)
- [ ] Sampling rate at 20% (production)
- [ ] Error rate < 1%
- [ ] P95 latency < 600ms
- [ ] Memory usage stable
- [ ] Alerts configured and tested

## Production Monitoring

### Key Metrics to Watch
```promql
# Service availability
up{job="easy-islanders-prod"}

# Error rate
rate(error_rate_total[5m]) / rate(http_requests_total[5m]) * 100

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
process_resident_memory_bytes / 1024 / 1024

# Sampling rate verification
rate(traces_sampled_total[5m]) / rate(traces_total[5m]) * 100
```

### Alert Thresholds (Production)
- **Critical**: Error rate > 5%, P95 latency > 1.0s, Memory > 2GB
- **Warning**: Error rate > 1%, P95 latency > 600ms, Memory > 1.5GB
- **Info**: Sampling rate < 15% or > 25%

## Security Considerations

### API Key Rotation
```bash
# Monthly rotation schedule
# Week 1: Generate new keys
# Week 2: Deploy with both keys (old + new)
# Week 3: Remove old keys
# Week 4: Monitor for issues
```

### Network Security
- Metrics endpoint restricted to Prometheus IPs
- API endpoints behind WAF
- Rate limiting enabled
- DDoS protection active

### Data Protection
- PII redaction in all logs and metrics
- Encryption at rest and in transit
- Regular security audits
- Compliance with GDPR/CCPA

## Rollback Procedures

### Emergency Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/easy-islanders-prod

# Rollback environment variables
export OTEL_TRACES_SAMPLER_ARG=1.0  # Back to 100% sampling
export ENVIRONMENT=staging

# Verify rollback
kubectl get pods -l app=easy-islanders
curl -H "Authorization: Bearer dev-key" \
     https://api.easyislanders.com/v1/healthz
```

### Gradual Rollback
```bash
# Reduce traffic to staging
kubectl scale deployment/easy-islanders-prod --replicas=1

# Increase staging traffic
kubectl scale deployment/easy-islanders-staging --replicas=3

# Monitor metrics
# If stable, complete rollback
# If issues persist, investigate further
```

## Next Sprint Preparation

### Embedding Pipeline
- [ ] Deploy embedding service
- [ ] Configure Celery workers
- [ ] Set up embedding jobs
- [ ] Test Cyprus FAQ ingestion

### RAG Enhancement
- [ ] Implement hybrid search
- [ ] Add semantic similarity
- [ ] Configure vector database
- [ ] Test multilingual support

### Performance Optimization
- [ ] Database query optimization
- [ ] Cache layer enhancement
- [ ] CDN configuration
- [ ] Load balancing

## Success Criteria

### Technical Metrics
- ✅ Error rate < 1%
- ✅ P95 latency < 600ms
- ✅ Memory usage stable
- ✅ Sampling rate at 20%
- ✅ All services healthy

### Business Metrics
- ✅ User satisfaction > 90%
- ✅ Response time < 2s
- ✅ Uptime > 99.9%
- ✅ Cost per request < $0.01

### Operational Metrics
- ✅ Mean time to resolution < 30min
- ✅ Alert false positive rate < 5%
- ✅ Documentation completeness > 95%
- ✅ Team confidence > 90%
