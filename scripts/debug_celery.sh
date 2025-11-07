#!/bin/bash
# Production-grade Celery debug harness

set -e

echo "🔍 Celery System Health Check"
echo "=============================="

# 1. Worker status
echo ""
echo "📊 Worker Status:"
docker exec easy_islanders_celery celery -A easy_islanders inspect ping || echo "❌ Workers not responding!"

# 2. Active tasks
echo ""
echo "🏃 Active Tasks:"
docker exec easy_islanders_celery celery -A easy_islanders inspect active | jq '.'

# 3. Queue depths
echo ""
echo "📦 Queue Depths:"
for queue in celery chat default background notifications dlq; do
    depth=$(docker exec easy_islanders_redis redis-cli LLEN $queue)
    echo "  $queue: $depth tasks"
done

# 4. Memory usage
echo ""
echo "💾 Worker Memory:"
docker stats easy_islanders_celery --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}"

# 5. Recent errors
echo ""
echo "🚨 Recent Errors (last 50 lines):"
docker logs easy_islanders_celery --tail 50 | grep -E "ERROR|CRITICAL|zep_call_error|zep_call_failure" || echo "  ✅ No recent errors"

# 6. Zep connection test
echo ""
echo "🧠 Zep Connection:"
docker exec easy_islanders_web python3 -c "
import os
from assistant.memory.service import get_client
from assistant.memory.flags import current_mode, get_forced_mode

client = get_client()
forced = get_forced_mode()

print(f'  Base URL: {os.getenv(\"ZEP_BASE_URL\")}')
print(f'  Client initialized: {client is not None}')
print(f'  Current mode: {current_mode().value}')
print(f'  Forced mode: {forced}')
" || echo "  ❌ Zep connection failed!"

# 7. Task failure rate (last 100 events)
echo ""
echo "📈 Task Metrics:"
docker exec easy_islanders_redis redis-cli --scan --pattern "celery-task-meta-*" | head -100 | while read key; do
    docker exec easy_islanders_redis redis-cli GET "$key"
done | jq -s '[.[] | select(.status)] | group_by(.status) | map({status: .[0].status, count: length})' || echo "  ℹ️  No task metadata available"

echo ""
echo "✅ Health check complete!"
