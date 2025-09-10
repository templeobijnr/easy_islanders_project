#!/bin/bash
# Easy Islanders - Start All Services Script

echo "🚀 Starting Easy Islanders Services..."

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "📦 Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
    echo "✅ Redis started"
else
    echo "✅ Redis already running"
fi

# Check if Celery worker is running
if ! pgrep -f "celery.*worker" > /dev/null; then
    echo "🔄 Starting Celery worker..."
    celery -A easy_islanders worker -l info --detach
    sleep 2
    echo "✅ Celery worker started"
else
    echo "✅ Celery worker already running"
fi

# Start Django development server
echo "🌐 Starting Django server..."
python manage.py runserver 0.0.0.0:8000


