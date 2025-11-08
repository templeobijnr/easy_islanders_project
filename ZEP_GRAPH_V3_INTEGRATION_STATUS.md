# Zep Graph v3 Integration Status

**Date:** 2025-11-08
**Status:** ⚠️ Partially Complete - Pending Zep Cloud SDK Investigation
**Priority:** P1 - High

---

## Summary

We've successfully updated the GraphManager to use the correct Zep Cloud SDK v3 API signatures, but are encountering 404 errors when making API calls. This document outlines what was completed, what's blocking progress, and next steps.

---

## ✅ Completed

### 1. GraphManager API Signature Updates

**File:** `assistant/memory/graph_manager.py`

**Changes Made:**
- ✅ Updated `add_fact_triplet()` to use correct v3 SDK parameters:
  - `fact`, `target_node_name`, `source_node_name`, `fact_name`
  - Removed incorrect `subject`, `predicate`, `object` parameters
  - Uses `valid_at`/`invalid_at` instead of `valid_from`/`valid_until`
- ✅ Fixed `store_user_preference()` to use supported parameters
- ✅ Added backward compatibility for deprecated parameters
- ✅ Updated documentation to reflect v3 API changes

**Correct API Call:**
```python
resp = self.client.graph.add_fact_triplet(
    fact="prefers_location",
    target_node_name="Girne",
    source_node_name="user_123",
    fact_name="User prefers location: Girne",
    user_id="user_123",  # or graph_id="..."
    valid_at=datetime.utcnow().isoformat()
)
```

###2. Environment Configuration

**File:** `.env.dev`

**Changes:**
- ✅ Enabled Graph Memory: `ENABLE_GRAPH_MEMORY=true`
- ✅ Set base URL: `ZEP_BASE_URL=https://api.getzep.com`
- ✅ Updated comments to reflect v3 API usage

### 3. Verification Scripts

**File:** `scripts/verify_graph_v3.py`

**Features:**
- ✅ Tests GraphManager initialization
- ✅ Tests graph creation
- ✅ Tests fact triplet addition
- ✅ Tests user preference storage
- ✅ Tests preference retrieval
- ✅ Tests metrics tracking
- ✅ Comprehensive error reporting

### 4. SDK Configuration

**Current SDK Version:** `zep-cloud==3.10.0` (from `requirements.txt`)

**Client Initialization:**
```python
from zep_cloud.client import Zep

self.client = Zep(
    api_key="z_...",
    base_url="https://api.getzep.com"
)
```

---

## ❌ Blocking Issues

### Issue 1: 404 Errors from Zep Cloud API

**Symptoms:**
```
status_code: 404
body: 404 page not found
server: cloudflare
```

**All API calls failing:**
- ✅ Graph creation: 404
- ❌ Add fact triplet: 404
- ❌ Store user preference: 404
- ✅ Search/retrieve: Works (returns empty results, no 404)

**Possible Causes:**

1. **Missing Project/Workspace ID in URL path**
   - Zep Cloud might require `/projects/{project_id}/graph/*` paths
   - Current SDK might not be appending project ID correctly

2. **Incorrect Base URL**
   - Might need project-specific endpoint like:
     `https://api.getzep.com/v1` or
     `https://{workspace}.api.getzep.com`

3. **Graph API Not Fully Released in Zep Cloud**
   - Graph v3 API might only be available in self-hosted Zep
   - Cloud version might still be in beta/preview

4. **SDK Version Mismatch**
   - `zep-cloud==3.10.0` might not support Graph API yet
   - Might need newer version or different SDK package

---

## 🔍 Investigation Needed

### Action 1: Verify SDK Method Signatures

**What to check:**
```python
from zep_cloud.graph.client import GraphClient
import inspect

# Check actual method signature
print(inspect.signature(GraphClient.add_fact_triple))

# Expected output shows:
# - fact, fact_name, target_node_name, source_node_name ✅
# - graph_id or user_id ✅
# - valid_at, invalid_at, expired_at ✅
```

**Status:** ✅ Verified - Signatures match

### Action 2: Check Zep Cloud Project Configuration

**What to check:**
1. Log in to Zep Cloud dashboard
2. Check if "Graph" feature is enabled for the project
3. Look for API documentation or examples in dashboard
4. Check if there's a project-specific base URL

**Status:** ⏳ Pending - Needs Zep Cloud dashboard access

### Action 3: Test with Minimal Example

