# Zep Duplicate Clients - Critical Architecture Issue

**Date:** 2025-11-08
**Severity:** P0 - System Architecture Flaw
**Status:** Root Cause Identified

---

## 🚨 The Problem: Two Zep Clients Running Simultaneously

Your logs show **two completely separate Zep client implementations** making conflicting requests:

### Client #1: NEW HTTP Client ✅ (Working)
- **File:** [assistant/memory/zep_sdk_client.py](assistant/memory/zep_sdk_client.py)
- **Used By:** `assistant/tasks.py` (chat processing)
- **Endpoints:** `POST /api/v2/threads/{id}/messages` ✅ CORRECT
- **Logs:**
  ```
  {"message": "zep_http_client_initialized", "uses_direct_http": true}
  {"message": "zep_memory_added", "thread_id": "...", "status_code": 200}
  ```
- **Status:** ✅ Working perfectly

### Client #2: OLD Session Client ❌ (Failing)
- **File:** [assistant/brain/zep_client.py](assistant/brain/zep_client.py)
- **Used By:** `assistant/brain/supervisor_graph.py` (context persistence)
- **Endpoints:** `POST /v1/sessions/{id}` ❌ WRONG (deprecated)
- **Logs:**
  ```
  {"logger": "assistant.brain.zep_client", "message": "[ZEP] Client initialized (base=https://api.getzep.com, timeout=2s)"}
  {"message": "[ZEP] Session b2bd6478-... not found, creating it"}
  {"message": "[ZEP] create_session failed 404: 404 page not found"}
  {"message": "[ZEP] Circuit breaker OPEN after 5 failures"}
  ```
- **Status:** ❌ Broken, causing circuit breaker failures

---

## 📋 Where Each Client is Used

### NEW Client Usage (Task Processing)

**File:** [assistant/tasks.py](assistant/tasks.py)

```python
from assistant.memory.service import get_client  # ← Gets NEW client

def process_chat_message(message_id):
    # Write user message to Zep
    client = get_client()
    client.add_messages(thread_id, [
        {"role": "user", "content": user_message}
    ])

    # ... process chat ...

    # Write assistant response to Zep
    client.add_messages(thread_id, [
        {"role": "assistant", "content": assistant_response}
    ])
```

**What it does:**
- Stores user messages
- Stores assistant responses
- Uses correct `/api/v2/threads/` endpoints
- **Works perfectly**

### OLD Client Usage (Supervisor Graph)

