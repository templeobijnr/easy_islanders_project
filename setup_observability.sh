#!/bin/bash

# Easy Islanders Observability Stack Setup
# This script sets up OpenTelemetry, Prometheus, Grafana, and Jaeger

set -e

echo "🚀 Setting up Easy Islanders Observability Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p prometheus
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/dashboards

# Copy dashboard to Grafana directory
echo "📊 Setting up Grafana dashboard..."
cp grafana/dashboard.json grafana/dashboards/

# Start observability stack
echo "🐳 Starting observability stack..."
docker-compose -f docker-compose.observability.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.observability.yml ps

echo ""
echo "✅ Observability stack is ready!"
echo ""
echo "📊 Access URLs:"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Jaeger: http://localhost:16686"
echo ""
echo "🔧 Environment Variables to set:"
echo "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317"
echo "  export ENABLE_OTEL_METRICS=true"
echo "  export ENVIRONMENT=staging"
echo ""
echo "🚀 To start your Django app with observability:"
echo "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317"
echo "  export ENABLE_OTEL_METRICS=true"
echo "  python manage.py runserver"
echo ""
echo "📈 To view metrics in Grafana:"
echo "  1. Go to http://localhost:3001"
echo "  2. Login with admin/admin"
echo "  3. The 'Easy Islanders - Production Monitoring' dashboard should be available"
echo ""
echo "🔍 To view traces in Jaeger:"
echo "  1. Go to http://localhost:16686"
echo "  2. Select 'easy-islanders' service"
echo "  3. Click 'Find Traces'"