**Create test script:**
```python
from zep_cloud.client import Zep
import os

client = Zep(api_key=os.getenv("ZEP_API_KEY"))

# Try to create a graph
try:
    graph = client.graph.create(
        graph_id="test_minimal",
        name="Test Graph",
        description="Minimal test"
    )
    print(f"Graph created: {graph}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Type: {type(e)}")
```

**Status:** ⏳ Pending

### Action 4: Check Zep Cloud SDK Documentation

**Resources to check:**
- Zep Cloud SDK docs: https://docs.getzep.com/sdk/
- Zep Graph API docs: https://docs.getzep.com/graphiti/
- GitHub repo: https://github.com/getzep/zep-cloud-python
- Release notes for v3.10.0

**Status:** ⏳ Pending

---

## 🎯 Next Steps

### Option A: Contact Zep Support

**Questions to ask:**
1. Is the Graph API available in Zep Cloud?
2. What's the correct base URL and endpoint structure?
3. Do we need to enable Graph API in the dashboard?
4. Are there any project-specific configuration requirements?

### Option B: Test with Self-Hosted Zep

**If Graph API is only available in self-hosted:**
1. Deploy Zep server locally with Docker
2. Test GraphManager against local Zep instance
3. Verify API endpoints and responses
4. Compare with Cloud API behavior

```bash
# Start Zep server
docker run -p 8000:8000 ghcr.io/getzep/zep:latest

# Update .env.dev
ZEP_BASE_URL=http://localhost:8000
```

### Option C: Use Alternative Implementation

**If Graph API unavailable in Cloud:**
1. Use Zep Session Memory + custom graph layer
2. Store graph facts in Django database with pgvector
3. Build custom graph query logic
4. Keep GraphManager interface for future migration

---

## 📊 Current Test Results

```
============================================================
TEST SUMMARY
============================================================
✅ PASS: Connection            (GraphManager initializes)
❌ FAIL: Add Fact Triplet      (404 error)
❌ FAIL: Store User Preference (404 error)
✅ PASS: Get User Preferences  (Returns empty, no crash)
✅ PASS: Metrics Tracking      (Circuit breaker works)

Total: 3/5 tests passed
```

---

## 🔧 Workaround (Temporary)

**Until Graph API is confirmed working:**

1. **Keep Graph Memory disabled** for production:
   ```bash
   ENABLE_GRAPH_MEMORY=false
   ```

2. **Use session memory only** for user preferences:
   - Store preferences in Zep Session Memory metadata
   - Use existing session context for personalization

3. **Implement preference extraction** in supervisor:
   ```python
   # In supervisor_graph.py
   def _extract_preferences_from_session(state):
       """Extract preferences from session metadata."""
       memory = state.get("zep_context", {})
       return memory.get("user_preferences", {})
   ```

4. **Add preferences to session metadata**:
   ```python
   # In real_estate_handler.py
   def _store_to_session(slots, thread_id):
       """Store slots to Zep session metadata."""
       zep_client.update_session_metadata(
           thread_id=thread_id,
           metadata={"user_preferences": slots}
       )
   ```

---

## 📚 Reference Implementation

### Working Session Memory Storage

**File:** `assistant/brain/zep_client.py`

```python
def store_preference_in_session(self, thread_id, preference_type, value):
    """Store preference in session metadata (v2 API)."""
    metadata = self.get_session_metadata(thread_id) or {}
    prefs = metadata.get("preferences", {})
    prefs[preference_type] = value
    metadata["preferences"] = prefs

    return self.update_session_metadata(thread_id, metadata)
```

### Alternative Graph Layer

**File:** `assistant/memory/django_graph.py` (new file)

```python
from real_estate.models import UserPreference

class DjangoGraphManager:
    """Graph memory using Django ORM + pgvector."""

    def store_user_preference(self, user_id, pref_type, value):
        """Store preference in database."""
        UserPreference.objects.update_or_create(
            user_id=user_id,
            preference_type=pref_type,
            defaults={"value": value}
        )

    def get_user_preferences(self, user_id):
        """Retrieve all preferences for user."""
        return list(UserPreference.objects.filter(
            user_id=user_id
        ).values("preference_type", "value"))
```

---

## 🎬 Conclusion

**Code Status:** ✅ Ready (API signatures fixed)
**Integration Status:** ⚠️ Blocked (404 errors)
**Blocker:** Need to verify Zep Cloud Graph API availability

**Recommended Action:**
1. Contact Zep support to confirm Graph API status in Cloud
2. Meanwhile, use session metadata workaround for preferences
3. Monitor Zep SDK releases for Graph API updates
4. Be ready to switch to self-hosted Zep if needed

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Next Review:** After Zep support response or SDK update
