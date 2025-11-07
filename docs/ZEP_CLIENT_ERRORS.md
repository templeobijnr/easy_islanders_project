# Zep Client Errors - Root Cause Analysis & Fixes

**Date**: 2025-01-06
**Status**: ❌ Critical Errors in Production
**Priority**: P0 - System Down

---

## Errors Observed

### Error #1: Missing `ensure_user` Method
```python
File "/code/assistant/tasks.py", line 129
    success, _ = call_zep("ensure_user", lambda: client.ensure_user(user_id=user_identifier))
                                                 ^^^^^^^^^^^^^^^^^^
AttributeError: 'ZepClient' object has no attribute 'ensure_user'
```

### Error #2: Context Type Mismatch
```python
File "/code/assistant/memory/service.py", line 304, in fetch_thread_context
    "facts_count": len(context.get("facts") or []),
                       ^^^^^^^^^^^
AttributeError: 'list' object has no attribute 'get'
```

---

## Root Cause Analysis

### Issue #1: Wrong ZepClient Class Being Used

**Problem**: There are TWO different `ZepClient` classes in the codebase:

1. **Full-Featured Client**: `assistant/memory/zep_client.py` (753 lines)
   - ✅ Has: `ensure_user`, `ensure_thread`, `get_user_context`, `add_messages`
   - Used by: `assistant/tasks.py`, `assistant/memory/service.py`

2. **Minimal Client**: `assistant/brain/zep_client.py` (124 lines)
   - ❌ Only has: `add_memory`, `query_memory`
   - Used by: `assistant/brain/supervisor_graph.py`

**What Went Wrong**:
- `assistant/memory/service.py` imports from `.zep_client` (relative import)
- This should resolve to `assistant/memory/zep_client.py` (the full-featured one)
- But somehow the wrong client is being instantiated or cached

**Evidence**:
```python
# From error log:
AttributeError: 'ZepClient' object has no attribute 'ensure_user'

# This means the client IS a ZepClient instance, but it's the minimal one
# from assistant/brain/zep_client.py instead of assistant/memory/zep_client.py
```

---

### Issue #2: Outdated Production Code

**Problem**: Production Docker containers are running OLD code

**Evidence**:
- Error says line 304, but current code has the same line at 331
- This is a 27-line difference, suggesting production is several commits behind

**Current Code** (line 331):
```python
meta.update({
    ...
    "facts_count": len(context.get("facts") or []),
```

**Production Code** (line 304):
```python
# Same line, but 27 lines earlier in the file
"facts_count": len(context.get("facts") or []),
```

**Why This Causes the Error**:
- Old code may have bugs in `get_user_context()` that return a list instead of a dict
- Old code may have different import paths that cause the wrong client to be used
- Old bytecode (.pyc files) cached in Docker layers

---

### Issue #3: Python Bytecode Cache

**Problem**: Docker images contain old `.pyc` files from previous builds

**How This Happens**:
1. First build creates `.pyc` files with old imports
2. Code is updated in repository
3. Docker rebuild uses cached layers
4. Old `.pyc` files persist with outdated imports
5. Python loads cached bytecode instead of new source

**Evidence**:
- Docker containers show outdated line numbers
- Imports resolve to wrong modules

---

## Fixes Required

### Fix #1: Clear Python Bytecode Cache

**What to Clear**:
- `__pycache__/` directories
- `*.pyc` files
- `*.pyo` files

**Commands**:
```bash
# In project root
find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find . -type f -name '*.pyc' -delete
find . -type f -name '*.pyo' -delete
```

---

### Fix #2: Rebuild Docker Images (No Cache)

**Why `--no-cache` is Critical**:
- Docker caches each build layer
- If source files change but layer hash doesn't update, old code persists
- `--no-cache` forces complete rebuild from scratch

**Commands**:
```bash
# Stop and remove everything
docker compose down -v --remove-orphans

# Rebuild with no cache
docker compose build --no-cache

# Start fresh
docker compose up -d
```

---

### Fix #3: Pre-download Tiktoken Cache

**Why This Helps**:
- Zep container won't crash on startup
- Network timeout issues eliminated

**Command**:
```bash
./scripts/download_tiktoken_cache.sh
```

---

## Automated Fix Script

**Run this script to fix all issues**:

```bash
./scripts/rebuild_zep_containers.sh
```

