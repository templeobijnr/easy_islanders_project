# Zep Client Failures & Process Chat None - Root Cause Analysis

**Date:** 2025-11-08
**Status:** 🔍 **DIAGNOSIS COMPLETE** - Fix Required
**Priority:** P0 - Critical

---

## 🐛 Three Critical Issues Identified

### Issue 1: Zep Session Memory API Failures ❌

**Symptoms from Logs:**
```
zep_http_status_unexpected (multiple occurrences)
zep_session_not_found_creating
zep_session_creation_failed
```

**Root Cause:**
The `ZEP_BASE_URL` was changed from `https://api.getzep.com` to `https://api.getzep.com/api/v2` to fix **Graph API** endpoints, but this **breaks Session Memory API**.

**Why:**
- **Session Memory API:** `https://api.getzep.com/v1/sessions/*` ✅
- **Graph Memory API:** `https://api.getzep.com/api/v2/graph/*` ✅

But with `ZEP_BASE_URL=https://api.getzep.com/api/v2`, Session Memory tries:
- ❌ `https://api.getzep.com/api/v2/v1/sessions/*` (WRONG! 404/401)

**Impact:**
- ❌ All session memory operations fail
- ❌ No conversation context persisted
- ❌ User preferences not stored
- ❌ Agent can't access conversation history

---

### Issue 2: Process Chat Returns None ❌

**Symptoms from Logs:**
```
Task assistant.tasks.process_chat_message[...] succeeded in 16.872s: None
```

**Root Cause:**
The `process_chat_message` function in `assistant/tasks.py` returns `None` instead of a structured response.

**Why:**
We fixed this in the codebase (lines 1719, 1765) but **Docker containers haven't been rebuilt** with the new code.

**Impact:**
- ❌ Celery task logs show `None` instead of response details
- ❌ No metrics/monitoring data available
- ⚠️ WebSocket emission still works (so frontend gets responses), but monitoring is blind

---

### Issue 3: WebSocket 403 Forbidden ❌

**Symptoms from Logs:**
```
ws_connect_rejected
connection rejected (403 Forbidden)
```

**Root Cause:**
WebSocket authentication token validation failing.

**Possible Causes:**
1. JWT token expired or invalid
2. CORS configuration issue for WebSocket origin
3. Django Channels authentication middleware rejecting token

---

## 🔧 **THE FIX**

### Solution: Separate Base URLs for Session Memory vs Graph Memory

**Current (BROKEN):**
```bash
# .env.dev
ZEP_BASE_URL=https://api.getzep.com/api/v2  ← Wrong for Session Memory!
```

**Correct Configuration:**
```bash
# .env.dev
ZEP_BASE_URL=https://api.getzep.com           ← Session Memory base
ZEP_GRAPH_BASE_URL=https://api.getzep.com/api/v2  ← Graph Memory base (new)
```

---

## 📋 Implementation Plan

### Step 1: Update Environment Variables

**File:** `.env.dev`
```bash
# Zep Memory Configuration
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com              ← REVERTED for Session Memory
ZEP_URL=https://api.getzep.com
ZEP_API_KEY=z_1dWlkIjoiYzIzYTBhZTItMzJkOC00ZGUzLWE2MzUtYTM3Njc5YTY3M2Q2In0.zNtzG2lU0A-NqooD5uAw-5X5cGwBvgs3SX1L8rssDyeshBaBUZa5AM3CHFt4kqSkW1HS1KhXEyKwJfIO1Lu38w
ZEP_TIMEOUT_MS=10000
FLAG_ZEP_WRITE=true
FLAG_ZEP_READ=true

# Graph Memory Configuration (Phase 3)
ENABLE_GRAPH_MEMORY=true
ZEP_GRAPH_BASE_URL=https://api.getzep.com/api/v2  ← NEW: Separate for Graph
```

**File:** `.env.local` (same changes)

---

### Step 2: Update GraphManager to Use Separate Base URL

**File:** `assistant/memory/graph_manager.py`

**Change line 186:**
```python
# BEFORE
base_url = base_url or os.getenv("ZEP_BASE_URL")

# AFTER
base_url = base_url or os.getenv("ZEP_GRAPH_BASE_URL") or os.getenv("ZEP_BASE_URL")
```

**Update docstring (line 173):**
```python
Args:
    api_key: Zep API key (default: from ZEP_API_KEY env)
    base_url: Zep Graph base URL (default: from ZEP_GRAPH_BASE_URL or ZEP_BASE_URL env)
    enable_circuit_breaker: Enable circuit breaker for fault tolerance
```

---

### Step 3: Rebuild Docker Containers

**Why:** Pick up new code changes and environment variables

