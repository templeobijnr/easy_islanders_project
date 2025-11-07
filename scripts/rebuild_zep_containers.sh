#!/bin/bash
# Zep Container Rebuild Script
# Fixes:
# 1. AttributeError: 'ZepClient' object has no attribute 'ensure_user'
# 2. AttributeError: 'list' object has no attribute 'get'

set -e

echo "=== Zep Container Rebuild Script ==="
echo ""
echo "This script will:"
echo "1. Stop all containers"
echo "2. Remove old images and volumes"
echo "3. Clear Python bytecode cache"
echo "4. Pre-download tiktoken cache"
echo "5. Rebuild containers with latest code"
echo ""

# Confirm before proceeding
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Stopping containers..."
docker compose down --remove-orphans

echo ""
echo "Step 2: Removing old volumes..."
docker compose down -v

echo ""
echo "Step 3: Clearing Python bytecode cache..."
find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
find . -type f -name '*.pyc' -delete 2>/dev/null || true
find . -type f -name '*.pyo' -delete 2>/dev/null || true
echo "✓ Bytecode cache cleared"

echo ""
echo "Step 4: Pre-downloading tiktoken cache..."
if [ -f "./scripts/download_tiktoken_cache.sh" ]; then
    ./scripts/download_tiktoken_cache.sh
else
    echo "⚠ Warning: tiktoken download script not found, skipping..."
fi

echo ""
echo "Step 5: Rebuilding containers..."
docker compose build --no-cache

echo ""
echo "Step 6: Starting containers..."
docker compose up -d

echo ""
echo "Step 7: Waiting for services to be healthy..."
sleep 10

echo ""
echo "Step 8: Verifying services..."
echo ""
echo "Checking web service..."
docker compose ps web

echo ""
echo "Checking celery service..."
docker compose ps celery

echo ""
echo "Checking zep service..."
docker compose ps zep

echo ""
echo "Step 9: Testing Zep connection..."
docker compose exec web python -c "
from assistant.memory.service import get_client
client = get_client(require_write=True)
if client:
    print('✓ Zep client loaded successfully')
    print(f'  Base URL: {client.base_url}')
    print(f'  Has ensure_user: {hasattr(client, \"ensure_user\")}')
    print(f'  Has ensure_thread: {hasattr(client, \"ensure_thread\")}')
    print(f'  Has get_user_context: {hasattr(client, \"get_user_context\")}')
    print(f'  Has add_messages: {hasattr(client, \"add_messages\")}')
else:
    print('❌ Zep client not available')
    exit(1)
" || echo "⚠ Warning: Zep client test failed"

echo ""
echo "=== Rebuild Complete ==="
echo ""
echo "Next steps:"
echo "1. Check logs: docker compose logs -f web celery zep"
echo "2. Test chat: Send a message through the web interface"
echo "3. Monitor metrics: curl http://localhost:8000/api/metrics/ | grep zep"
echo ""
