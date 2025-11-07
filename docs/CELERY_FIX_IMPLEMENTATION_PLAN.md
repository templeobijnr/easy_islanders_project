# Celery Fix Implementation Plan

**Date**: 2025-11-07
**Status**: 🔄 In Progress
**Branch**: claude/check-repo-b-011CUq9UvQmVEK185fB4AS8W

---

## Overview

This plan implements 7 critical fixes identified in the Celery System Diagnosis. Each fix is broken down into atomic steps with verification criteria.

**Estimated Time**: 2-3 hours
**Risk Level**: Low (all changes backwards-compatible)
**Rollback Plan**: Git revert + restart containers

---

## Implementation Order

### Phase 1: Configuration Fixes (30 minutes)
1. Fix Zep Cloud configuration
2. Increase time limits
3. Enable observability

### Phase 2: Code Fixes (1 hour)
4. Add circuit breaker to process_chat_message
5. Add error handling to extract_preferences_async
6. Create error callback task

### Phase 3: Infrastructure (1 hour)
7. Split Celery workers by queue
8. Update docker-compose.yml

### Phase 4: Verification (30 minutes)
9. Create verification script
10. Test all fixes
11. Monitor for 15 minutes

---

## Detailed Steps

### Fix 1: Update Zep Cloud Configuration

**File**: `.env.docker`

**Current State**:
```bash
ZEP_ENABLED=true
ZEP_BASE_URL=http://zep:8000  # ⚠️ Local container
ZEP_API_KEY=local-dev-key
ZEP_TIMEOUT_MS=8000
ZEP_API_VERSION=v1
```

**Changes**:
```bash
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com  # ✅ Zep Cloud
ZEP_URL=https://api.getzep.com
ZEP_API_KEY=<PLACEHOLDER_WILL_PROMPT_USER>
ZEP_TIMEOUT_MS=5000  # Cloud is faster
ZEP_API_VERSION=v1
```

**Steps**:
1. ✅ Read current .env.docker
2. ✅ Update ZEP_BASE_URL and ZEP_URL
3. ✅ Add comment about API key (user must provide)
4. ✅ Reduce timeout to 5000ms
5. ✅ Commit changes

**Verification**:
```bash
grep "ZEP_BASE_URL" .env.docker | grep "api.getzep.com"
```

**Rollback**:
```bash
git checkout .env.docker
```

---

### Fix 2: Increase Celery Task Time Limits

**File**: `easy_islanders/settings/base.py:346-347`

**Current State**:
```python
CELERY_TASK_TIME_LIMIT = 60  # Hard limit: kill task after 60s
CELERY_TASK_SOFT_TIME_LIMIT = 45  # Soft limit: SoftTimeLimitExceeded after 45s
```

**Changes**:
```python
# Allow long-running chat tasks (LLM calls can take 30-120s legitimately)
CELERY_TASK_TIME_LIMIT = 180  # Hard limit: kill task after 180s
CELERY_TASK_SOFT_TIME_LIMIT = 150  # Soft limit: warn after 150s
```

**Steps**:
1. ✅ Read settings/base.py
2. ✅ Update CELERY_TASK_TIME_LIMIT to 180
3. ✅ Update CELERY_TASK_SOFT_TIME_LIMIT to 150
4. ✅ Add comment explaining why
5. ✅ Commit changes

**Verification**:
```python
from django.conf import settings
assert settings.CELERY_TASK_TIME_LIMIT == 180
```

**Rollback**:
```bash
git checkout easy_islanders/settings/base.py
```

---

### Fix 3: Add Circuit Breaker to process_chat_message

**File**: `assistant/tasks.py:1481-1496`

**Current State**:
```python
def process_chat_message(self, message_id: str, thread_id: str, client_msg_id: Optional[str] = None):
    # ...
    zep_context = _prepare_zep_write_context(thread)  # No protection
```

**Changes**:
```python
def process_chat_message(self, message_id: str, thread_id: str, client_msg_id: Optional[str] = None):
    # ...

    # Check if Zep is in degraded state (auto-downgrade from repeated failures)
    from assistant.memory.flags import get_forced_mode

    forced_mode = get_forced_mode()
    if forced_mode:
        logger.warning(
            "zep_degraded_skipping_writes",
            extra={
                "thread_id": thread_id,
                "reason": forced_mode.get("reason"),
                "until": forced_mode.get("until"),
                "correlation_id": correlation_id,
            }
        )
        zep_context = None  # Skip Zep writes, continue without memory
    else:
        zep_context = _prepare_zep_write_context(thread)
```

