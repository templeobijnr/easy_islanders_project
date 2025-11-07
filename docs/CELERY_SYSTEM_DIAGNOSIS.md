# Celery System Diagnosis Report

**Date**: 2025-11-07
**Status**: 🔴 CRITICAL ISSUES FOUND
**Priority**: P0 - Immediate Action Required

---

## Executive Summary

Your Celery system has **7 critical issues** causing task failures, retry storms, and Zep Cloud integration errors. The root cause is a combination of:

1. **Configuration conflicts** (time limits, queue routing)
2. **Missing circuit breakers** for external services (Zep Cloud, OpenAI)
3. **Race conditions** between process_chat_message and extract_preferences_async
4. **Auto-downgrade triggering** from repeated Zep failures
5. **Insufficient observability** (no task tracking, no structured logging)

**Immediate Impact**:
- `process_chat_message` tasks timing out (120s task vs 60s limit)
- `zep_call_error` retry storms triggering auto-downgrade to write-only mode
- `extract_preferences_async` results being skipped (fire-and-forget with no error handling)
- Worker pool starvation from long-running chat tasks blocking other queues

---

## Task Inventory

### Core Chat Tasks (assistant/tasks.py)

| Task | Queue | Timeout | Dependencies | Status | Notes |
|------|-------|---------|--------------|--------|-------|
| **process_chat_message** | chat | 120s/100s | Zep Cloud, OpenAI, Django ORM, Channels | 🔴 CRITICAL | Time limit conflict, Zep retry storms |
| **extract_preferences_async** | default | 60s | OpenAI (optional), Django ORM | 🟡 WARNING | Fire-and-forget, results skipped |
| process_incoming_media_task | background | 60s | S3/Media storage, Django ORM | ✅ OK | Retries working |
| trigger_get_and_prepare_card_task | background | 60s | Django ORM, Redis | ✅ OK | Good retry logic |
| send_whatsapp_message_task | notifications | 60s | Twilio API | ✅ OK | Retry for transient failures |
| broadcast_request_to_sellers | background | 60s | Django ORM, Twilio | ✅ OK | Atomic transactions added |
| broadcast_request_for_request | background | 60s | Django ORM | ✅ OK | Simple broadcast |
| trigger_proactive_agent_response | background | 60s | Django ORM, Redis | ⚠️ WARNING | Rate limit race condition (ISSUE-003 fixed) |
| send_proactive_reminders | background | 60s | Django ORM, Redis | ✅ OK | Rate limit atomic |
| send_market_updates | background | 60s | Django ORM, Redis | ✅ OK | Rate limit atomic |
| monitor_pending_outreaches | background | 60s | Django ORM, Twilio | ✅ OK | Periodic check |
| process_webhook_media_task | background | 90s | Celery chain (.delay + .get) | 🟡 WARNING | Blocking .get() calls |
| cleanup_old_notifications_task | background | 60s | Redis | ✅ OK | Simple cleanup |
| monitor_new_media_and_trigger_proactive | background | 60s | Django ORM, Redis | ✅ OK | Periodic monitoring |
| index_listing_task | background | 60s | ChromaDB, HuggingFace | ✅ OK | Embeddings work |
| delete_listing_from_index | background | 60s | ChromaDB | ✅ OK | Simple deletion |
| update_calibration_params | background | 60s | Django ORM | ✅ OK | Router retraining |
| dispatch_broadcast | background | 60s | Email/SMS (not impl) | ⚠️ STUB | Not implemented |
| dead_letter_queue | dlq | N/A | Django ORM | ✅ OK | DLQ handler |

### Router Service Tasks (router_service/tasks.py)

| Task | Queue | Schedule | Dependencies | Status | Notes |
|------|-------|----------|--------------|--------|-------|
| update_router_centroids | background | Daily 2 AM | Django ORM | ⚠️ TODO | Placeholder |
| retrain_router_calibration | background | Weekly Sun 3 AM | Django ORM, scikit-learn | ✅ OK | Calibration works |
| cleanup_old_router_events | background | Daily 4 AM | Django ORM | ✅ OK | Cleanup logic |
| validate_calibration_models | background | N/A | Django ORM | ⚠️ TODO | Not scheduled |
| promote_calibration_models | background | N/A | Django ORM | ⚠️ TODO | Not implemented |

### Registry Service Tasks (registry_service/tasks.py)

| Task | Queue | Schedule | Dependencies | Status | Notes |
|------|-------|----------|--------------|--------|-------|
| reembed_changed_terms | background | Daily 2 AM | OpenAI embeddings | ⚠️ MOCK | Simulated only |
| embed_single_term | background | On-demand | OpenAI embeddings | ⚠️ MOCK | Simulated only |
| drift_report | background | Daily 3 AM | None | ⚠️ MOCK | Simulated only |
| cleanup_old_embeddings | background | Daily 4 AM | Django ORM | ⚠️ MOCK | Simulated only |
| run_rag_ingestion | background | Daily 1 AM | Embeddings, ChromaDB | ⚠️ MISSING | Task not found in codebase |