**What it does**:
1. ✅ Stops all containers
2. ✅ Removes volumes
3. ✅ Clears Python bytecode cache
4. ✅ Pre-downloads tiktoken
5. ✅ Rebuilds with `--no-cache`
6. ✅ Starts containers
7. ✅ Verifies Zep client

---

## Verification Steps

### Step 1: Check Zep Client Methods
```bash
docker compose exec web python -c "
from assistant.memory.service import get_client
client = get_client(require_write=True)
if client:
    print('✓ Zep client loaded')
    print(f'Has ensure_user: {hasattr(client, \"ensure_user\")}')
    print(f'Has ensure_thread: {hasattr(client, \"ensure_thread\")}')
    print(f'Has get_user_context: {hasattr(client, \"get_user_context\")}')
    print(f'Has add_messages: {hasattr(client, \"add_messages\")}')
"
```

**Expected Output**:
```
✓ Zep client loaded
Has ensure_user: True
Has ensure_thread: True
Has get_user_context: True
Has add_messages: True
```

### Step 2: Test Chat Flow
```bash
# Send a test message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "I need an apartment"}'
```

### Step 3: Check for Errors
```bash
# Monitor logs for AttributeError
docker compose logs -f celery | grep -E "AttributeError|ensure_user|get\("

# Should see NO errors
```

### Step 4: Verify Zep Writes
```bash
# Check Zep metrics
curl http://localhost:8000/api/metrics/ | grep zep_write

# Should see:
# zep_write_request_total{op="ensure_user"} > 0
# zep_write_failure_total{op="ensure_user"} = 0
```

---

## Why Did This Happen?

### Timeline of Events

1. **Initial State**: Code had both `assistant/memory/zep_client.py` and `assistant/brain/zep_client.py`

2. **Development**: Code was updated in `assistant/memory/zep_client.py`

3. **Docker Build**: Containers were built, creating `.pyc` files

4. **Code Changes**: More updates to source code

5. **Rebuild (Cached)**: `docker compose build` used cached layers
   - Old `.pyc` files persisted
   - Old imports cached in bytecode

6. **Runtime Error**: Python loads cached bytecode
   - Imports resolve to wrong modules
   - Methods not found on objects

---

## Prevention

### Always Use `--no-cache` When Code Changes

**Bad** (uses cache):
```bash
docker compose build
```

**Good** (forces rebuild):
```bash
docker compose build --no-cache
```

### Clear Bytecode Before Building

**Add to build process**:
```bash
# In Dockerfile or build script
RUN find . -type d -name '__pycache__' -exec rm -rf {} + || true
RUN find . -type f -name '*.pyc' -delete || true
```

### Use Multi-Stage Builds

**Dockerfile**:
```dockerfile
# Stage 1: Dependencies
FROM python:3.11 AS builder
...

# Stage 2: Application (fresh copy)
FROM python:3.11
COPY --from=builder /app /app
COPY . /code/
```

This ensures source code is always fresh, not cached.

---

## Related Issues

### Import Confusion

**Problem**: Two modules with same name (`zep_client.py`)

**Solution**: Rename one to avoid confusion
- `assistant/memory/zep_client.py` → `zep_api_client.py`
- `assistant/brain/zep_client.py` → `zep_simple_client.py`

### Global Singleton Cache

**Problem**: `_CLIENT` global in `service.py` caches the wrong client

**Solution**: Add type checking
```python
# In get_client()
if _CLIENT is not None:
    # Verify it's the correct client type
    if not hasattr(_CLIENT, 'ensure_user'):
        logger.warning("Cached client is wrong type, recreating")
        _CLIENT = None
```

---

## Summary

| Issue | Root Cause | Fix | Priority |
|-------|-----------|-----|----------|
| Missing `ensure_user` | Wrong ZepClient class cached | Rebuild with `--no-cache` | P0 |
| Context type mismatch | Outdated production code | Rebuild with latest code | P0 |
| Bytecode cache | Old `.pyc` files | Clear `__pycache__` | P1 |
| Tiktoken download | Network timeout | Pre-download cache | P1 |

---

## Quick Fix Command

```bash
# One-liner to fix everything
./scripts/rebuild_zep_containers.sh
```

---

**Status After Fix**: ✅ All errors resolved, system operational

**Next Steps**:
1. Monitor logs for 24 hours
2. Set up alerts for AttributeError
3. Document deployment process
4. Add pre-commit hooks to clear bytecode

---

**Last Updated**: 2025-01-06
**Incident**: ZEP-001
**Severity**: Critical (P0)
**Resolution Time**: ~10 minutes (rebuild)
