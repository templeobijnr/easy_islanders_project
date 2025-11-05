#!/usr/bin/env python3
"""
EASY ISLANDERS — RUNTIME DIAGNOSTIC SCRIPT

This script runs comprehensive runtime checks once Docker services are running.
It validates all subsystems including Django, Zep, Redis, Celery, LangGraph,
and STEP 6 memory management.

Usage:
    python3 scripts/runtime_diagnostic.py

Or through Docker:
    docker compose exec web python3 scripts/runtime_diagnostic.py
"""

import importlib
import pkgutil
import os
import sys
import json
import time
import logging
from pathlib import Path
from datetime import datetime
from pprint import pprint

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')

print("=" * 70)
print("EASY ISLANDERS — RUNTIME DIAGNOSTIC")
print("=" * 70)
print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
print()

try:
    import django
    django.setup()
    print("✅ Django initialized successfully")
except Exception as e:
    print(f"❌ Django initialization failed: {e}")
    sys.exit(1)

# ---------------------------------------------
# 1️⃣  ENVIRONMENT & CONFIG VALIDATION
# ---------------------------------------------
print("\n=== [1] ENVIRONMENT VARIABLES ===")
critical_envs = [
    "DATABASE_URL", "REDIS_URL",
    "ZEP_URL", "ZEP_API_KEY",
    "OPENAI_API_KEY"
]
for var in critical_envs:
    val = os.getenv(var)
    status = '✅ set' if val else '❌ MISSING'
    # Mask sensitive values
    if val and 'KEY' in var:
        display = val[:8] + "..." if len(val) > 8 else "***"
    elif val and 'URL' in var:
        display = val[:50] + "..." if len(val) > 50 else val
    else:
        display = ""
    print(f"  {var:25s}: {status:10s} {display}")

# ---------------------------------------------
# 2️⃣  MODULE IMPORT & STRUCTURE SCAN
# ---------------------------------------------
print("\n=== [2] CRITICAL MODULE IMPORTS ===")
critical_modules = [
    "assistant.brain.supervisor",
    "assistant.brain.supervisor_graph",
    "assistant.brain.supervisor_schemas",
    "assistant.memory.service",
    "assistant.memory.summarizer",
    "assistant.memory.zep_client",
]

import_errors = []
for module_name in critical_modules:
    try:
        importlib.import_module(module_name)
        print(f"  ✅ {module_name}")
    except Exception as e:
        print(f"  ❌ {module_name}: {e}")
        import_errors.append((module_name, str(e)))

if import_errors:
    print(f"\n⚠️  {len(import_errors)} import errors found")

# ---------------------------------------------
# 3️⃣  GRAPH / SUPERVISOR HEALTH
# ---------------------------------------------
print("\n=== [3] SUPERVISOR GRAPH HEALTH ===")
try:
    from assistant.brain.supervisor_graph import build_supervisor_graph, _ZEP_CLIENT
    graph = build_supervisor_graph()
    print(f"  ✅ Supervisor graph compiled: {type(graph).__name__}")
    if _ZEP_CLIENT:
        print(f"  ✅ Zep client initialized: {getattr(_ZEP_CLIENT, 'base_url', 'unknown')}")
    else:
        print(f"  ⚠️  Zep client not initialized")
except Exception as e:
    print(f"  ❌ Supervisor graph failed: {e}")

# ---------------------------------------------
# 4️⃣  ZEP CONNECTIVITY TEST
# ---------------------------------------------
print("\n=== [4] ZEP HEALTH CHECK ===")
import requests
zep_url = os.getenv("ZEP_URL", "http://localhost:8001")
try:
    resp = requests.get(f"{zep_url}/healthz", timeout=5)
    if resp.status_code == 200:
        print(f"  ✅ Zep health: {resp.text}")
    else:
        print(f"  ⚠️  Zep responded with status {resp.status_code}")
except Exception as e:
    print(f"  ❌ Zep unreachable: {e}")

# ---------------------------------------------
# 5️⃣  DATABASE / REDIS / CELERY PING
# ---------------------------------------------
print("\n=== [5] BACKEND SERVICES ===")

# Redis
try:
    import redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    r = redis.Redis.from_url(redis_url)
    r.ping()
    print(f"  ✅ Redis OK ({redis_url[:30]}...)")
except Exception as e:
    print(f"  ❌ Redis failed: {e}")

# Postgres
try:
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"  ✅ Postgres OK: {version[:50]}...")
except Exception as e:
    print(f"  ❌ Postgres failed: {e}")

# Celery
try:
    from celery import Celery
    app = Celery("assistant")
    app.config_from_object('django.conf:settings', namespace='CELERY')
    res = app.control.ping(timeout=3)
    if res:
        print(f"  ✅ Celery workers: {len(res)} responding")
    else:
        print(f"  ⚠️  Celery: No workers responding")
except Exception as e:
    print(f"  ❌ Celery check failed: {e}")

# ---------------------------------------------
# 6️⃣  LANGGRAPH MEMORY CHECK
# ---------------------------------------------
print("\n=== [6] LANGGRAPH MEMORY & CHECKPOINT ===")
try:
    from assistant.brain.supervisor_graph import _SUPERVISOR_MEMORY
    if _SUPERVISOR_MEMORY:
        print(f"  ✅ MemorySaver active: {type(_SUPERVISOR_MEMORY).__name__}")
    else:
        print(f"  ⚠️  MemorySaver not initialized")
