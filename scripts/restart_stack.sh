#!/usr/bin/env bash
# Gate B: One-command dev stack with queue routing
# Restarts all services with proper environment alignment

set -euo pipefail

echo "🛑 Stopping existing services..."
pkill -f "celery -A easy_islanders worker" || true
pkill -f "uvicorn easy_islanders.asgi:application" || true
sleep 2

echo "🔧 Setting environment..."
export DJANGO_SETTINGS_MODULE=easy_islanders.settings.development
export DATABASE_URL=postgresql://easy_user:easy_pass@127.0.0.1:5432/easy_islanders
export REDIS_URL=redis://127.0.0.1:6379/0
export CELERY_BROKER_URL=redis://127.0.0.1:6379/1
export CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1

echo "🗄️  Running migrations..."
python3 manage.py migrate

echo "🚀 Starting ASGI server (Uvicorn)..."
uvicorn easy_islanders.asgi:application --host 0.0.0.0 --port 8000 --reload &
ASGI_PID=$!
sleep 3

echo "⚙️  Starting Celery workers with queue routing..."

# Chat queue (interactive, higher concurrency)
celery -A easy_islanders worker -Q chat -l info --concurrency=4 --pool=solo &
CHAT_PID=$!

# Background queue
celery -A easy_islanders worker -Q background -l info --concurrency=2 --pool=solo &
BG_PID=$!

# Notifications queue
celery -A easy_islanders worker -Q notifications -l info --concurrency=1 --pool=solo &
NOTIF_PID=$!

# DLQ queue (Dead Letter Queue)
celery -A easy_islanders worker -Q dlq -l info --concurrency=1 --pool=solo &
DLQ_PID=$!

sleep 3

echo ""
echo "✅ Stack is up!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ASGI (Uvicorn):    http://0.0.0.0:8000 (PID $ASGI_PID)"
echo "  Celery - chat:     PID $CHAT_PID (concurrency=4)"
echo "  Celery - background: PID $BG_PID (concurrency=2)"
echo "  Celery - notifications: PID $NOTIF_PID (concurrency=1)"
echo "  Celery - dlq:      PID $DLQ_PID (concurrency=1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
wait
