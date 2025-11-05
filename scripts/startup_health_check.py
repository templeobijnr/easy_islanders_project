#!/usr/bin/env python3
"""
Startup Health Check for Easy Islanders Backend

Validates critical imports and dependencies before Django starts serving.
Run this before `python manage.py runserver` or in Docker ENTRYPOINT.

Usage:
    python3 scripts/startup_health_check.py

Exit codes:
    0 - All checks passed
    1 - Critical check failed (prevents startup)
"""

import sys
import importlib


def check_import(module_path: str, description: str) -> bool:
    """Attempt to import a module and report success/failure."""
    try:
        importlib.import_module(module_path)
        print(f"✓ {description}: {module_path}")
        return True
    except ModuleNotFoundError as e:
        print(f"✗ {description}: {module_path} - MISSING ({e})")
        return False
    except ImportError as e:
        print(f"✗ {description}: {module_path} - IMPORT ERROR ({e})")
        return False
    except Exception as e:
        print(f"✗ {description}: {module_path} - ERROR ({e})")
        return False


def main() -> int:
    print("=" * 70)
    print("Startup Health Check - Easy Islanders Backend")
    print("=" * 70)
    print()

    failures = []

    # Critical Django/Framework Imports
    print("=== Core Framework ===")
    if not check_import("django", "Django"):
        failures.append("django")
    if not check_import("rest_framework", "Django REST Framework"):
        failures.append("rest_framework")
    if not check_import("channels", "Django Channels (WebSocket)"):
        failures.append("channels")
    print()

    # Database & Caching
    print("=== Database & Caching ===")
    if not check_import("psycopg2", "PostgreSQL Driver (psycopg2)"):
        failures.append("psycopg2")
    if not check_import("redis", "Redis Client"):
        failures.append("redis")
    print()

    # AI/ML Dependencies
    print("=== AI/ML Stack ===")
    if not check_import("openai", "OpenAI SDK"):
        failures.append("openai")
    if not check_import("langchain", "LangChain"):
        failures.append("langchain")
    if not check_import("langgraph", "LangGraph"):
        failures.append("langgraph")
    print()

    # Critical Internal Modules (the ones that caused the import error)
    print("=== Critical Internal Modules ===")
    if not check_import("assistant.brain.prompts.renderer", "RE Agent Prompt Renderer"):
        failures.append("assistant.brain.prompts.renderer")
    if not check_import("assistant.memory.zep_client", "Zep Client (memory)"):
        failures.append("assistant.memory.zep_client")
    if not check_import("assistant.brain.zep_client", "Zep Client (brain)"):
        failures.append("assistant.brain.zep_client")
    if not check_import("assistant.brain.supervisor_graph", "Supervisor Graph"):
        failures.append("assistant.brain.supervisor_graph")
    if not check_import("assistant.consumers", "WebSocket Consumer"):
        failures.append("assistant.consumers")
    print()

    # Router Service
    print("=== Router Service ===")
    if not check_import("router_service.pipeline", "Intent Router Pipeline"):
        failures.append("router_service.pipeline")
    if not check_import("router_service.models", "Router Models"):
        failures.append("router_service.models")
    print()

    # Task Queue
    print("=== Task Queue ===")
    if not check_import("celery", "Celery"):
        failures.append("celery")
    if not check_import("assistant.tasks", "Assistant Tasks"):
        failures.append("assistant.tasks")
    print()

    # Summary
    print("=" * 70)
    if not failures:
        print("✓ ALL CHECKS PASSED - Service is ready to start")
        print("=" * 70)
        return 0
    else:
        print(f"✗ {len(failures)} CRITICAL CHECK(S) FAILED")
        print()
        print("Failed modules:")
        for module in failures:
            print(f"  - {module}")
        print()
        print("Action required:")
        print("  1. Install missing dependencies: pip install -r requirements.txt")
        print("  2. Check for import errors in the modules listed above")
        print("  3. Verify PYTHONPATH includes project root")
        print("  4. Rebuild Docker image if running in container")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