```bash
# Stop containers
docker compose down

# Rebuild with no cache (ensures new code is included)
docker compose build --no-cache

# Start containers
docker compose up -d

# Watch logs
docker compose logs -f celery_chat
```

---

### Step 4: Verify Session Memory Works

**Test Session Creation:**
```python
# In Django shell (docker compose exec web python manage.py shell)
from assistant.memory.service import get_zep_client

client = get_zep_client()
print(f"Base URL: {client.base_url}")  # Should be: https://api.getzep.com

# Try to get session (should create if not exists)
context = client.get_context("test_thread_id")
print(f"Success: {context is not None}")
```

**Expected Output:**
```
Base URL: https://api.getzep.com
Success: True
```

**Check Logs:**
```bash
docker compose logs celery_chat | grep zep_session

# Should see:
# ✅ zep_session_created (not zep_session_creation_failed)
```

---

### Step 5: Verify Graph Memory Works

**Test Graph API:**
```python
# In Django shell
from assistant.memory.graph_manager import get_graph_manager

gm = get_graph_manager()
print(f"Graph Base URL: {gm.client._client_wrapper._base_url}")
# Should be: https://api.getzep.com/api/v2

# Try to list graphs
graphs = gm.client.graph.list_all()
print(f"Graphs: {len(graphs.graphs) if hasattr(graphs, 'graphs') else 0}")
```

**Expected Output:**
```
Graph Base URL: https://api.getzep.com/api/v2
Graphs: <number> (no 404 error)
```

---

### Step 6: Verify Process Chat Returns Structured Response

**Test Chat Flow:**
```bash
# Send test message via API
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"message": "Test message", "thread_id": "test_123"}'

# Check Celery logs
docker compose logs celery_chat | tail -20

# Should see:
# ✅ Task process_chat_message[...] succeeded in Xs: {'response_text': '...', 'agent': '...', ...}
# NOT: Task process_chat_message[...] succeeded in Xs: None
```

---

### Step 7: Fix WebSocket 403 (If Still Failing)

**Check Django Channels Consumer:**

**File:** `assistant/consumers.py`

Look for authentication logic:
```python
async def connect(self):
    # Check token validation
    token = self.scope.get("url_route", {}).get("kwargs", {}).get("token")
    # ... validation logic ...
```

**Possible Fixes:**
1. **Update token validation** to accept query param format
2. **Check CORS settings** for WebSocket origin
3. **Verify JWT token** hasn't expired

---

## 🧪 End-to-End Verification

### Test Complete Flow:

```bash
# 1. Restart containers
docker compose down && docker compose build --no-cache && docker compose up -d

# 2. Send test message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "I want a beach apartment in Girne", "thread_id": "test_e2e"}'

# 3. Check logs
docker compose logs -f celery_chat | grep -E "zep_session|process_chat_message.*succeeded"

# Expected:
# ✅ zep_session_created (or zep_context fetched)
# ✅ Task process_chat_message[...] succeeded: {'response_text': '...', ...}
```

---

## 📊 Success Criteria

| Check | Before | After |
|-------|--------|-------|
| Session Memory API | ❌ 401/404 errors | ✅ 200 OK |
| Graph Memory API | ❌ 404 errors | ✅ 200 OK (with auth) |
| Process Chat Return | ❌ `None` | ✅ `{'response_text': ...}` |
| WebSocket Connection | ❌ 403 Forbidden | ✅ 200 OK |
| Chat Flow E2E | ❌ Broken | ✅ Working |

---

## 🔄 Rollback Plan

If issues persist:

```bash
# Revert .env changes
git checkout .env.dev .env.local

# Revert code changes
git checkout assistant/memory/graph_manager.py assistant/tasks.py

# Rebuild
docker compose down && docker compose build --no-cache && docker compose up -d
```

---

## 📝 Files to Modify

1. ✅ `.env.dev` - Add `ZEP_GRAPH_BASE_URL`, revert `ZEP_BASE_URL`
2. ✅ `.env.local` - Same as above
3. ✅ `assistant/memory/graph_manager.py` - Use `ZEP_GRAPH_BASE_URL`
4. ✅ `assistant/tasks.py` - Already fixed (just needs Docker rebuild)
5. ⏳ `assistant/consumers.py` - WebSocket auth (if needed)

---

## ⏱️ Estimated Time

- **Config updates:** 5 minutes
- **Code changes:** 10 minutes
- **Docker rebuild:** 5-10 minutes
- **Testing:** 15 minutes
- **Total:** ~30-40 minutes

---

**Next Action:** Implement Step 1 (update environment variables)

**Document Version:** 1.0
**Last Updated:** 2025-11-08
