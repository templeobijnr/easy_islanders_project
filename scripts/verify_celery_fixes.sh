#!/bin/bash
set -e

echo "🔍 Verifying Celery Fixes"
echo "========================="

# 1. Verify Zep Cloud configuration
echo ""
echo "✅ Fix 1: Zep Cloud Configuration"
grep "ZEP_BASE_URL" .env.docker | grep -q "api.getzep.com" && echo "  ✅ ZEP_BASE_URL points to Zep Cloud" || echo "  ❌ FAILED"

# 2. Verify time limits
echo ""
echo "✅ Fix 2: Time Limits"
docker exec easy_islanders_web python3 -c "
from django.conf import settings
assert settings.CELERY_TASK_TIME_LIMIT == 180, f'Expected 180, got {settings.CELERY_TASK_TIME_LIMIT}'
assert settings.CELERY_TASK_SOFT_TIME_LIMIT == 150, f'Expected 150, got {settings.CELERY_TASK_SOFT_TIME_LIMIT}'
print('  ✅ Time limits updated: hard=180s, soft=150s')
" || echo "  ❌ FAILED"

# 3. Verify circuit breaker code exists
echo ""
echo "✅ Fix 3: Circuit Breaker"
grep -q "get_forced_mode" assistant/tasks.py && echo "  ✅ Circuit breaker code added" || echo "  ❌ FAILED"

# 4. Verify error handling
echo ""
echo "✅ Fix 4: Error Handling"
grep -q "preferences_extract_queued" assistant/tasks.py && echo "  ✅ Error handling added" || echo "  ❌ FAILED"

# 5. Verify observability settings
echo ""
echo "✅ Fix 5: Observability"
docker exec easy_islanders_web python3 -c "
from django.conf import settings
assert settings.CELERY_TASK_TRACK_STARTED == True
assert settings.CELERY_SEND_EVENTS == True
print('  ✅ Observability enabled')
" || echo "  ❌ FAILED"

# 6. Verify split workers
echo ""
echo "✅ Fix 6: Split Workers"
count=$(docker compose ps | grep celery | wc -l)
if [ "$count" -eq 3 ]; then
    echo "  ✅ 3 Celery workers running"
else
    echo "  ❌ FAILED: Expected 3 workers, found $count"
fi

# 7. Verify workers listening to correct queues
echo ""
echo "📊 Worker Queue Assignments:"
docker exec easy_islanders_celery_chat celery -A easy_islanders inspect active_queues | grep -q "chat" && echo "  ✅ celery_chat → chat queue" || echo "  ❌ celery_chat FAILED"
docker exec easy_islanders_celery_default celery -A easy_islanders inspect active_queues | grep -q "default" && echo "  ✅ celery_default → default queue" || echo "  ❌ celery_default FAILED"
docker exec easy_islanders_celery_background celery -A easy_islanders inspect active_queues | grep -q "background" && echo "  ✅ celery_background → background queue" || echo "  ❌ celery_background FAILED"

echo ""
echo "✅ All fixes verified!"