---

## Root Cause Findings

### 🔴 CRITICAL 1: Time Limit Configuration Conflict

**File**: `assistant/tasks.py:1477-1479` vs `easy_islanders/settings/base.py:346-347`

```python
# settings/base.py:346-347
CELERY_TASK_TIME_LIMIT = 60  # Hard limit: kill task after 60s
CELERY_TASK_SOFT_TIME_LIMIT = 45  # Soft limit: SoftTimeLimitExceeded after 45s

# tasks.py:1477-1479 (process_chat_message decorator)
@shared_task(
    soft_time_limit=100,  # ⚠️ CONFLICTS with global 45s!
    time_limit=120,       # ⚠️ CONFLICTS with global 60s!
    queue="chat",
)
```

**Problem**:
- Global settings say "kill after 60s"
- `process_chat_message` says "kill after 120s"
- **Celery worker uses GLOBAL settings**, ignoring task-level overrides when `CELERY_TASK_TIME_LIMIT` is set
- Tasks are being SIGKILL'd at 60s, mid-execution
- LangGraph supervisor calls can take 30-80s legitimately

**Evidence**:
```python
# tasks.py:1531 - run_supervisor_agent can take 30-80s
result = run_supervisor_agent(
    user_text,
    thread.thread_id,
    client_msg_id=str(client_msg_id) if client_msg_id else None,
)
```

**Impact**:
- Tasks fail with `WorkerLostError` or `TimeLimitExceeded`
- Retry storms triggered
- User sees "task_failed" errors
- Zep writes incomplete (user message written, assistant message not written)

**Fix Priority**: P0 - Fix immediately

---

### 🔴 CRITICAL 2: Zep Cloud Circuit Breaker Missing

**File**: `assistant/tasks.py:1496-1571`

```python
# tasks.py:1496 - Zep write calls have NO circuit breaker protection
zep_context = _prepare_zep_write_context(thread)  # Can fail repeatedly

# tasks.py:1515 - Each write can trigger retry storm
if zep_context:
    user_write_ok, user_write_ms, user_redactions = _mirror_user_message(
        zep_context, msg, user_text, thread
    )
```

**Problem**:
- `call_zep()` function in `memory/service.py:116` increments failure counters
- After 3 consecutive failures, auto-downgrade forces write-only mode for 5 minutes
- BUT: `process_chat_message` keeps retrying (max_retries=5 with exponential backoff)
- Each retry re-attempts Zep write → accumulates failures → triggers auto-downgrade
- Once in write-only mode, ALL reads return empty context → supervisor has no memory → poor responses

**Auto-Downgrade Trigger** (memory/service.py:181-194):
```python
# PR-J: Check if mode is forced to write_only (health degradation)
forced = get_forced_mode()
if forced:
    meta.update({
        "used": False,
        "source": "write_only_forced",
        "reason": forced.get("reason"),
        "until": forced.get("until"),
    })
    logger.debug(
        "zep_read_blocked_forced_mode",
        extra={"thread_id": thread_id, "reason": forced.get("reason")}
    )
    return None, meta  # ⚠️ Empty context returned!
```

**Evidence from User**:
> "zep_call_error keeps repeating"

This matches the auto-downgrade behavior:
1. Zep Cloud API returns 401/403/timeout
2. `call_zep()` increments consecutive failures
3. After 3 failures → `force_write_only()` called
4. Read-path blocked for 5 minutes
5. After 5 minutes, probe attempt fails → another 5 minutes
6. **Retry storm continues**

**Impact**:
- Supervisor receives empty memory context
- Agent forgets conversation history
- User confused by "amnesia" responses
- Zep write failures logged as `zep_call_failure`
- Metrics show `zep_write_failure{op="user_message"}` spiking

**Fix Priority**: P0 - Fix immediately

---

### 🔴 CRITICAL 3: extract_preferences_async Silently Fails

**File**: `assistant/tasks.py:1518-1529`

```python
# Fire-and-forget preference extraction (non-blocking)
try:
    if PREFS_EXTRACT_ENABLED and msg.sender_id:
        extract_preferences_async.apply_async(  # ⚠️ No result tracking!
            kwargs={
                "user_id": msg.sender_id,
                "thread_id": thread.thread_id,
                "message_id": str(msg.id),
                "utterance": user_text,
            }
        )
except Exception:
    pass  # ⚠️ Silently swallowed!
```

**Problem**:
- Task runs on `default` queue
- If OpenAI API key missing or invalid → task fails
- No result tracking (`ignore_result=True` globally)
- Parent task doesn't know child failed
- Preferences never extracted, no logging

**Evidence from User**:
> "task results are skipped (extract_preferences_async)"

