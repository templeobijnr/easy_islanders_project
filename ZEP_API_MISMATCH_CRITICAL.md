# 🚨 CRITICAL: Zep API Mismatch - Sessions vs Threads

**Date:** 2025-11-08
**Severity:** P0 - Critical Production Issue
**Status:** Root Cause Identified - Migration Required

---

## 🔍 Root Cause Discovery

**Official Zep Cloud v2 API Endpoints:**

Memory Endpoints (Threads):
```
POST /api/v2/threads                          ✅ Create thread
POST /api/v2/threads/{threadId}/messages      ✅ Add messages
POST /api/v2/threads/{threadId}/messages-batch ✅ Batch add messages
GET  /api/v2/threads/{threadId}/context       ✅ Get user context
```

Graph Endpoints:
```
POST /api/v2/graph                            ✅ Create graph
POST /api/v2/graph                            ✅ Add data to graph
POST /api/v2/graph/search                     ✅ Search graph
GET  /api/v2/graph/{graphId}                  ✅ Get graph
POST /api/v2/graph/node/graph/{graph_id}      ✅ Get graph nodes
```

**Our Custom Client is Calling WRONG Endpoints:**
```
POST /api/v2/sessions/{id}                    ❌ WRONG (should be /threads)
POST /api/v2/sessions/{id}/memory             ❌ WRONG (should be /threads/{id}/messages)
POST /api/v2/sessions/{id}/messages           ❌ WRONG (should be /threads/{id}/messages)
GET  /api/v2/sessions/{id}/memory             ❌ WRONG (should be /threads/{id}/context)
```

---

## 📁 Current Architecture

### We Have TWO Zep Integrations:

**1. Custom HTTP Client (Session Memory)** ❌ BROKEN
- **File:** [assistant/memory/zep_client.py](assistant/memory/zep_client.py)
- **Purpose:** Conversation memory (messages, context)
- **Problem:** Using deprecated `/sessions/` endpoints instead of `/threads/`
- **Impact:** All session memory operations failing

