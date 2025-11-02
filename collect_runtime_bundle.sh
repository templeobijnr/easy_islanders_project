#!/usr/bin/env bash
set -euo pipefail

OUT=".audit_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT/logs" "$OUT/env" "$OUT/db" "$OUT/frontend" "$OUT/ws"

echo "==> Environment snapshot"
{
  echo "### SHELL ENV (sanitized)"
  printenv | sort | sed -E 's/(SECRET|TOKEN|PASS|KEY|COOKIE|JWT)=.*/\1=<redacted>/g'
  echo
  echo "### Python versions"
  python --version 2>/dev/null || true
  python3 --version 2>/dev/null || true
  echo
  echo "### Pip package quick check"
  python - <<'PY'
import pkgutil
def has(m): 
    import importlib.util as s
    print(f"{m}: {bool(pkgutil.find_loader(m))}")
for m in ["channels","channels_redis"]:
    has(m)
PY
  echo
} > "$OUT/env/shell.txt"

echo "==> Django settings snapshot"
python manage.py shell -c "
from django.conf import settings; import json, os
print(json.dumps({
  'DJANGO_SETTINGS_MODULE': os.environ.get('DJANGO_SETTINGS_MODULE'),
  'DATABASES.default': settings.DATABASES.get('default'),
  'CORS_ALLOWED_ORIGINS': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
  'ALLOWED_HOSTS': getattr(settings, 'ALLOWED_HOSTS', []),
  'CHANNEL_LAYERS': getattr(settings, 'CHANNEL_LAYERS', {}),
  'CELERY': {
    'BROKER_URL': getattr(settings, 'CELERY_BROKER_URL', None),
    'RESULT_BACKEND': getattr(settings, 'CELERY_RESULT_BACKEND', None),
    'TASK_SOFT_TIME_LIMIT': getattr(settings, 'CELERY_TASK_SOFT_TIME_LIMIT', None),
    'TASK_TIME_LIMIT': getattr(settings, 'CELERY_TASK_TIME_LIMIT', None),
  }
}, indent=2, default=str))
" > "$OUT/env/django_settings.json" 2>&1 || true

echo "==> Migrations state"
python manage.py showmigrations assistant > "$OUT/db/migrations_assistant.txt" 2>&1 || true

echo "==> DB schema (Postgres & SQLite safe probes)"
# Postgres (if configured)
{ 
  echo "\\d assistant_message;"
  echo "SELECT column_name,data_type FROM information_schema.columns WHERE table_name='assistant_message' ORDER BY ordinal_position;"
} | python manage.py dbshell > "$OUT/db/schema_psql.txt" 2>&1 || true

# SQLite (in case dev is using it)
if [ -f "./db.sqlite3" ]; then
  sqlite3 db.sqlite3 "PRAGMA table_info(assistant_message);" > "$OUT/db/schema_sqlite.txt" 2>&1 || true
fi

echo "==> Frontend config"
if [ -f "frontend/.env.local" ]; then
  sed -E 's/(=).*/=\1<redacted>/' frontend/.env.local > "$OUT/frontend/env_local_sanitized.txt" || true
fi
grep -E "REACT_APP_API_URL|REACT_APP_WS_URL" -n frontend/src/config.* 2>/dev/null > "$OUT/frontend/config_spot.txt" || true
grep -R "new WebSocket" -n frontend/src 2>/dev/null > "$OUT/frontend/ws_ctor_refs.txt" || true

echo "==> Docker state (if present)"
docker compose ps > "$OUT/env/docker_ps.txt" 2>&1 || true

echo "==> Launch ASGI & Celery (10-second capture)"; echo
# Kill anything on 8000 to avoid port collisions
lsof -ti tcp:8000 | xargs kill -9 2>/dev/null || true

# Start uvicorn and celery in background with logs
UV_LOG="$OUT/logs/uvicorn.log"
CELERY_LOG="$OUT/logs/celery.log"

( UVICORN_WORKERS=${UVICORN_WORKERS:-1} \
  uvicorn easy_islanders.asgi:application --host 127.0.0.1 --port 8000 --log-level info \
  >"$UV_LOG" 2>&1 ) & UV_PID=$!

# macOS: avoid ObjC + fork crash
( celery -A easy_islanders worker -l info --pool=solo >"$CELERY_LOG" 2>&1 ) & CELERY_PID=$!

sleep 4

echo "==> Smoke test: auth + POST /api/chat/"
API=${API:-"http://127.0.0.1:8000"}
TOK="$(curl -s -X POST "$API/api/token/" -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r '.access // empty')"

if [ -z "$TOK" ]; then
  echo "(No token) Create a superuser or set TOK env var to a valid JWT" > "$OUT/env/auth_note.txt"
else
  CID=$(python - <<PY
import uuid; print(uuid.uuid4())
PY
)
  CHAT_RESP="$OUT/logs/chat_202.json"
  curl -s -i -X POST "$API/api/chat/" \
    -H "Authorization: Bearer $TOK" \
    -H "X-Correlation-ID: $CID" \
    -H 'Content-Type: application/json' \
    -d "{\"message\":\"hello from audit\",\"client_msg_id\":\"$CID\"}" \
    | sed -E 's/(Authorization: Bearer )[A-Za-z0-9\.\-_]+/\1<redacted>/g' \
    > "$CHAT_RESP"

  echo "HTTP 202 payload saved to $CHAT_RESP"
fi

echo "==> WebSocket probe (5s)"
WS_URL_DEFAULT="ws://127.0.0.1:8000/ws/chat"
THREAD_ID_FROM_202=$(jq -r '.thread_id // empty' "$OUT/logs/chat_202.json" 2>/dev/null || true)
if [ -n "$THREAD_ID_FROM_202" ] && [ -n "${TOK:-}" ]; then
  WS_FULL="$WS_URL_DEFAULT/$THREAD_ID_FROM_202/?token=$TOK&cid=$CID"
  echo "$WS_FULL" | sed -E 's/(token=)[^&]+/\1<redacted>/' > "$OUT/ws/ws_url.txt"
  # capture frames
  ( wscat -c "$WS_FULL" -x 'ping' -w 5 || true ) 2>&1 \
    | sed -E 's/(token=)[^&]+/\1<redacted>/' \
    > "$OUT/ws/ws_frames.txt"
else
  echo "WS not attempted (missing thread_id or token). See chat_202.json and auth_note.txt" > "$OUT/ws/ws_frames.txt"
fi

echo "==> Kill background processes"
kill $UV_PID 2>/dev/null || true
kill $CELERY_PID 2>/dev/null || true
sleep 2

echo "==> Pack results"
ZIP="runtime_bundle_$(date +%Y%m%d_%H%M%S).zip"
zip -r "$ZIP" "$OUT" >/dev/null
echo "Bundle ready: $ZIP"