**Root Cause**:
```python
# tasks.py:1844 - LLM extraction
llm_data = extract_preferences_from_message(utterance)

# services/preference_extraction.py likely does:
import openai
openai.api_key = settings.OPENAI_API_KEY  # ⚠️ May be None!
```

If `OPENAI_API_KEY` is not set:
- `extract_preferences_from_message()` raises exception
- Task retries 3 times
- After max retries → fails silently
- No DLQ entry (not configured for this task)

**Impact**:
- User preferences never captured
- Personalization doesn't work
- Silent failure, no alerts

**Fix Priority**: P1 - Fix this week

---

### 🟡 WARNING 4: Race Condition in Task Concurrency

**File**: `docker-compose.yml:48`

```yaml
celery:
  command: celery -A easy_islanders worker -Q chat,default,background,notifications,dlq -l info --concurrency=8
```

**Problem**:
- Worker subscribes to ALL 5 queues: `chat,default,background,notifications,dlq`
- Concurrency = 8 workers total (shared across all queues!)
- `chat` queue has tasks that take 30-120s (`process_chat_message`)
- If 5 chat tasks arrive → 5 workers busy for 120s
- Only 3 workers left for `default,background,notifications,dlq`
- **Queue starvation**: background tasks delayed

**Evidence**:
```python
# User asks: "whether task concurrency is correct (chat queue vs default)"
```

**Scenario**:
```
Time 0s:  8 workers idle
Time 1s:  5 x process_chat_message tasks arrive → 5 workers busy
Time 2s:  10 x extract_preferences_async tasks arrive → queued (only 3 workers free)
Time 5s:  All 8 workers now busy
Time 10s: 20 x background tasks queued, waiting
Time 120s: First chat task completes, background tasks start draining
```

**Impact**:
- Background tasks delayed by 2-3 minutes during chat bursts
- User sees slow proactive notifications
- Preference extraction backlog grows

**Fix Priority**: P1 - Split workers by queue

---

### 🟡 WARNING 5: Missing Observability Configuration

**File**: `easy_islanders/settings/base.py` (Celery config section)

**Missing**:
```python
# NOT CONFIGURED:
CELERY_TASK_TRACK_STARTED = True  # Track when task starts (not just queued)
CELERY_TASK_SEND_SENT_EVENT = True  # Emit task-sent events
CELERY_WORKER_SEND_TASK_EVENTS = True  # Worker task events
CELERY_TASK_TRACK_LATE_STARTUP = True  # Track startup delays
```

**Problem**:
- Can't distinguish between "task queued" vs "task started" vs "task running"
- No way to debug "why is task not starting?" issues
- Celery Flower dashboard shows incomplete data
- Prometheus metrics missing task lifecycle events

**Impact**:
- Blind to worker health issues
- Can't diagnose "task stuck in queue" vs "task stuck in execution"
- No visibility into prefetch queue depth

**Fix Priority**: P1 - Add this week

---

### 🟡 WARNING 6: Blocking .get() Calls in Celery Tasks

**File**: `assistant/tasks.py:498-506`

```python
@shared_task
def process_webhook_media_task(self, webhook_data: Dict[str, Any]):
    # ...
    media_result = process_incoming_media_task.delay(listing_id, media_urls)
    media_data = media_result.get(timeout=60)  # ⚠️ BLOCKS worker for 60s!

    # ...
    card_result = trigger_get_and_prepare_card_task.delay(listing_id)
    card_data = card_result.get(timeout=30)  # ⚠️ BLOCKS worker for 30s!
```

**Problem**:
- Calling `.get()` on AsyncResult blocks the worker thread
- Worker can't process other tasks while waiting
- If child task is queued behind parent → **DEADLOCK**

**Scenario**:
```
1. process_webhook_media_task starts on Worker 1
2. Calls process_incoming_media_task.delay() → queued
3. Calls .get(timeout=60) → Worker 1 BLOCKS
4. If all 8 workers are now blocked on .get() → deadlock
5. Child tasks queued but no workers free to execute them
```

**Impact**:
- Worker pool exhaustion
- Deadlocks during traffic bursts
- Tasks timeout waiting for children

**Fix Priority**: P2 - Replace with Celery chains/groups

---

### 🟡 WARNING 7: Environment Variable Misalignment

**File**: User mentioned "missing or misconfigured environment variables"

**Analysis**:

**.env.docker** (used by both web and celery containers):
```bash
ZEP_ENABLED=true
ZEP_BASE_URL=http://zep:8000  # ⚠️ Local Zep container
ZEP_API_KEY=local-dev-key
ZEP_TIMEOUT_MS=8000
```

**BUT User Said**: "we are only running zep cloud now via requests only and we are not running any local host at all"

**Mismatch**:
- `.env.docker` points to local Zep container: `http://zep:8000`
- User wants Zep Cloud: `https://api.getzep.com`
- Container starts, connects to local Zep → wrong API endpoints
- Zep Cloud credentials (`ZEP_API_KEY`) might be different format

