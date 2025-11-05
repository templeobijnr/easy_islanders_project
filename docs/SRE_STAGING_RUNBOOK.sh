#!/bin/bash
# SRE Staging Validation Runbook - Copy/Paste Commands
# PR: Production Hardening - Zep Memory Service with Auto-Downgrade Guard
# Date: 2025-11-03

set -e

# Color output for readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; }

# Configuration
STAGING_URL="${STAGING_URL:-http://staging.example.com}"
METRICS_URL="$STAGING_URL/api/metrics/"
TOKEN="${STAGING_AUTH_TOKEN}"

echo "=========================================="
echo "Zep Memory Service - Staging Validation"
echo "=========================================="
echo ""

# ==============================================================================
# DAY 0-2: DARK LAUNCH (WRITE-ONLY MODE)
# ==============================================================================

run_day0_validation() {
    echo_info "DAY 0-2: Dark Launch Validation (Write-Only Mode)"
    echo ""

    # Verify environment configuration
    echo "1. Verify Environment Configuration"
    echo "-----------------------------------"
    echo_info "Expected flags:"
    echo "  FLAG_ZEP_WRITE=true"
    echo "  FLAG_ZEP_READ=false"
    echo ""
    read -p "Press Enter to continue..."

    # Check mode status
    echo ""
    echo "2. Check Memory Mode Status"
    echo "-----------------------------------"
    ssh staging "cd /app && python manage.py zep_mode --status"
    echo ""
    echo_info "Expected: Base mode=write_only, Effective mode=write_only"
    read -p "Verify output above. Press Enter to continue..."

    # Drill 1: Write Path Validation
    echo ""
    echo "3. Drill 1: Write Path Validation"
    echo "-----------------------------------"
    echo_info "Sending test message with PII..."

    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "message": "I need a 2 bedroom apartment in Girne. Contact me at john.doe@example.com or +90 533 123 4567",
        "thread_id": "sre_drill_write_001"
      }' | jq .

    echo ""
    echo_info "✓ Message sent"
    echo_info "TODO: Verify in Zep dashboard:"
    echo_info "  - Message appears in thread sre_drill_write_001"
    echo_info "  - Email redacted: [EMAIL]"
    echo_info "  - Phone redacted: [PHONE]"
    read -p "Manually verify in Zep dashboard. Press Enter when done..."

    # Check write metrics
    echo ""
    echo "4. Check Write Metrics"
    echo "-----------------------------------"
    curl -s "$METRICS_URL" | grep -E "memory_zep_write|memory_zep_redactions|memory_mode_gauge"
    echo ""
    echo_info "Expected:"
    echo_info "  memory_mode_gauge{mode=\"write_only\"} 1.0"
    echo_info "  memory_zep_write_success_total > 0"
    echo_info "  memory_zep_redactions_total{field_type=\"email\"} > 0"
    echo_info "  memory_zep_redactions_total{field_type=\"phone\"} > 0"
    read -p "Verify metrics above. Press Enter to continue..."

    # Drill 2: Negative Cache Test
    echo ""
    echo "5. Drill 2: Negative Cache Test"
    echo "-----------------------------------"
    echo_info "Simulating timeout to test negative cache..."
    echo_info "TODO: Inject network delay or timeout (if tooling available)"
    echo_info "Expected behavior:"
    echo_info "  - First request times out"
    echo_info "  - Cache entry created with 3s TTL"
    echo_info "  - Subsequent requests within 3s skip Zep call"
    read -p "Skip this drill if no traffic shaping available. Press Enter to continue..."

    # 48-hour soak
    echo ""
    echo "6. 48-Hour Soak Test"
    echo "-----------------------------------"
    echo_info "Monitor metrics for 48 hours:"
    echo_info "  - memory_zep_write_success_total (should increment)"
    echo_info "  - memory_zep_downgrades_total (should be 0)"
    echo_info "  - error_rate (should not increase)"
    echo ""
echo_success "Day 0-2 validation setup complete!"
echo_info "Return in 48 hours to proceed to Day 3-5."
}

# -----------------------------------------------------------------------------
# Debug Memory HUD (dev only)
# Enable with one of:
#   VITE_DEBUG_MEMORY_HUD=true | NEXT_PUBLIC_DEBUG_MEMORY_HUD=true | REACT_APP_DEBUG_MEMORY_HUD=true
# You can also pass a dev-only URL toggle: /?debugHUD=1 (requires the flag above)
# Fields shown: mode, used, cached, took_ms, source, client_ids, correlation (no PII).
# Toggle with Ctrl/⌘+M. Expect cached=true on a second turn within 30s; timeouts show source="timeout".
# HUD is never rendered in prod unless explicitly flagged at build/runtime.

# ==============================================================================
# DAY 3-5: READ-WRITE VALIDATION
# ==============================================================================

