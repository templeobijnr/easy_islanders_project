#!/usr/bin/env python3
"""
Test script for OpenTelemetry observability setup.

This script validates that:
1. OpenTelemetry is properly configured
2. Spans are being created with request_id correlation
3. Metrics are being recorded
4. OTLP exporter is working
"""

import os
import sys
import time
import requests
import logging
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set up environment variables
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
os.environ['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'http://localhost:4317'
os.environ['ENABLE_OTEL_METRICS'] = 'true'
os.environ['ENVIRONMENT'] = 'staging'

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_otel_config():
    """Test OpenTelemetry configuration."""
    print("🔧 Testing OpenTelemetry configuration...")
    
    try:
        from assistant.monitoring.otel_config import get_otel_config, setup_otel_environment
        
        # Set up environment
        setup_otel_environment()
        config = get_otel_config()
        
        print(f"✅ OTEL_EXPORTER_OTLP_ENDPOINT: {config['OTEL_EXPORTER_OTLP_ENDPOINT']}")
        print(f"✅ OTEL_SERVICE_NAME: {config['OTEL_SERVICE_NAME']}")
        print(f"✅ OTEL_TRACES_SAMPLER_ARG: {config['OTEL_TRACES_SAMPLER_ARG']}")
        
        return True
    except Exception as e:
        print(f"❌ OpenTelemetry configuration failed: {e}")
        return False

def test_otel_instrumentation():
    """Test OpenTelemetry instrumentation."""
    print("\n🔍 Testing OpenTelemetry instrumentation...")
    
    try:
        from assistant.monitoring.otel_instrumentation import setup_otel_instrumentation, get_tracer
        
        # Setup instrumentation
        setup_otel_instrumentation()
        
        # Test tracer
        tracer = get_tracer()
        
        # Create a test span
        with tracer.start_span("test_span") as span:
            span.set_attribute("test.attribute", "test_value")
            span.set_attribute("request_id", "test-123")
            
        print("✅ OpenTelemetry instrumentation working")
        return True
    except Exception as e:
        print(f"❌ OpenTelemetry instrumentation failed: {e}")
        return False

def test_metrics():
    """Test metrics recording."""
    print("\n📊 Testing metrics recording...")
    
    try:
        from assistant.monitoring.metrics import (
            record_http_metrics, record_agent_execution, 
            record_registry_operation, record_error
        )
        
        # Test HTTP metrics
        record_http_metrics("GET", "/test", 200, 0.5, "test")
        
        # Test agent execution metrics
        record_agent_execution("test_agent", "test_operation", 1.0, True)
        
        # Test registry operation metrics
        record_registry_operation("test_operation", "success", 0.2)
        
        # Test error metrics
        record_error("test_service", "test_error", "error")
        
        print("✅ Metrics recording working")
        return True
    except Exception as e:
        print(f"❌ Metrics recording failed: {e}")
        return False

def test_django_integration():
    """Test Django integration."""
    print("\n🌐 Testing Django integration...")
    
    try:
        import django
        django.setup()
        
        from assistant.monitoring.middleware import OpenTelemetryMiddleware
        from django.test import RequestFactory
        
        # Create a test request
        factory = RequestFactory()
        request = factory.get('/test')
        request.META['HTTP_X_REQUEST_ID'] = 'test-request-123'
        
        # Test middleware
        middleware = OpenTelemetryMiddleware(lambda r: None)
        middleware.process_request(request)
        
        print("✅ Django integration working")
        return True
    except Exception as e:
        print(f"❌ Django integration failed: {e}")
        return False

def test_otlp_exporter():
    """Test OTLP exporter connectivity."""
    print("\n📡 Testing OTLP exporter connectivity...")
    
    try:
        # Check if Jaeger is running
        response = requests.get('http://localhost:16686', timeout=5)
        if response.status_code == 200:
            print("✅ Jaeger collector is accessible")
            return True
        else:
            print(f"⚠️  Jaeger collector returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Jaeger collector is not accessible. Make sure it's running on localhost:16686")
        return False
    except Exception as e:
        print(f"❌ OTLP exporter test failed: {e}")
        return False

def test_prometheus_metrics():
    """Test Prometheus metrics endpoint."""
    print("\n📈 Testing Prometheus metrics...")
    
    try:
        # Test Django metrics endpoint
        response = requests.get('http://localhost:8000/metrics', timeout=5)
        if response.status_code == 200:
            print("✅ Django metrics endpoint accessible")
            return True
        else:
            print(f"⚠️  Django metrics endpoint returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Django metrics endpoint not accessible. Make sure Django is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Prometheus metrics test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Easy Islanders Observability Test Suite")
    print("=" * 50)
    
    tests = [
        ("OpenTelemetry Configuration", test_otel_config),
        ("OpenTelemetry Instrumentation", test_otel_instrumentation),
        ("Metrics Recording", test_metrics),
        ("Django Integration", test_django_integration),
        ("OTLP Exporter", test_otlp_exporter),
        ("Prometheus Metrics", test_prometheus_metrics),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Observability stack is ready.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