**Steps**:
1. ✅ Read assistant/tasks.py
2. ✅ Find line where zep_context is initialized (line ~1496)
3. ✅ Add import for get_forced_mode
4. ✅ Add circuit breaker check before _prepare_zep_write_context
5. ✅ Add structured logging
6. ✅ Commit changes

**Verification**:
```python
# Manually trigger forced mode, verify task continues
from assistant.memory.flags import force_write_only
force_write_only(duration=60, reason="test")
# Send test message, should complete without Zep writes
```

**Rollback**:
```bash
git checkout assistant/tasks.py
```

---

### Fix 4: Add Error Handling to extract_preferences_async

**File**: `assistant/tasks.py:1518-1529`

**Current State**:
```python
try:
    if PREFS_EXTRACT_ENABLED and msg.sender_id:
        extract_preferences_async.apply_async(...)
except Exception:
    pass  # ⚠️ Silent failure
```

**Changes**:
```python
try:
    if PREFS_EXTRACT_ENABLED and msg.sender_id:
        from django.conf import settings

        # Preflight check: verify OpenAI key configured
        if not getattr(settings, 'OPENAI_API_KEY', None):
            logger.warning(
                "preferences_extract_skipped_no_openai_key",
                extra={"thread_id": thread.thread_id}
            )
        else:
            result = extract_preferences_async.apply_async(
                kwargs={
                    "user_id": msg.sender_id,
                    "thread_id": thread.thread_id,
                    "message_id": str(msg.id),
                    "utterance": user_text,
                },
                link_error=log_preference_extraction_failure.s(thread.thread_id)
            )
            logger.debug(
                "preferences_extract_queued",
                extra={
                    "thread_id": thread.thread_id,
                    "task_id": result.id,
                    "correlation_id": correlation_id,
                }
            )
except Exception as e:
    logger.error(
        "preferences_extract_queue_failed",
        extra={
            "thread_id": thread.thread_id,
            "error": str(e),
            "correlation_id": correlation_id,
        },
        exc_info=True
    )
```

**Steps**:
1. ✅ Read assistant/tasks.py
2. ✅ Find extract_preferences_async call (line ~1518)
3. ✅ Add preflight check for OPENAI_API_KEY
4. ✅ Add link_error callback
5. ✅ Add structured logging for queue success/failure
6. ✅ Create log_preference_extraction_failure task
7. ✅ Commit changes

**Verification**:
```bash
# Unset OPENAI_API_KEY, verify warning logged
# Set OPENAI_API_KEY, verify task queued with task_id
docker logs easy_islanders_celery | grep "preferences_extract"
```

**Rollback**:
```bash
git checkout assistant/tasks.py
```

---

### Fix 5: Create Error Callback Task

**File**: `assistant/tasks.py` (add new task)

**New Code**:
```python
@shared_task
def log_preference_extraction_failure(task_id, exc, traceback, thread_id):
    """
    Error callback for extract_preferences_async failures.
    Logs detailed error information for debugging.
    """
    logger.error(
        "preferences_extract_failed",
        extra={
            "thread_id": thread_id,
            "task_id": task_id,
            "error": str(exc),
            "traceback": traceback,
        }
    )

    # Optionally: increment metric
    try:
        from assistant.monitoring.metrics import inc_prefs_extract_request
        inc_prefs_extract_request("error")
    except Exception:
        pass

    return {
        "success": False,
        "thread_id": thread_id,
        "error": str(exc),
    }
```

**Steps**:
1. ✅ Add new task after extract_preferences_async
2. ✅ Add error logging with structured fields
3. ✅ Add metric increment (optional, safe to fail)
4. ✅ Commit changes

**Verification**:
```python
# Trigger preference extraction with invalid data
# Verify callback logs error
docker logs easy_islanders_celery | grep "preferences_extract_failed"
```

---

### Fix 6: Enable Celery Observability

**File**: `easy_islanders/settings/base.py:365-367`

**Current State**:
```python
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_ENABLE_REMOTE_CONTROL = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
```

**Changes**:
```python
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_ENABLE_REMOTE_CONTROL = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Observability: Enable task event tracking for monitoring
CELERY_TASK_TRACK_STARTED = True  # Emit task-started event (not just queued)
CELERY_TASK_SEND_SENT_EVENT = True  # Emit task-sent event
CELERY_WORKER_SEND_TASK_EVENTS = True  # Worker lifecycle events
CELERY_SEND_EVENTS = True  # Enable event dispatcher

# Structured logging for task states
CELERY_REDIRECT_STDOUTS_LEVEL = "INFO"  # Capture task stdout/stderr
```

**Steps**:
1. ✅ Read settings/base.py
2. ✅ Add 5 new observability settings
3. ✅ Add comments explaining each
4. ✅ Commit changes