run_day3_validation() {
    echo_info "DAY 3-5: Read-Write Validation"
    echo ""

    # Enable reads
    echo "1. Enable Read Mode"
    echo "-----------------------------------"
    echo_info "Update environment configuration:"
    echo "  FLAG_ZEP_WRITE=true"
    echo "  FLAG_ZEP_READ=true"
    echo ""
    echo_info "Restart workers:"
    echo "  ssh staging 'supervisorctl restart all'"
    read -p "Complete deployment steps. Press Enter when ready..."

    # Verify mode change
    echo ""
    echo "2. Verify Mode Change"
    echo "-----------------------------------"
    ssh staging "cd /app && python manage.py zep_mode --status"
    echo ""
    echo_info "Expected: Base mode=read_write, Effective mode=read_write"
    read -p "Verify output above. Press Enter to continue..."

    # Drill 3: Read Path with Context Injection
    echo ""
    echo "3. Drill 3: Read Path with Context Injection"
    echo "-----------------------------------"

    THREAD_ID="sre_drill_context_$(date +%s)"

    echo_info "Turn 1: Initial message (cache miss expected)..."
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"need a 2 bedroom\",
        \"thread_id\": \"$THREAD_ID\"
      }" | jq '.trace.memory'

    echo ""
    echo_info "Expected trace.memory:"
    echo_info "  mode: read_write"
    echo_info "  used: true"
    echo_info "  cached: false"
    echo_info "  source: zep"
    echo_info "  took_ms: <250"
    read -p "Verify output above. Press Enter for Turn 2..."

    echo ""
    echo_info "Turn 2: Follow-up within 30 seconds (cache hit expected)..."
    sleep 2
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"in girne\",
        \"thread_id\": \"$THREAD_ID\"
      }" | jq '.trace.memory'

    echo ""
    echo_info "Expected trace.memory:"
    echo_info "  mode: read_write"
    echo_info "  used: true"
    echo_info "  cached: true  <-- CACHE HIT!"
    echo_info "  source: zep"
    echo_info "  took_ms: <10"
    read -p "Verify cache hit. Press Enter to continue..."

    # Drill 4: Auth Failure Trigger
    echo ""
    echo "4. Drill 4: Auth Failure Trigger (Simulated)"
    echo "-----------------------------------"
    echo_info "Backup current Zep API key..."
    ssh staging "cd /app && echo \$ZEP_API_KEY > /tmp/zep_key_backup.txt"

    echo_info "Set invalid API key..."
    ssh staging "export ZEP_API_KEY=invalid_test_key && supervisorctl restart all"

    sleep 5
    echo_info "Send test message (should trigger auth downgrade)..."
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "message": "test auth failure",
        "thread_id": "sre_drill_auth_001"
      }' | jq '.trace.memory'

    echo ""
    echo_info "Check downgrade metrics..."
    curl -s "$METRICS_URL" | grep "memory_zep_downgrades_total"

    echo ""
    echo_info "Check mode status..."
    ssh staging "cd /app && python manage.py zep_mode --status"

    echo ""
    echo_info "Expected:"
    echo_info "  memory_zep_downgrades_total{reason=\"auth\"} 1.0"
    echo_info "  Forced mode: write_only (reason=auth, remaining=~300s)"
    read -p "Verify downgrade triggered. Press Enter to restore..."

    echo_info "Restore correct API key..."
    ssh staging "export ZEP_API_KEY=\$(cat /tmp/zep_key_backup.txt) && supervisorctl restart all"

    echo_info "Clear forced mode..."
    ssh staging "cd /app && python manage.py zep_mode --clear"

    echo_info "Verify restoration..."
    ssh staging "cd /app && python manage.py zep_mode --status"
    echo_success "Auth failure drill complete!"

    # Drill 5: Consecutive Failure Trigger
    echo ""
    echo "5. Drill 5: Consecutive Failure Trigger"
    echo "-----------------------------------"
    echo_info "This drill requires traffic shaping or Zep outage simulation"
    echo_info "Goal: Trigger 3 consecutive timeouts/5xx within 60s"
    echo ""
    echo_info "Expected behavior:"
    echo_info "  - After 3rd failure: auto-downgrade to write_only"
    echo_info "  - memory_zep_downgrades_total{reason=\"consecutive_failures\"} 1.0"
    echo_info "  - System holds for 5 minutes, then auto-probes"
    echo ""
    read -p "Skip if no traffic shaping available. Press Enter to continue..."

    # Drill 6: Cache Invalidation
    echo ""
    echo "6. Drill 6: Cache Invalidation"
    echo "-----------------------------------"
    THREAD_ID="sre_drill_cache_$(date +%s)"

    echo_info "Send message to populate cache..."
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"test message\",
        \"thread_id\": \"$THREAD_ID\"
      }" > /dev/null

    sleep 2
    echo_info "Send follow-up to verify cache hit..."
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"follow up\",
        \"thread_id\": \"$THREAD_ID\"
      }" | jq '.trace.memory.cached'

    echo_info "Expected: true (cache hit)"

    echo ""
    echo_info "Invalidate cache for thread..."
    ssh staging "cd /app && python manage.py zep_mode --invalidate $THREAD_ID"

    sleep 1
    echo_info "Send another follow-up (should miss cache)..."
    curl -X POST "$STAGING_URL/api/chat/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"after invalidate\",
        \"thread_id\": \"$THREAD_ID\"
      }" | jq '.trace.memory.cached'

    echo_info "Expected: false (cache miss after invalidation)"
    echo_success "Cache invalidation drill complete!"

    # Final metrics check
    echo ""
    echo "7. Final Metrics Validation"
    echo "-----------------------------------"
    echo_info "Read latency p95 (should be <250ms):"
    curl -s "$METRICS_URL" | grep -A 5 "zep_read_latency_seconds"

    echo ""
    echo_info "Cache hit rate (should be >60%):"
    curl -s "$METRICS_URL" | grep -E "memory_zep_context_cache|memory_zep_context_requests"

    echo ""
    echo_success "Day 3-5 validation complete!"
    echo_info "Monitor for 72 hours before proceeding to production canary."
}

