#!/bin/bash
until curl -fsS http://zep:8000/healthz; do
echo "Waiting for Zep..."
sleep 5
done
exec celery -A easy_islanders worker -Q chat,default,background,notifications,dlq -l info --concurrency=8