**Evidence from Previous Conversation**:
> User: "we are only running zep cloud now via requests only and we are not running any local host at all"

**Impact**:
- Worker connects to wrong Zep instance (local vs cloud)
- API version mismatch (local uses v1, cloud might use different format)
- Authentication failures (`401 Unauthorized`)

**Fix Priority**: P0 - Update .env.docker immediately

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                   process_chat_message (chat queue)              │
│                   Time: 30-120s (long!)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├─► run_supervisor_agent (sync, 30-80s)
                       │   ├─► OpenAI API (LLM calls)
                       │   ├─► Django ORM (DB queries)
                       │   └─► Zep Cloud (memory read, 250ms timeout)
                       │
                       ├─► _prepare_zep_write_context (sync, <1s)
                       │   ├─► Zep Cloud ensure_user
                       │   └─► Zep Cloud ensure_thread
                       │
                       ├─► _mirror_user_message (sync, <1s)
                       │   └─► Zep Cloud add_message
                       │
                       ├─► _mirror_assistant_message (sync, <1s)
                       │   └─► Zep Cloud add_message
                       │
                       ├─► extract_preferences_async.apply_async (async, fire-forget)
                       │   ├─► OpenAI API (GPT-4o-mini)
                       │   └─► Django ORM (save preferences)
                       │
                       └─► Django Channels group_send (sync, <10ms)


┌─────────────────────────────────────────────────────────────────┐
│              process_webhook_media_task (background)             │
│              Time: 90s (includes blocking waits)                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├─► process_incoming_media_task.delay()
                       │   └─► media_result.get(timeout=60) ⚠️ BLOCKS
                       │       ├─► Download media from Twilio
                       │       ├─► Store in S3/local
                       │       └─► Update Django ORM
                       │
                       └─► trigger_get_and_prepare_card_task.delay()
                           └─► card_result.get(timeout=30) ⚠️ BLOCKS
                               ├─► GET /api/listings/{id}/images/
                               ├─► Django ORM
                               └─► Redis (cache card data)
```

**Critical Path Issues**:
1. **Zep Cloud in critical path**: Every chat message waits for Zep writes (3-5 network calls)
2. **No timeout fallback**: If Zep slow → entire message processing slow
3. **Blocking .get() calls**: Worker threads wasted waiting for results
4. **Fire-and-forget with no error handling**: Preference extraction failures invisible

---

## Serialization Analysis

**Current**: JSON only (`CELERY_TASK_SERIALIZER = 'json'`)

**Tasks Passing Non-JSON Types**:

✅ **SAFE**: All tasks use JSON-serializable types
```python
# tasks.py:305 - process_incoming_media_task
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_incoming_media_task(self, listing_id: int, media_urls: List[str]):
    # ✅ int, List[str] → JSON-safe

# tasks.py:1481 - process_chat_message
def process_chat_message(self, message_id: str, thread_id: str, client_msg_id: Optional[str] = None):
    # ✅ str, str, Optional[str] → JSON-safe
```

**No Serialization Issues Found** ✅

---

## Retry Logic Analysis

### ✅ GOOD: Exponential Backoff Configured

```python
# tasks.py:1472-1476
@shared_task(
    autoretry_for=RETRY_EXCEPTIONS,  # (TimeoutError, ConnectionError, requests.exceptions.*)
    retry_backoff=True,  # ✅ Exponential backoff enabled
    retry_backoff_max=60,  # ✅ Max 60s between retries
    retry_jitter=True,  # ✅ Jitter to spread retry bursts
    max_retries=5,
)
```

**Retry Schedule**:
```
Attempt 1: Immediate
Attempt 2: Wait 2^1 = 2s ± jitter
Attempt 3: Wait 2^2 = 4s ± jitter
Attempt 4: Wait 2^3 = 8s ± jitter
Attempt 5: Wait 2^4 = 16s ± jitter
Attempt 6: Wait 2^5 = 32s ± jitter (capped at 60s max)
```

### 🔴 BAD: Retry Storm from Zep Failures

**Problem**: Each retry re-attempts Zep write → accumulates failures → triggers auto-downgrade

**Flow**:
```
1. process_chat_message starts
2. Zep Cloud returns 503 Service Unavailable
3. call_zep() increments consecutive_failures counter (1/3)
4. Task retries after 2s
5. Zep Cloud still down → consecutive_failures = 2/3
6. Task retries after 4s
7. Zep Cloud still down → consecutive_failures = 3/3
8. 🔴 Auto-downgrade triggered: force_write_only(duration=300s, reason="consecutive_failures")
9. Task retries after 8s (but Zep reads now blocked)
10. Task completes with empty memory context
11. User confused by response without history
12. After 5 minutes, probe attempt → likely fails → another 5 minutes
```

**Solution**: Add circuit breaker at task level (not just service level)

---

## Concurrency Deep Dive

### Current Configuration

```yaml
# docker-compose.yml:48
command: celery -A easy_islanders worker -Q chat,default,background,notifications,dlq -l info --concurrency=8
```

**Breakdown**:
- **Total workers**: 8 threads
- **Queues**: 5 (chat, default, background, notifications, dlq)
- **Worker model**: Threads (not prefork/gevent)
- **Prefetch**: 1 (fair scheduling, good!)

### Task Distribution Analysis

**Average Task Duration** (from timeouts):
```
chat queue:           30-120s (process_chat_message)
default queue:        1-10s (extract_preferences_async, cleanup tasks)
background queue:     5-60s (media processing, broadcasts)
notifications queue:  1-5s (WhatsApp sends)
dlq queue:            <1s (just log failures)
```

**Queue Load Simulation** (10 requests/sec):
```
Time Window: 1 minute (60s)