except Exception as e:
    print(f"  ❌ MemorySaver check failed: {e}")

# ---------------------------------------------
# 7️⃣  RAG RETRIEVAL TEST
# ---------------------------------------------
print("\n=== [7] RAG RETRIEVAL TEST ===")
try:
    from assistant.brain.supervisor_graph import _inject_zep_context
    from assistant.brain.supervisor_schemas import SupervisorState

    dummy_state: SupervisorState = {
        "thread_id": "diagnostic-test-001",
        "user_input": "test recall apartment Girne",
        "history": [],
    }

    start_time = time.time()
    out = _inject_zep_context(dummy_state)
    latency_ms = (time.time() - start_time) * 1000

    retrieved = out.get("retrieved_context", "")
    print(f"  ✅ RAG retrieval executed in {latency_ms:.1f}ms")
    print(f"  ℹ️  Retrieved context: {len(retrieved)} chars")
    if retrieved:
        print(f"     Preview: {retrieved[:80]}...")
except Exception as e:
    print(f"  ❌ RAG retrieval failed: {e}")

# ---------------------------------------------
# 8️⃣  STEP 6 FUNCTION CHECK
# ---------------------------------------------
print("\n=== [8] STEP 6 FUNCTION AVAILABILITY ===")
step6_functions = [
    ("assistant.memory.summarizer", "summarize_context"),
    ("assistant.memory.summarizer", "extract_key_entities"),
    ("assistant.memory.service", "rehydrate_state"),
    ("assistant.brain.supervisor_graph", "_inject_zep_context"),
    ("assistant.brain.supervisor_graph", "_append_turn_history"),
    ("assistant.brain.supervisor_graph", "_fuse_context"),
    ("assistant.brain.supervisor_graph", "_persist_context_snapshot"),
    ("assistant.brain.supervisor_graph", "rotate_inactive_contexts"),
]

for module_name, func_name in step6_functions:
    try:
        module = importlib.import_module(module_name)
        if hasattr(module, func_name):
            print(f"  ✅ {module_name}.{func_name}")
        else:
            print(f"  ❌ {module_name}.{func_name} - NOT FOUND")
    except Exception as e:
        print(f"  ❌ {module_name}.{func_name} - Import failed: {e}")

# ---------------------------------------------
# 9️⃣  SUPERVISOR NODE SIMULATION
# ---------------------------------------------
print("\n=== [9] SUPERVISOR INVOKE TEST ===")
try:
    from assistant.brain.supervisor_graph import build_supervisor_graph
    from assistant.brain.supervisor_schemas import SupervisorState

    graph = build_supervisor_graph()
    if not graph:
        raise Exception("Graph compilation returned None")

    test_state: SupervisorState = {
        "thread_id": "diagnostic-test-002",
        "user_input": "I need an apartment in Girne",
        "history": [],
        "user_id": "test-user",
        "user_language": "en",
    }

    start_time = time.time()
    new_state = graph.invoke(test_state, {"configurable": {"thread_id": "diagnostic-test-002"}})
    latency_ms = (time.time() - start_time) * 1000

    print(f"  ✅ Supervisor invoked successfully in {latency_ms:.1f}ms")
    print(f"     Active domain: {new_state.get('active_domain', 'unknown')}")
    print(f"     Target agent: {new_state.get('target_agent', 'unknown')}")
    print(f"     Response length: {len(new_state.get('final_response', ''))} chars")

    # Check STEP 6 state fields
    if "fused_context" in new_state:
        print(f"     ✅ Fused context: {len(new_state['fused_context'])} chars")
    if "retrieved_context" in new_state:
        print(f"     ✅ Retrieved context: {len(new_state.get('retrieved_context', ''))} chars")

except Exception as e:
    print(f"  ❌ Supervisor invocation failed: {e}")
    import traceback
    traceback.print_exc()

# ---------------------------------------------
# 🔟  LOGGING & TELEMETRY
# ---------------------------------------------
print("\n=== [10] LOGGING & TELEMETRY ===")
try:
    log_dir = Path("logs")
    if log_dir.exists():
        recent_logs = sorted(log_dir.glob("*.log"), key=os.path.getmtime, reverse=True)[:3]
        if recent_logs:
            print(f"  ✅ Found {len(recent_logs)} recent log files:")
            for lf in recent_logs:
                mtime = datetime.fromtimestamp(lf.stat().st_mtime)
                print(f"     • {lf.name:40s} {lf.stat().st_size:8d}B  {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print(f"  ⚠️  No log files found in {log_dir}")
    else:
        print(f"  ⚠️  Logs directory not found: {log_dir}")
except Exception as e:
    print(f"  ⚠️  Log scan failed: {e}")

# ---------------------------------------------
# SUMMARY
# ---------------------------------------------
print("\n" + "=" * 70)
print("RUNTIME DIAGNOSTIC COMPLETE")
print("=" * 70)
print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
print()

if import_errors:
    print(f"⚠️  {len(import_errors)} import errors detected")
    print("   Review errors above and fix syntax issues")
else:
    print("✅ All critical modules imported successfully")

print()
print("🚀 NEXT STEPS:")
print("   1. Run STEP 6 validation: python3 scripts/validate_step6_context_lifecycle.py")
print("   2. Run router evaluation: python3 scripts/eval_router.py")
print("   3. Test chat endpoint: curl -X POST http://localhost:8000/api/chat/ ...")
print()