**File:** [assistant/brain/supervisor_graph.py:38-48](assistant/brain/supervisor_graph.py#L38-L48)

```python
from .zep_client import ZepClient  # ← OLD client!

# Initialize OLD client at module level
_ZEP_CLIENT = ZepClient(
    base_url=os.getenv("ZEP_URL"),
    api_key=os.getenv("ZEP_API_KEY"),
    timeout=2.0,
)
```

**Used in 5 places:**

1. **Line 136**: `_write_turn_to_zep()` - Write conversation turns
   ```python
   _ZEP_CLIENT.add_memory(thread_id, role, content_clean)
   ```

2. **Line 240**: `_persist_search_summary()` - Archive search summaries
   ```python
   _ZEP_CLIENT.add_memory(session_id=thread_id, messages=[{...}])
   ```

3. **Line 329**: `_persist_booking_summary()` - Archive booking summaries
   ```python
   _ZEP_CLIENT.add_memory(session_id=thread, messages=[{...}])
   ```

4. **Line 809**: `_persist_collection_summary()` - Archive agent summaries
   ```python
   _ZEP_CLIENT.add_memory(thread_id=thread_id, role="system", content=summary)
   ```

5. **Line 938**: `_persist_snapshot()` - Archive context snapshots
   ```python
   _ZEP_CLIENT.add_memory(thread_id=thread_id, role="system", content=snapshot)
   ```

**What it does:**
- Tries to store summaries and snapshots
- Uses wrong `/v1/sessions/` endpoints
- **Fails with 404 errors, opens circuit breaker**

---

## 🔄 Memory Flow (How It's Supposed to Work)

### Step 1: User Sends Message
```
User: "I need an apartment close to the beach"
  ↓
assistant/tasks.py:process_chat_message()
  ↓
NEW Client: Add message to Zep
  POST /api/v2/threads/{id}/messages
  ✅ SUCCESS (status_code=200)
```

### Step 2: Fetch Context from Zep
```
assistant/brain/supervisor_graph.py:retrieve_context()
  ↓
assistant/memory/service.py:fetch_thread_context()
  ↓
NEW Client: Get recent messages
  GET /api/v2/threads/{id}/messages?lastn=10
  ✅ SUCCESS

Returns:
  {
    "context": "[user] I need an apartment close to the beach",
    "recent": [{"role": "user", "content": "..."}],
    "facts": []
  }
```

### Step 3: Process with Agent
```
Supervisor routes to real_estate_agent
  ↓
Agent generates response
  ↓
Response: "Got it! Is this for short-term or long-term rent?"
```

### Step 4: Write Response to Zep (NEW Client)
```
assistant/tasks.py:process_chat_message()
  ↓
NEW Client: Add assistant message
  POST /api/v2/threads/{id}/messages
  ✅ SUCCESS
```

### Step 5: Persist Snapshot (OLD Client) ❌ FAILS HERE
```
assistant/brain/supervisor_graph.py:_persist_snapshot()
  ↓
OLD Client: Try to create session first
  POST /v1/sessions/{id}  ❌ 404 Not Found
  ↓
Circuit breaker opens after 5 failures
```

---

## 🐛 Why This Causes "Clunky" Behavior

### Issue 1: Duplicate Memory Writes
- NEW client writes user/assistant messages ✅
- OLD client TRIES to write summaries/snapshots ❌
- Result: Memory is written once (good) but snapshots fail (bad)

### Issue 2: Context Retrieval Works BUT Snapshots Don't
- **Retrieval:** Uses NEW client → works ✅
- **Snapshot persistence:** Uses OLD client → fails ❌
- Result: Recent messages work, but historical summaries are lost

### Issue 3: Circuit Breaker Spam
- OLD client fails repeatedly
- Opens circuit breaker every 5 failures
- Logs flooded with errors
- Result: Log noise, degraded performance

### Issue 4: Confusion About What's in Zep
Looking at your logs:
```
[b2bd6478-...] Context fusion: 2 parts, 366 chars (summary=no, retrieved=no, recent=0 turns)
```

**Wait - `recent=0 turns`? But we just added messages!**

This suggests:
- NEW client writes messages ✅
- But when fetching context, it shows `recent=0`
- This might be because context fetch is timing-based (messages not yet processed by Zep)

---

## 📊 Current vs Expected Behavior

| Component | Current (Broken) | Expected (Fixed) |
|-----------|------------------|------------------|
| **User Message Write** | NEW client → `/threads/` ✅ | NEW client → `/threads/` ✅ |
| **Assistant Message Write** | NEW client → `/threads/` ✅ | NEW client → `/threads/` ✅ |
| **Context Retrieval** | NEW client → `/threads/` ✅ | NEW client → `/threads/` ✅ |
| **Snapshot Persistence** | OLD client → `/sessions/` ❌ | NEW client → `/threads/` ✅ |
| **Summary Archive** | OLD client → `/sessions/` ❌ | NEW client → `/threads/` ✅ |
| **Turn Writes** | OLD client → `/sessions/` ❌ | NEW client → `/threads/` ✅ |
| **Circuit Breaker** | Opens every 5 failures | Never opens (all success) |

---

## 🔧 The Fix: Consolidate to Single Client

### Option 1: Update Supervisor to Use NEW Client (Recommended)

**File:** [assistant/brain/supervisor_graph.py](assistant/brain/supervisor_graph.py)

**Change Line 38:**
```python
# BEFORE
from .zep_client import ZepClient  # OLD client

# AFTER
from assistant.memory.service import get_client as get_zep_client
```

**Update all usages:**
```python
# BEFORE (Line 48)
_ZEP_CLIENT = ZepClient(base_url=..., api_key=...)

# AFTER
_ZEP_CLIENT = None  # Will initialize on first use

def _get_zep_client():
    """Lazy initialization of Zep client."""
    global _ZEP_CLIENT
    if _ZEP_CLIENT is None:
        _ZEP_CLIENT = get_zep_client()
    return _ZEP_CLIENT
```

**Update all `_ZEP_CLIENT.add_memory()` calls:**
```python
# BEFORE (Line 136)
_ZEP_CLIENT.add_memory(thread_id, role, content_clean)

# AFTER
client = _get_zep_client()
if client:
    client.add_messages(thread_id, [{
        "role": role,
        "content": content_clean
    }])
```

### Option 2: Delete OLD Client Entirely

**Steps:**
1. Apply Option 1 fixes
2. Delete `assistant/brain/zep_client.py` (no longer needed)
3. Remove old imports

---

## 🎯 Expected Results After Fix

**Logs BEFORE (Duplicate Clients):**
```
✅ zep_http_client_initialized (NEW client)
✅ zep_memory_added (NEW client writes message)
❌ [ZEP] Client initialized (OLD client)
❌ [ZEP] Session not found, creating it (OLD client)
❌ [ZEP] create_session failed 404 (OLD client)
❌ [ZEP] Circuit breaker OPEN (OLD client)
```

**Logs AFTER (Single Client):**
```
✅ zep_http_client_initialized (NEW client)
✅ zep_memory_added (user message)
✅ zep_memory_added (assistant message)
✅ zep_memory_added (system snapshot)
✅ Context fusion: recent=2 turns (messages visible)
```

---

## 📝 Action Plan

1. ✅ **Diagnose issue** (Complete - this document)
2. ⏳ **Update supervisor_graph.py** to use NEW client
3. ⏳ **Test supervisor persistence** works with NEW client
4. ⏳ **Delete OLD client** (`assistant/brain/zep_client.py`)
5. ⏳ **Rebuild Docker containers**
6. ⏳ **Verify logs** show single client only

---

## 🚨 Why `recent=0 turns` Even Though Messages Added

Looking at this log:
```
{"message": "zep_memory_added", "thread_id": "b2bd6478-...", "message_count": 2}
[b2bd6478-...] Context fusion: recent=0 turns
```

**Possible causes:**
1. **Timing:** Context fetch happens BEFORE messages are indexed by Zep
2. **Different thread IDs:** Messages written to one thread, fetched from another
3. **Zep processing delay:** Messages stored but not yet available for retrieval

**Solution:** Add small delay or retry logic when fetching context after write

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Next Action:** Update supervisor_graph.py to use single client