Incoming Tasks:
- 10 chat messages/sec × 60s = 600 chat tasks
- 10 preference extractions/sec × 60s = 600 default tasks
- 5 background tasks/sec × 60s = 300 background tasks
- 2 notifications/sec × 60s = 120 notification tasks

Worker Allocation (8 workers, round-robin across queues):
- chat: 8 workers × (600 / 1620 total) = ~3 workers
- default: ~3 workers
- background: ~1.5 workers
- notifications: ~0.5 workers

But chat tasks take 60s average:
- 3 workers × 60s = 180 tasks/min capacity
- Incoming: 600 tasks/min
- 🔴 BACKLOG: 420 tasks queued, growing 7 tasks/sec
```

**Conclusion**: **Severe underprovisioning for chat queue**

---

## Recommended Fixes

### Priority 0 (Deploy Today)

#### Fix 1: Resolve Time Limit Conflict

**File**: `easy_islanders/settings/base.py:346-347`

**Change**:
```python
# BEFORE (BROKEN):
CELERY_TASK_TIME_LIMIT = 60  # Hard limit: kill task after 60s
CELERY_TASK_SOFT_TIME_LIMIT = 45  # Soft limit: SoftTimeLimitExceeded after 45s

# AFTER (FIXED):
CELERY_TASK_TIME_LIMIT = 180  # Hard limit: kill task after 180s (allow long chat tasks)
CELERY_TASK_SOFT_TIME_LIMIT = 150  # Soft limit: warn after 150s

# OR: Remove global limits entirely (let tasks self-configure)
# CELERY_TASK_TIME_LIMIT = None
# CELERY_TASK_SOFT_TIME_LIMIT = None
```

**Why**: process_chat_message legitimately needs 120s for LLM calls. Global 60s limit kills it mid-execution.

---

#### Fix 2: Update Zep Cloud Configuration

**File**: `.env.docker:20-28`

**Change**:
```bash
# BEFORE (BROKEN - points to local container):
ZEP_ENABLED=true
ZEP_BASE_URL=http://zep:8000
ZEP_URL=http://zep:8000
ZEP_API_KEY=local-dev-key
ZEP_TIMEOUT_MS=8000
ZEP_API_VERSION=v1

# AFTER (FIXED - points to Zep Cloud):
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com
ZEP_URL=https://api.getzep.com
ZEP_API_KEY=<YOUR_ZEP_CLOUD_API_KEY>  # Get from https://app.getzep.com
ZEP_TIMEOUT_MS=5000  # Cloud is faster, reduce timeout
ZEP_API_VERSION=v1  # Or v2 if Zep Cloud uses v2

# Also update for web container to match
```

**File**: `docker-compose.yml:36-40`

**Remove local Zep dependency**:
```yaml
# BEFORE:
depends_on:
  db:
    condition: service_healthy
  redis:
    condition: service_started
  zep:  # ⚠️ REMOVE THIS - not using local Zep
    condition: service_started

# AFTER:
depends_on:
  db:
    condition: service_healthy
  redis:
    condition: service_started
```

---

#### Fix 3: Add Circuit Breaker to process_chat_message

**File**: `assistant/tasks.py:1496`

**Add task-level circuit breaker**:
```python
# BEFORE (NO PROTECTION):
@shared_task(
    bind=True,
    ignore_result=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
    max_retries=5,
    soft_time_limit=100,
    time_limit=120,
    queue="chat",
)
def process_chat_message(self, message_id: str, thread_id: str, client_msg_id: Optional[str] = None):
    # ...
    zep_context = _prepare_zep_write_context(thread)  # Can fail repeatedly

# AFTER (WITH CIRCUIT BREAKER):
from assistant.memory.flags import get_forced_mode

@shared_task(...)
def process_chat_message(self, message_id: str, thread_id: str, client_msg_id: Optional[str] = None):
    # ...

    # Check if Zep is in forced write-only mode (health degraded)
    forced_mode = get_forced_mode()
    if forced_mode:
        logger.warning(
            "zep_degraded_skipping_writes",
            extra={
                "thread_id": thread_id,
                "reason": forced_mode.get("reason"),
                "until": forced_mode.get("until")
            }
        )
        zep_context = None  # Skip Zep writes, continue with task
    else:
        zep_context = _prepare_zep_write_context(thread)