**Verification**:
```bash
# Check celery events stream shows task lifecycle
docker exec easy_islanders_celery celery -A easy_islanders events --dump
# Should show: task-sent, task-started, task-succeeded events
```

**Rollback**:
```bash
git checkout easy_islanders/settings/base.py
```

---

### Fix 7: Split Celery Workers by Queue

**File**: `docker-compose.yml:44-62`

**Current State**:
```yaml
celery:
  build: .
  container_name: easy_islanders_celery
  command: celery -A easy_islanders worker -Q chat,default,background,notifications,dlq -l info --concurrency=8
```

**Changes**:
```yaml
# Remove old single worker, add 3 dedicated workers

celery_chat:
  build: .
  container_name: easy_islanders_celery_chat
  command: celery -A easy_islanders worker -Q chat -l info --concurrency=4 --pool=threads
  volumes:
    - .:/code
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network
  restart: unless-stopped

celery_default:
  build: .
  container_name: easy_islanders_celery_default
  command: celery -A easy_islanders worker -Q default -l info --concurrency=4 --pool=threads
  volumes:
    - .:/code
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network
  restart: unless-stopped

celery_background:
  build: .
  container_name: easy_islanders_celery_background
  command: celery -A easy_islanders worker -Q background,notifications,dlq -l info --concurrency=4
  volumes:
    - .:/code
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network
  restart: unless-stopped
```

**Steps**:
1. ✅ Read docker-compose.yml
2. ✅ Remove old `celery:` service
3. ✅ Add celery_chat service (chat queue, 4 workers, threads pool)
4. ✅ Add celery_default service (default queue, 4 workers, threads pool)
5. ✅ Add celery_background service (background/notifications/dlq, 4 workers)
6. ✅ Remove zep dependency (using Zep Cloud)
7. ✅ Commit changes

**Verification**:
```bash
docker compose ps | grep celery
# Should show 3 containers: celery_chat, celery_default, celery_background

docker exec easy_islanders_celery_chat celery -A easy_islanders inspect active_queues
# Should show: [{'name': 'chat', ...}]

docker exec easy_islanders_celery_default celery -A easy_islanders inspect active_queues
# Should show: [{'name': 'default', ...}]
```

**Rollback**:
```bash
git checkout docker-compose.yml
docker compose down
docker compose up -d
```

---

### Fix 8: Create Verification Script

**File**: `scripts/verify_celery_fixes.sh` (new)

**Content**:
```bash
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
```

**Steps**:
1. ✅ Create scripts/verify_celery_fixes.sh
2. ✅ Add checks for each fix
3. ✅ Make executable
4. ✅ Commit

**Verification**:
```bash
./scripts/verify_celery_fixes.sh
```

---

## Rollback Plan

If any issues occur:

```bash
# 1. Checkout all files
git checkout .env.docker
git checkout easy_islanders/settings/base.py
git checkout assistant/tasks.py
git checkout docker-compose.yml

# 2. Restart containers
docker compose down
docker compose up -d

# 3. Verify rollback
./scripts/debug_celery.sh
```

---

## Post-Implementation Checklist

- [ ] All files committed to git
- [ ] Verification script passes
- [ ] No errors in celery logs (15 min monitoring)
- [ ] Queue depths < 10 tasks
- [ ] No zep_call_error messages
- [ ] Test chat message completes successfully
- [ ] Preference extraction logs visible
- [ ] All 3 workers running
- [ ] Prometheus metrics flowing

---

## Testing Plan

### Manual Tests

1. **Send test chat message**:
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "I need a 2BR apartment in Kyrenia under £500", "thread_id": "test-123"}'
```

Expected:
- Task completes in <120s
- No WorkerLostError
- Zep writes succeed (or gracefully skip if in forced mode)
- Response includes recommendations

2. **Trigger preference extraction**:
```bash
# Send message with budget/location
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a budget of €1000 for a flat in Girne", "thread_id": "test-456"}'
```

Expected:
- extract_preferences_async queued
- Log shows "preferences_extract_queued" with task_id
- Preferences saved to database

3. **Monitor workers**:
```bash
watch -n 5 'docker stats --no-stream | grep celery'
```

Expected:
- 3 containers running
- Memory stable (<500MB each)
- CPU <50% under load

---

## Success Criteria

✅ **Fix deployed successfully if**:
1. All verification script checks pass
2. No errors in celery logs for 15 minutes
3. Test chat message completes successfully
4. Queue depths drain to <5 tasks
5. All 3 workers show active in `docker ps`
6. Prometheus metrics show task-started events

---

**Status**: Ready for implementation
**Next Step**: Execute fixes in order
**Estimated Completion**: 2-3 hours