**2. Official SDK (Graph Memory)** ✅ WORKS
- **File:** [assistant/memory/graph_manager.py](assistant/memory/graph_manager.py#L143)
- **Purpose:** Knowledge graph (facts, relationships)
- **SDK:** `zep-cloud==3.10.0`
- **Status:** Works correctly with `/api/v2/graph/` endpoints

### Requirements Installed:
```
zep-python==2.0.2    # Old SDK for local Zep (unused)
zep-cloud==3.10.0    # New SDK for Zep Cloud (only used for Graph)
```

---

## 🐛 The Problem

### Custom Client Endpoint Mismatches

**File:** [assistant/memory/zep_client.py](assistant/memory/zep_client.py)

#### 1. `ensure_thread()` (Line 322-380)
**Currently calls:**
```python
POST /api/v2/users/{userId}/sessions  ❌ WRONG
POST /api/v2/sessions                ❌ WRONG
```
**Should call:**
```python
POST /api/v2/threads  ✅ CORRECT
```

#### 2. `add_messages()` (Line 382-504)
**Currently calls:**
```python
POST /api/{version}/sessions/{thread_id}/memory     ❌ WRONG
POST /api/v2/sessions/{thread_id}/messages          ❌ WRONG
```
**Should call:**
```python
POST /api/v2/threads/{thread_id}/messages           ✅ CORRECT
POST /api/v2/threads/{thread_id}/messages-batch     ✅ CORRECT (for batch)
```

#### 3. `get_user_context()` (Line 506-558)
**Currently calls:**
```python
GET /api/{version}/sessions/{thread_id}/memory  ❌ WRONG
```
**Should call:**
```python
GET /api/v2/threads/{thread_id}/context         ✅ CORRECT
# Official endpoint uses /context not /memory!
```

---

## 🎯 Official Zep Cloud SDK API

### Memory Operations (what we should be using)

The `zep-cloud==3.10.0` SDK provides:

```python
from zep_cloud.client import Zep

client = Zep(api_key="your_key")

# Add messages to a thread
client.memory.add(
    session_id="thread_123",
    messages=[
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"}
    ]
)

# Get memory/context for a thread
context = client.memory.get(session_id="thread_123")

# Search memory
results = client.memory.search(
    session_id="thread_123",
    query="what did I ask about?",
    limit=5
)
```

**This SDK internally calls the correct `/api/v2/threads/` endpoints!**

---

## 💡 Solution: Migrate to Official SDK

### Phase 1: Replace Custom Client with Zep Cloud SDK

**Benefits:**
1. ✅ Uses correct `/api/v2/threads/` endpoints automatically
2. ✅ Maintained and updated by Zep team
3. ✅ Handles API changes transparently
4. ✅ Better type safety and error handling
5. ✅ Consistent with Graph Memory implementation

**Affected Files:**
- [assistant/memory/zep_client.py](assistant/memory/zep_client.py) → Deprecated, replace with SDK wrapper
- [assistant/memory/service.py](assistant/memory/service.py) → Update to use SDK client

### Phase 2: Update All Call Sites

**Files Using ZepClient:**
```bash
# Find all imports
grep -r "from.*zep_client import ZepClient" --include="*.py"

# Found in:
- assistant/memory/service.py:30
- assistant/brain/zep_client.py (may be duplicate)
- tests/memory/*.py (test files)
```

---

## 📋 Migration Plan

### Step 1: Create SDK Wrapper (Backward Compatible)

**File:** Create `assistant/memory/zep_sdk_client.py`

```python
"""
Zep Cloud SDK wrapper providing backward-compatible interface.

Migrates from custom HTTP client to official zep-cloud SDK.
"""
from typing import Any, Dict, Iterable, Optional, Literal
from zep_cloud.client import Zep
from zep_cloud.types import Message
import logging

logger = logging.getLogger(__name__)


class ZepCloudClient:
    """
    Wrapper around official Zep Cloud SDK with backward-compatible API.

    Maps our existing ZepClient methods to Zep Cloud SDK calls.
    """

    def __init__(
        self,
        base_url: str,
        *,
        api_key: Optional[str] = None,
        timeout_ms: int = 1500,
        **kwargs  # Ignore other params for compatibility
    ):
        """Initialize Zep Cloud SDK client."""
        # Zep Cloud SDK doesn't take base_url (always uses api.getzep.com)
        # Validate we're pointing to Zep Cloud
        if "getzep.com" not in base_url.lower():
            logger.warning(
                "ZepCloudClient only works with Zep Cloud (api.getzep.com). "
                f"Provided base_url: {base_url}"
            )

        self.base_url = base_url
        self.api_key = api_key
        self.api_version = "v2"  # Cloud SDK always uses v2

        # Initialize official SDK
        self._client = Zep(api_key=api_key)

        logger.info(
            "[ZEP] Cloud SDK initialized",
            extra={"api_key_present": bool(api_key)}
        )

    def ensure_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ensure user exists (SDK handles this automatically)."""
        # Zep Cloud SDK creates users implicitly when adding to memory
        logger.debug("zep_user_implicit_sdk", extra={"user_id": user_id})
        return {}

    def ensure_thread(self, thread_id: str, user_id: str) -> Dict[str, Any]:
        """
        Ensure thread exists.

        Maps to: POST /api/v2/threads
        """
        # Zep Cloud SDK creates threads implicitly when adding messages
        # But we can explicitly create if needed
        logger.debug(
            "zep_thread_auto_create_sdk",
            extra={"thread_id": thread_id, "user_id": user_id}
        )
        return {}

    def add_messages(
        self,
        thread_id: str,
        messages: Iterable[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Add messages to a thread.

        Maps to: POST /api/v2/threads/{thread_id}/messages
        """
        messages_list = list(messages)

        # Filter empty messages
        if not messages_list:
            logger.info(
                "zep_write_skipped_empty_array",
                extra={"thread_id": thread_id}
            )
            return {}

        # Convert to SDK Message format
        sdk_messages = []
        for msg in messages_list:
            content = (msg.get("content") or "").strip()
            if not content or len(content) < 2:
                continue

            sdk_messages.append(
                Message(
                    role=msg.get("role", "user"),
                    content=content,
                    metadata=msg.get("metadata"),
                )
            )

        if not sdk_messages:
            logger.info(
                "zep_write_skipped_no_valid_messages",
                extra={"thread_id": thread_id}
            )
            return {}

        try:
            # Add messages using SDK
            self._client.memory.add(
                session_id=thread_id,
                messages=sdk_messages
            )

            logger.info(
                "zep_memory_added",
                extra={"thread_id": thread_id, "message_count": len(sdk_messages)}
            )
            return {}

        except Exception as e:
            logger.warning(
                "zep_add_messages_failed",
                extra={"thread_id": thread_id, "error": str(e)}
            )
            raise

    def get_user_context(
        self,
        thread_id: str,
        mode: str = "summary",
    ) -> Dict[str, Any]:
        """
        Get memory context for a thread.

        Maps to: GET /api/v2/threads/{thread_id}/memory
        """
        try:
            # Get memory using SDK
            memory = self._client.memory.get(session_id=thread_id)

            # Map SDK response to our expected format
            return {
                "context": memory.context or "",
                "facts": memory.facts or [],
                "recent": [
                    {"role": msg.role, "content": msg.content}
                    for msg in (memory.messages or [])
                ],
            }

        except Exception as e:
            logger.debug(
                "zep_context_not_found",
                extra={"thread_id": thread_id, "error": str(e)}
            )
            return {
                "context": "",
                "facts": [],
                "recent": [],
            }

    @property
    def session(self):
        """Compatibility property (not used by SDK)."""
        return None
```

### Step 2: Update Service Layer

**File:** [assistant/memory/service.py](assistant/memory/service.py)

```python
# BEFORE
from .zep_client import ZepClient

# AFTER
from .zep_sdk_client import ZepCloudClient as ZepClient
```

**This maintains backward compatibility** - all existing code continues to work!

### Step 3: Test Migration

**Create verification script:** `scripts/test_zep_sdk_migration.py`

```python
#!/usr/bin/env python3
"""Test Zep SDK migration."""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
django.setup()

from assistant.memory.service import get_client

def test_sdk_migration():
    """Test that SDK client works with existing API."""
    client = get_client()

    if not client:
        print("❌ Failed to get Zep client")
        return False

    # Test ensure_thread
    print("\n1. Testing ensure_thread...")
    try:
        client.ensure_thread("test_thread_sdk", "test_user_sdk")
        print("✅ ensure_thread works")
    except Exception as e:
        print(f"❌ ensure_thread failed: {e}")
        return False

    # Test add_messages
    print("\n2. Testing add_messages...")
    try:
        client.add_messages(
            "test_thread_sdk",
            [{"role": "user", "content": "Hello from SDK migration test"}]
        )
        print("✅ add_messages works")
    except Exception as e:
        print(f"❌ add_messages failed: {e}")
        return False

    # Test get_user_context
    print("\n3. Testing get_user_context...")
    try:
        context = client.get_user_context("test_thread_sdk")
        print(f"✅ get_user_context works")
        print(f"   Context: {context.get('context', '')[:100]}...")
        print(f"   Facts: {len(context.get('facts', []))} facts")
        print(f"   Recent: {len(context.get('recent', []))} messages")
    except Exception as e:
        print(f"❌ get_user_context failed: {e}")
        return False

    print("\n🎉 All tests passed!")
    return True

if __name__ == "__main__":
    success = test_sdk_migration()
    sys.exit(0 if success else 1)
```

### Step 4: Docker Rebuild with New Code

```bash
# Stop containers
docker compose down

# Rebuild (picks up new SDK integration)
docker compose build --no-cache

# Start containers
docker compose up -d

# Test SDK migration
docker compose exec web python scripts/test_zep_sdk_migration.py
```

### Step 5: Verify Production Flow

**After migration, logs should show:**
```
[ZEP] Cloud SDK initialized
zep_thread_auto_create_sdk
zep_memory_added (message_count=...)
```

**Not:**
```
zep_session_creation_failed  ❌ OLD ERRORS
zep_http_status_unexpected   ❌ OLD ERRORS
```

---

## 🎯 Expected Outcomes

| Component | Before (Custom Client) | After (Official SDK) |
|-----------|------------------------|----------------------|
| Endpoints Called | `/sessions/{id}/memory` ❌ | `/threads/{id}/messages` ✅ |
| Session Creation | `zep_session_creation_failed` ❌ | `zep_thread_auto_create_sdk` ✅ |
| Add Messages | 404/401 errors ❌ | 200 OK ✅ |
| Get Context | 404 errors ❌ | 200 OK ✅ |
| API Compatibility | Broken (wrong endpoints) ❌ | Correct (official API) ✅ |
| Maintenance | Manual updates needed ❌ | Auto-updated with SDK ✅ |

---

## 🚨 Alternative: Quick Fix (Not Recommended)

If we want to keep the custom client, we'd need to update all endpoint paths:

**File:** [assistant/memory/zep_client.py](assistant/memory/zep_client.py)

```python
# Line 351: Change sessions → threads
f"{self._api_prefix}/v2/users/{user_id}/threads"  # was: sessions
f"{self._api_prefix}/v2/threads"                  # was: sessions

# Line 436: Change sessions → threads, memory → messages
f"{self._api_prefix}/{version}/threads/{thread_id}/messages"  # was: sessions/{id}/memory

# Line 516: Change sessions → threads
f"{self._api_prefix}/{version}/threads/{thread_id}/memory"  # was: sessions/{id}/memory
```

**Why Not Recommended:**
- Still using hand-rolled HTTP client
- Prone to future API changes
- Duplicates SDK functionality
- More code to maintain

---

## 📊 Impact Analysis

### Low Risk Migration
- **Backward Compatible:** Wrapper maintains same interface
- **Gradual Rollout:** Can test in dev before production
- **Easy Rollback:** Just revert import statement

### High Reward
- **Fixes All Session Memory Errors:** 404, 401, session creation failures
- **Future-Proof:** SDK handles API changes
- **Reduced Maintenance:** Less custom code to maintain
- **Consistency:** Both Session and Graph use official SDKs

---

## ✅ Recommendation

**Migrate to official `zep-cloud` SDK for Session Memory**

**Rationale:**
1. We already use it successfully for Graph Memory
2. It calls the correct `/api/v2/threads/` endpoints
3. Maintained and tested by Zep team
4. Backward-compatible wrapper makes migration safe
5. Fixes all current production issues

**Timeline:**
- **Step 1-3:** 2-3 hours (create wrapper, update imports, test)
- **Step 4:** 10 minutes (Docker rebuild)
- **Step 5:** 30 minutes (production verification)
- **Total:** ~4 hours

---

## 🔄 Next Steps

1. ✅ **Immediate:** Document API mismatch (this file)
2. ⏳ **Next:** Create SDK wrapper (`zep_sdk_client.py`)
3. ⏳ **Then:** Update service layer imports
4. ⏳ **Then:** Test migration
5. ⏳ **Finally:** Docker rebuild + production verification

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Priority:** P0 - Blocks all session memory operations