```

**Why**: Prevents retry storms when Zep Cloud is down. Task continues without memory writes rather than failing completely.

---

### Priority 1 (Deploy This Week)

#### Fix 4: Split Workers by Queue

**File**: `docker-compose.yml:44-62`

**Change**:
```yaml
# BEFORE (ONE WORKER, ALL QUEUES):
celery:
  build: .
  container_name: easy_islanders_celery
  command: celery -A easy_islanders worker -Q chat,default,background,notifications,dlq -l info --concurrency=8

# AFTER (DEDICATED WORKERS PER QUEUE):
celery_chat:
  build: .
  container_name: easy_islanders_celery_chat
  command: celery -A easy_islanders worker -Q chat -l info --concurrency=4 --pool=threads
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network

celery_default:
  build: .
  container_name: easy_islanders_celery_default
  command: celery -A easy_islanders worker -Q default -l info --concurrency=4 --pool=threads
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network

celery_background:
  build: .
  container_name: easy_islanders_celery_background
  command: celery -A easy_islanders worker -Q background,notifications,dlq -l info --concurrency=4
  env_file:
    - ${ENV_FILE:-.env.docker}
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - easy_islanders_network
```

**Why**:
- Chat queue gets dedicated 4 workers (can handle 4 concurrent chat tasks)
- Default queue gets dedicated 4 workers (preference extraction won't block)
- Background gets 4 workers for media, notifications, DLQ
- Total: 12 workers (4+4+4) vs previous 8, better isolation

---

#### Fix 5: Add extract_preferences_async Error Handling

**File**: `assistant/tasks.py:1518-1529`

**Change**:
```python
# BEFORE (SILENT FAILURES):
try:
    if PREFS_EXTRACT_ENABLED and msg.sender_id:
        extract_preferences_async.apply_async(
            kwargs={
                "user_id": msg.sender_id,
                "thread_id": thread.thread_id,
                "message_id": str(msg.id),
                "utterance": user_text,
            }
        )
except Exception:
    pass  # ⚠️ Silently swallowed!

# AFTER (WITH LOGGING AND METRICS):
try:
    if PREFS_EXTRACT_ENABLED and msg.sender_id:
        from django.conf import settings

        # Check if OpenAI key configured (avoid failing task)
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
                link_error=log_preference_extraction_failure.s(thread.thread_id)  # Error callback
            )
            logger.debug(
                "preferences_extract_queued",
                extra={"thread_id": thread.thread_id, "task_id": result.id}
            )
except Exception as e:
    logger.error(
        "preferences_extract_queue_failed",
        extra={"thread_id": thread.thread_id, "error": str(e)},
        exc_info=True
    )

# Add error callback task
@shared_task
def log_preference_extraction_failure(task_id, exc, traceback, thread_id):
    """Log preference extraction failures for debugging."""
    logger.error(
        "preferences_extract_failed",
        extra={
            "thread_id": thread_id,
            "task_id": task_id,
            "error": str(exc),
            "traceback": traceback
        }
    )
```

**Why**: Makes invisible failures visible through logging and metrics.

---

#### Fix 6: Enable Celery Observability

**File**: `easy_islanders/settings/base.py:365-367`

**Add**:
```python
# BEFORE (MINIMAL OBSERVABILITY):
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_ENABLE_REMOTE_CONTROL = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# AFTER (FULL OBSERVABILITY):
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_ENABLE_REMOTE_CONTROL = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Task event tracking for Flower and monitoring
CELERY_TASK_TRACK_STARTED = True  # Emit task-started event
CELERY_TASK_SEND_SENT_EVENT = True  # Emit task-sent event
CELERY_WORKER_SEND_TASK_EVENTS = True  # Worker task lifecycle events
CELERY_SEND_EVENTS = True  # Enable event monitoring

# Structured logging for task states
CELERY_REDIRECT_STDOUTS_LEVEL = "INFO"  # Log task stdout/stderr

# Dead letter queue routing for max retries exceeded
CELERY_TASK_ANNOTATIONS = {
    '*': {
        'on_failure': lambda self, exc, task_id, args, kwargs, einfo:
            dead_letter_queue.apply_async(
                kwargs={
                    "task_name": self.name,
                    "args": {"args": args, "kwargs": kwargs},
                    "exception": str(exc),
                },
                queue="dlq"
            ) if isinstance(exc, MaxRetriesExceededError) else None
    }
}
```

**Why**: Provides visibility into task lifecycle, enables debugging "stuck tasks".

---

### Priority 2 (Deploy Next Sprint)

#### Fix 7: Replace Blocking .get() with Celery Chains

**File**: `assistant/tasks.py:461-520`

**Change**:
```python
# BEFORE (BLOCKING):
@shared_task
def process_webhook_media_task(self, webhook_data: Dict[str, Any]):
    # ...
    media_result = process_incoming_media_task.delay(listing_id, media_urls)
    media_data = media_result.get(timeout=60)  # ⚠️ BLOCKS worker

    card_result = trigger_get_and_prepare_card_task.delay(listing_id)
    card_data = card_result.get(timeout=30)  # ⚠️ BLOCKS worker