# ==============================================================================
# EMERGENCY PROCEDURES
# ==============================================================================

emergency_rollback() {
    echo_error "EMERGENCY ROLLBACK INITIATED"
    echo ""

    echo "1. Force Write-Only Mode"
    echo "-----------------------------------"
    ssh staging "cd /app && python manage.py zep_mode --force rollback --ttl 600"

    echo ""
    echo "2. Verify Rollback"
    echo "-----------------------------------"
    ssh staging "cd /app && python manage.py zep_mode --status"

    echo ""
    echo_info "Expected: Effective mode=write_only"
    echo_success "Rollback complete. System is in write-only mode for 10 minutes."
    echo_info "Investigate issue and restore with: python manage.py zep_mode --clear"
}

emergency_disable_all() {
    echo_error "EMERGENCY: DISABLING ALL ZEP INTEGRATION"
    echo ""

    echo_info "Setting flags to false..."
    ssh staging "cd /app && export FLAG_ZEP_WRITE=false && export FLAG_ZEP_READ=false && supervisorctl restart all"

    echo ""
    echo_success "All Zep integration disabled. System is stateless."
    echo_info "Restore by setting flags back to true and restarting."
}

# ==============================================================================
# METRICS QUERIES (COPY-PASTE FOR GRAFANA/PROMETHEUS)
# ==============================================================================

show_promql_queries() {
    echo "=========================================="
    echo "PromQL Queries for Validation"
    echo "=========================================="
    echo ""

    echo "Memory Mode Gauge:"
    echo "  memory_mode_gauge"
    echo ""

    echo "Downgrade Events (5m rate):"
    echo "  increase(memory_zep_downgrades_total[5m])"
    echo ""

    echo "Read Latency p95:"
    echo "  histogram_quantile(0.95, rate(zep_read_latency_seconds_bucket[5m]))"
    echo ""

    echo "Cache Hit Rate:"
    echo "  rate(memory_zep_context_cache_hits_total[5m]) / rate(memory_zep_context_requests_total[5m]) * 100"
    echo ""

    echo "PII Redactions (1h):"
    echo "  increase(memory_zep_redactions_total[1h])"
    echo ""

    echo "Context Failures by Reason:"
    echo "  increase(memory_zep_context_failures_total[5m])"
    echo ""
}

# ==============================================================================
# MAIN MENU
# ==============================================================================

show_menu() {
    echo ""
    echo "=========================================="
    echo "Select Validation Phase:"
    echo "=========================================="
    echo "1. Day 0-2: Dark Launch (Write-Only)"
    echo "2. Day 3-5: Read-Write Validation"
    echo "3. Emergency Rollback (Force Write-Only)"
    echo "4. Emergency Disable (All Zep Integration)"
    echo "5. Show PromQL Queries"
    echo "6. Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice

    case $choice in
        1) run_day0_validation ;;
        2) run_day3_validation ;;
        3) emergency_rollback ;;
        4) emergency_disable_all ;;
        5) show_promql_queries ;;
        6) echo_success "Exiting."; exit 0 ;;
        *) echo_error "Invalid choice"; show_menu ;;
    esac

    show_menu
}

# Run interactive menu
if [ "$1" = "--interactive" ]; then
    show_menu
else
    echo "Usage:"
    echo "  $0 --interactive    # Interactive mode with menu"
    echo ""
    echo "Or source individual functions:"
    echo "  source $0"
    echo "  run_day0_validation"
    echo "  run_day3_validation"
    echo "  emergency_rollback"
    echo "  show_promql_queries"
fi
