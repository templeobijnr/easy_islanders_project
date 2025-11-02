#!/usr/bin/env bash
set -euo pipefail

# Simple OS-aware Celery launcher
# - macOS: prefer spawn-compatible settings to avoid fork + Objective-C issues
# - Linux: use defaults (prefork)

echo "Starting Celery worker for easy_islanders"

POOL=${CELERY_POOL:-prefork}
CONCURRENCY=${CELERY_CONCURRENCY:-}

case "${OSTYPE:-}" in
  darwin*)
    echo "🍎 Detected macOS - using spawn-safe settings"
    # Lower default concurrency for laptop dev environments
    CONCURRENCY=${CONCURRENCY:-2}
    ;;
  linux*)
    echo "🐧 Detected Linux - using defaults"
    CONCURRENCY=${CONCURRENCY:-4}
    ;;
  *)
    echo "ℹ️ Unknown OS (${OSTYPE:-unknown}); using conservative defaults"
    CONCURRENCY=${CONCURRENCY:-2}
    ;;
esac

exec celery -A easy_islanders worker \
  -l info \
  --pool="${POOL}" \
  --concurrency="${CONCURRENCY}" \
  --max-tasks-per-child=100 \
  --time-limit=360 \
  --soft-time-limit=300