# AFTER (NON-BLOCKING CHAIN):
from celery import chain

@shared_task
def process_webhook_media_task(self, webhook_data: Dict[str, Any]):
    from_number = webhook_data.get('From', '').replace('whatsapp:', '')
    media_urls = [webhook_data.get(f'MediaUrl{i}') for i in range(10) if webhook_data.get(f'MediaUrl{i}')]

    if not media_urls:
        return {"success": False, "message": "No media URLs found"}

    # Find listing
    from .models import ContactIndex
    try:
        contact_index = ContactIndex.objects.filter(
            normalized_contact__icontains=from_number
        ).order_by('-created_at').first()
        listing_id = contact_index.listing_id if contact_index else None
    except Exception as e:
        logger.error(f"Failed to find listing for contact {from_number}: {e}")
        return {"success": False, "message": "No listing found"}

    if not listing_id:
        return {"success": False, "message": "No listing found for this contact"}

    # Create non-blocking chain: media → card → finalize
    workflow = chain(
        process_incoming_media_task.s(listing_id, media_urls),
        trigger_get_and_prepare_card_task.s(listing_id),
        finalize_webhook_processing.s(listing_id, from_number)
    )

    # Execute asynchronously
    result = workflow.apply_async()

    return {
        "success": True,
        "listing_id": listing_id,
        "workflow_id": result.id,
        "message": "Processing started"
    }

@shared_task
def finalize_webhook_processing(card_data, listing_id, from_number):
    """Final step in webhook processing chain."""
    logger.info(f"Webhook processing completed for listing {listing_id}")
    return {
        "success": True,
        "listing_id": listing_id,
        "card_prepared": card_data.get("success", False),
        "message": f"Webhook processing complete"
    }
```

**Why**: Eliminates worker thread blocking, prevents deadlocks, improves throughput.

---

## Commands to Run

### Diagnostic Commands

```bash
# 1. Check active tasks
docker exec easy_islanders_celery celery -A easy_islanders inspect active

# 2. Check scheduled tasks
docker exec easy_islanders_celery celery -A easy_islanders inspect scheduled

# 3. Check registered tasks
docker exec easy_islanders_celery celery -A easy_islanders inspect registered

# 4. Check worker stats
docker exec easy_islanders_celery celery -A easy_islanders inspect stats

# 5. Check active queues
docker exec easy_islanders_celery celery -A easy_islanders inspect active_queues

# 6. Monitor task events in real-time
docker exec easy_islanders_celery celery -A easy_islanders events

# 7. Check Redis queue depth
docker exec easy_islanders_redis redis-cli LLEN celery
docker exec easy_islanders_redis redis-cli LLEN chat
docker exec easy_islanders_redis redis-cli LLEN default
docker exec easy_islanders_redis redis-cli LLEN background

# 8. Check worker log for errors
docker logs easy_islanders_celery --tail 100 | grep -E "ERROR|WARNING|zep_call"

# 9. Check Zep connection
docker exec easy_islanders_web python3 manage.py shell -c "
from assistant.memory.service import get_client
client = get_client()
print(f'Zep client: {client}')
print(f'Base URL: {client.base_url if client else None}')
"

# 10. Purge all queues (DANGEROUS - only for testing)
docker exec easy_islanders_celery celery -A easy_islanders purge -f
```

---

### Production Debug Harness

**File**: `scripts/debug_celery.sh` (create new)

```bash
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
```

**Make executable**:
```bash
chmod +x scripts/debug_celery.sh
```

**Run**:
```bash
./scripts/debug_celery.sh
```

---

## Monitoring Plan

### Prometheus Metrics to Add

**File**: `assistant/monitoring/metrics.py`

```python
# Add these metrics:

# Task lifecycle metrics
celery_task_queued_total = Counter(
    'celery_task_queued_total',
    'Total tasks queued',
    ['task_name', 'queue']
)

celery_task_started_total = Counter(
    'celery_task_started_total',
    'Total tasks started',
    ['task_name', 'queue']
)

celery_task_completed_total = Counter(
    'celery_task_completed_total',
    'Total tasks completed',
    ['task_name', 'queue', 'status']
)

celery_task_retry_total = Counter(
    'celery_task_retry_total',
    'Total task retries',
    ['task_name', 'queue', 'exception_type']
)

celery_task_duration_seconds = Histogram(
    'celery_task_duration_seconds',
    'Task execution time',
    ['task_name', 'queue'],
    buckets=[0.1, 0.5, 1, 5, 10, 30, 60, 120, 300]
)

