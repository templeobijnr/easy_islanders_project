# Easy Islanders - Alert Rules and Escalation

## Overview
This document defines alert rules, thresholds, and escalation procedures for the Easy Islanders observability stack.

## Alert Categories

### Critical Alerts (P0)
**Immediate escalation required - Service down or severely degraded**

#### Service Down
- **Alert**: `ServiceDown`
- **Condition**: `up{job="registry-service"} == 0` OR `up{job="django-service"} == 0`
- **Duration**: 1 minute
- **Severity**: Critical
- **Escalation**: Immediate page to on-call engineer

#### High Error Rate
- **Alert**: `HighErrorRate`
- **Condition**: `rate(error_rate_total[5m]) / rate(http_requests_total[5m]) > 0.05`
- **Duration**: 2 minutes
- **Severity**: Critical
- **Escalation**: Immediate page to on-call engineer

#### Memory Exhaustion
- **Alert**: `MemoryExhaustion`
- **Condition**: `process_resident_memory_bytes > 2e9` (2GB)
- **Duration**: 5 minutes
- **Severity**: Critical
- **Escalation**: Immediate page to on-call engineer

### Warning Alerts (P1)
**Performance degradation - Investigate within 30 minutes**

#### High Latency
- **Alert**: `HighLatency`
- **Condition**: `histogram_quantile(0.95, rate(registry_terms_search_latency_seconds_bucket[5m])) > 0.6`
- **Duration**: 5 minutes
- **Severity**: Warning
- **Escalation**: Slack notification to #alerts

#### Elevated Error Rate
- **Alert**: `ElevatedErrorRate`
- **Condition**: `rate(registry_text_fallback_total[5m]) / rate(registry_terms_search_latency_seconds_count[5m]) > 0.01`
- **Duration**: 10 minutes
- **Severity**: Warning
- **Escalation**: Slack notification to #alerts

#### Memory Pressure
- **Alert**: `MemoryPressure`
- **Condition**: `process_resident_memory_bytes > 1.5e9` (1.5GB)
- **Duration**: 10 minutes
- **Severity**: Warning
- **Escalation**: Slack notification to #alerts

### Info Alerts (P2)
**Operational insights - Review during business hours**

#### Low Cache Hit Rate
- **Alert**: `LowCacheHitRate`
- **Condition**: `cache_hit_rate < 0.8`
- **Duration**: 15 minutes
- **Severity**: Info
- **Escalation**: Email to ops team

#### High LLM Costs
- **Alert**: `HighLLMCosts`
- **Condition**: `rate(llm_cost_total[1h]) > 10` (>$10/hour)
- **Duration**: 30 minutes
- **Severity**: Info
- **Escalation**: Email to ops team

## Escalation Procedures

### P0 (Critical) Escalation Path
1. **Immediate**: AlertManager pages on-call engineer
2. **+5 minutes**: If no acknowledgment, escalate to team lead
3. **+15 minutes**: If no response, escalate to engineering manager
4. **+30 minutes**: If still unresolved, escalate to CTO

### P1 (Warning) Escalation Path
1. **Immediate**: Slack notification to #alerts channel
2. **+30 minutes**: If no acknowledgment, page on-call engineer
3. **+1 hour**: If unresolved, escalate to team lead

### P2 (Info) Escalation Path
1. **Immediate**: Email to ops team
2. **+4 hours**: If no response, Slack notification
3. **+24 hours**: If unresolved, create ticket

## Alert Response Procedures

### Service Down Response
1. **Immediate**: Check service status and logs
2. **+2 minutes**: Attempt service restart
3. **+5 minutes**: If restart fails, check dependencies (database, Redis)
4. **+10 minutes**: If dependencies OK, escalate to senior engineer
5. **+15 minutes**: Consider rolling back recent deployments

### High Error Rate Response
1. **Immediate**: Check error logs and patterns
2. **+5 minutes**: Identify root cause (API limits, database issues, etc.)
3. **+10 minutes**: Implement temporary mitigation (circuit breaker, retry logic)
4. **+30 minutes**: Deploy permanent fix or rollback

### High Latency Response
1. **Immediate**: Check system resources (CPU, memory, network)
2. **+5 minutes**: Review recent deployments and configuration changes
3. **+10 minutes**: Check database performance and query patterns
4. **+20 minutes**: Implement performance optimizations or scale resources

## Alert Suppression Rules

### Maintenance Windows
- **Suppress**: All alerts during scheduled maintenance
- **Duration**: As defined in maintenance window
- **Method**: AlertManager silence rules

### Known Issues
- **Suppress**: Specific alerts for known issues with workarounds
- **Duration**: Until issue is resolved
- **Method**: AlertManager silence rules with expiration

### False Positives
- **Suppress**: Alerts that trigger incorrectly
- **Duration**: Until alert rule is fixed
- **Method**: AlertManager silence rules

## Alert Testing

### Weekly Alert Tests
- **Test**: All critical alerts by temporarily triggering conditions
- **Schedule**: Every Tuesday at 2 PM UTC
- **Duration**: 5 minutes per alert
- **Documentation**: Record test results and any issues

### Monthly Alert Review
- **Review**: All alert rules for accuracy and relevance
- **Update**: Thresholds based on historical data
- **Remove**: Obsolete alerts
- **Add**: New alerts based on operational needs

## Alert Channels

### Slack Channels
- **#alerts**: All P1 and P2 alerts
- **#critical-alerts**: P0 alerts only
- **#ops-team**: Operational discussions

### Email Lists
- **ops-team@easyislanders.com**: P2 alerts and reports
- **oncall@easyislanders.com**: P0 and P1 escalations

### PagerDuty
- **Service**: Easy Islanders Production
- **Escalation**: On-call engineer → Team lead → Engineering manager → CTO
- **Schedule**: Weekly rotation

## Runbook Integration

Each alert should reference:
1. **Runbook section**: Specific troubleshooting steps
2. **Dashboard links**: Relevant Grafana dashboards
3. **Log queries**: Kibana/ELK queries for investigation
4. **Contact information**: Who to contact for escalation

## Alert Metrics

Track alert effectiveness:
- **Alert volume**: Number of alerts per day/week
- **False positive rate**: Percentage of alerts that don't require action
- **Mean time to acknowledge**: Time from alert to acknowledgment
- **Mean time to resolve**: Time from alert to resolution
- **Escalation rate**: Percentage of alerts that require escalation
