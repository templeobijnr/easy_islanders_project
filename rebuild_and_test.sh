#!/bin/bash

echo "=========================================="
echo "Rebuilding Docker containers with fixes"
echo "=========================================="

# Stop containers
echo "Stopping containers..."
docker compose down

# Rebuild only web and celery_chat (faster than full rebuild)
echo "Rebuilding web and celery_chat services..."
docker compose build web celery_chat

# Start containers
echo "Starting containers..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to start (10 seconds)..."
sleep 10

echo ""
echo "=========================================="
echo "Testing Real Estate Search API"
echo "=========================================="

# Test 1: ASCII Iskele
echo ""
echo "Test 1: city=Iskele (ASCII I)"
curl -s "http://localhost:8000/api/v1/real_estate/search?city=Iskele&rent_type=long_term&limit=3" | jq -r '.count'

# Test 2: Turkish İskele
echo ""
echo "Test 2: city=İskele (Turkish İ)"
curl -s "http://localhost:8000/api/v1/real_estate/search?city=İskele&rent_type=long_term&limit=3" | jq -r '.count'

# Test 3: Girne
echo ""
echo "Test 3: city=Girne"
curl -s "http://localhost:8000/api/v1/real_estate/search?city=Girne&rent_type=long_term&limit=3" | jq -r '.count'

echo ""
echo "=========================================="
echo "Expected Results:"
echo "  - Iskele (ASCII): 56 listings"
echo "  - İskele (Turkish): 56 listings"
echo "  - Girne: ~50+ listings"
echo "=========================================="