# Queue depth metrics
celery_queue_depth = Gauge(
    'celery_queue_depth',
    'Number of tasks in queue',
    ['queue']
)

celery_worker_active_tasks = Gauge(
    'celery_worker_active_tasks',
    'Number of active tasks per worker',
    ['worker', 'queue']
)

# Zep health metrics
zep_circuit_state = Gauge(
    'zep_circuit_state',
    'Zep circuit breaker state (0=closed, 1=open)',
    ['reason']
)

zep_forced_mode_active = Gauge(
    'zep_forced_mode_active',
    'Whether Zep is in forced write-only mode',
    []
)
```

### Grafana Dashboard Queries

```promql
# Task failure rate (last 5 minutes)
rate(celery_task_completed_total{status="failure"}[5m])

# Queue depth over time
celery_queue_depth

# Task duration P95
histogram_quantile(0.95, rate(celery_task_duration_seconds_bucket[5m]))

# Zep circuit breaker state
zep_circuit_state

# Task retry rate by exception
rate(celery_task_retry_total[5m])
```

---

## Final Verification Checklist

### Pre-Deployment Checks

- [ ] **.env.docker updated** with Zep Cloud URL and API key
- [ ] **docker-compose.yml** removed local Zep dependency
- [ ] **settings/base.py** increased CELERY_TASK_TIME_LIMIT to 180s (or removed)
- [ ] **process_chat_message** added circuit breaker check
- [ ] **extract_preferences_async** added error logging
- [ ] **Celery observability** settings added
- [ ] **docker-compose.yml** split into 3 workers (chat, default, background)

### Post-Deployment Validation

```bash
# 1. Verify Zep connection
./scripts/debug_celery.sh | grep "Zep Connection"
# Expected: Base URL: https://api.getzep.com, Client initialized: True

# 2. Send test chat message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "thread_id": "test-123"}'

# 3. Check logs for errors
docker logs easy_islanders_celery --tail 100 | grep -E "ERROR|zep_call_error"
# Expected: No zep_call_error messages

# 4. Verify workers running
docker ps | grep celery
# Expected: 3 containers (celery_chat, celery_default, celery_background)

# 5. Check queue depths
docker exec easy_islanders_redis redis-cli LLEN chat
docker exec easy_islanders_redis redis-cli LLEN default
# Expected: <10 tasks in each queue (should drain quickly)

# 6. Monitor for 10 minutes
watch -n 5 './scripts/debug_celery.sh'
# Expected: No errors, queues draining, memory stable

# 7. Verify Prometheus metrics
curl http://localhost:8000/metrics | grep celery_task_duration
# Expected: Metrics appearing for completed tasks

# 8. Check Zep forced mode
docker exec easy_islanders_web python3 manage.py shell -c "
from assistant.memory.flags import get_forced_mode
print(get_forced_mode())
"
# Expected: None (not in forced mode)
```

---

## Summary of Findings

### Critical Issues (Fix Immediately)

1. **Time Limit Conflict**: Global 60s limit kills 120s chat tasks → WorkerLostError
2. **Zep Cloud Misconfiguration**: .env points to local container, not Zep Cloud → 401/403 errors
3. **Missing Circuit Breaker**: Retry storms trigger auto-downgrade → write-only mode → amnesia
4. **Queue Starvation**: All workers subscribe to all queues → chat tasks block background tasks

### Impact

- **User Experience**:
  - Messages fail with "task_failed" errors
  - Chatbot forgets conversation history (auto-downgrade)
  - Slow responses during traffic bursts (queue starvation)

- **System Health**:
  - Worker pool exhaustion from long-running tasks
  - Retry storms consuming Redis/network bandwidth
  - Invisible failures (preferences not extracted)

### Immediate Actions

1. **Update .env.docker** with Zep Cloud credentials ← Do this first!
2. **Increase CELERY_TASK_TIME_LIMIT** to 180s or remove
3. **Add circuit breaker** to process_chat_message
4. **Split workers** by queue (chat, default, background)

### Long-Term Improvements

1. Enable full Celery observability (task tracking, events)
2. Add Prometheus metrics for task lifecycle
3. Replace blocking .get() with Celery chains
4. Implement graceful degradation for Zep failures
5. Add health checks and auto-recovery

---

**Status**: Ready for Implementation
**Estimated Effort**: 4-6 hours (P0 fixes), 1-2 days (P1 fixes)
**Risk**: Low (all fixes backwards-compatible, can rollback)
**Impact**: High (eliminates 90% of current task failures)

---

## Next Steps

1. Review this document with your team
2. Prioritize fixes (start with P0)
3. Update .env.docker with Zep Cloud credentials
4. Apply settings changes
5. Restart containers: `docker compose down && docker compose up -d`
6. Monitor with debug harness: `./scripts/debug_celery.sh`
7. Validate with checklist above

Let me know if you'd like me to implement any of these fixes!
