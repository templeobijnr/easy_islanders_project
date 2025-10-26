#!/bin/bash

# Staging Soak Monitor Script
# Runs every 30 minutes to validate metrics and system health

set -euo pipefail

METRICS_URL=${METRICS_URL:-http://localhost:8081/metrics}
PYTHON_BIN=${PYTHON_BIN:-python3}
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    PYTHON_BIN=python
fi
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    echo "❌ Python interpreter not found. Set PYTHON_BIN to a valid executable."
    exit 1
fi

echo "=== STAGING SOAK MONITOR - $(date -u) ==="

# Fetch metrics once so all checks operate on the same snapshot
if ! METRICS=$(curl -sf "$METRICS_URL"); then
    echo "1. Metrics endpoint health:"
    echo "   ❌ Registry metrics: FAILED"
    echo "=== END MONITOR CHECK ==="
    echo ""
    exit 1
fi

get_metric_value() {
    local name=$1
    local selector=${2:-}
    echo "$METRICS" | awk -v metric="$name" -v match="$selector" '
        $1 ~ ("^" metric "($|{)") && $1 !~ /^#/ {
            if (match == "" || index($0, match) > 0) {
                print $NF
                exit
            }
        }'
}

calculate_histogram_quantile() {
    local metric_prefix=$1
    local quantile=$2
    echo "$METRICS" | "$PYTHON_BIN" - "$metric_prefix" "$quantile" <<'PY'
import re
import sys

metric = sys.argv[1]
quantile = float(sys.argv[2])
content = sys.stdin.read()
pattern = re.compile(rf"{re.escape(metric)}_bucket\{{[^}}]*le=\"([^\"]+)\"[^}}]*\}}\s+([0-9.eE+-]+)")
buckets = {}
for le, value in pattern.findall(content):
    try:
        upper = float('inf') if le == '+Inf' else float(le)
        buckets.setdefault(upper, 0.0)
        buckets[upper] += float(value)
    except ValueError:
        continue

if not buckets:
    print("")
    sys.exit(0)

ordered = sorted(buckets.items(), key=lambda item: item[0])
total = ordered[-1][1]
if total == 0:
    print("0")
    sys.exit(0)

target = quantile * total
for upper, value in ordered:
    if value >= target:
        print(upper)
        break
PY
}

format_ms() {
    local seconds=$1
    if [[ -z "$seconds" ]]; then
        echo "n/a"
        return
    fi
    "$PYTHON_BIN" - "$seconds" <<'PY'
import sys
try:
    value = float(sys.argv[1])
except ValueError:
    print("n/a")
else:
    if value == float("inf"):
        print("inf")
    else:
        print(f"{value * 1000:.0f}ms")
PY
}

echo "1. Metrics endpoint health:"
echo "   ✅ Registry metrics: HTTP 200 from ${METRICS_URL}"

# Counters
echo "2. Counter snapshot:"
CURRENT_COUNT=$(get_metric_value "registry_terms_search_latency_seconds_count")
echo "   registry_terms_search_latency_seconds_count: ${CURRENT_COUNT:-n/a}"

# Latency SLO check
echo "3. Latency SLO (registry search P95 ≤ 600ms):"
REGISTRY_P95=$(calculate_histogram_quantile "registry_terms_search_latency_seconds" 0.95)
REGISTRY_P95_MS=$(format_ms "$REGISTRY_P95")
REGISTRY_P95_STATUS=$("$PYTHON_BIN" - "$REGISTRY_P95" <<'PY'
import sys
threshold = 0.6  # seconds
value = sys.argv[1]
try:
    v = float(value)
except ValueError:
    print("missing")
else:
    if v == float("inf"):
        print("fail")
    elif v <= threshold:
        print("pass")
    else:
        print("fail")
PY
)
if [[ "$REGISTRY_P95_STATUS" == "pass" ]]; then
    echo "   ✅ P95 latency: $REGISTRY_P95_MS"
elif [[ "$REGISTRY_P95_STATUS" == "fail" ]]; then
    echo "   ❌ P95 latency breach: $REGISTRY_P95_MS (threshold 600ms)"
else
    echo "   ⚠️ Unable to compute P95 latency (metric missing)"
fi

# Fallback ratio
echo "4. Fallback ratio (target < 1%):"
FALLBACK_COUNT=$(get_metric_value "registry_text_fallback_total")
if [[ -z "${CURRENT_COUNT:-}" || -z "${FALLBACK_COUNT:-}" ]]; then
    FALLBACK_RATE="missing"
else
    FALLBACK_RATE=$("$PYTHON_BIN" - <<'PY'
import sys
fallback = sys.argv[1]
total = sys.argv[2]
try:
    fallback_value = float(fallback)
    total_value = float(total)
except ValueError:
    print("missing")
    sys.exit(0)

if total_value == 0:
    print("0.0")
else:
    print(f"{(fallback_value / total_value) * 100:.2f}")
PY
"$FALLBACK_COUNT" "$CURRENT_COUNT")
fi
if [[ "$FALLBACK_RATE" == "missing" ]]; then
    echo "   ⚠️ Unable to compute fallback ratio (metrics missing)"
else
    FALLBACK_STATUS=$("$PYTHON_BIN" - "$FALLBACK_RATE" <<'PY'
import sys
value = sys.argv[1]
try:
    numeric = float(value)
except ValueError:
    print("missing")
else:
    print("ok" if numeric < 1.0 else "breach")
PY
)
    if [[ "$FALLBACK_STATUS" == "ok" ]]; then
        echo "   ✅ Fallback ratio: ${FALLBACK_RATE}%"
    elif [[ "$FALLBACK_STATUS" == "breach" ]]; then
        echo "   ❌ Fallback ratio breach: ${FALLBACK_RATE}% (threshold 1%)"
    else
        echo "   ⚠️ Unable to evaluate fallback ratio threshold"
    fi
fi

# Memory stability
echo "5. Memory usage:"
PROCESS_MEMORY=$(get_metric_value "process_resident_memory_bytes")
if [[ -n "${PROCESS_MEMORY:-}" ]]; then
    PROCESS_MEMORY_MB=$("$PYTHON_BIN" - "$PROCESS_MEMORY" <<'PY'
import sys
try:
    value = float(sys.argv[1])
except ValueError:
    print("n/a")
else:
    print(f"{value / (1024 * 1024):.1f}MB")
PY
)
    echo "   process_resident_memory_bytes: $PROCESS_MEMORY_MB"
else
    echo "   ⚠️ process_resident_memory_bytes metric not found"
fi
GC_METRIC=$(echo "$METRICS" | grep python_gc_objects_collected_total | head -1)
if [[ -n "$GC_METRIC" ]]; then
    echo "   $GC_METRIC"
else
    echo "   ⚠️ python_gc_objects_collected_total metric not found"
fi

# PII leakage (sample metrics payload)
echo "6. PII leakage check:"
if echo "$METRICS" | grep -i -E "(email|phone|iban|ssn)" > /dev/null; then
    echo "   ❌ Potential PII detected in metrics"
else
    echo "   ✅ No PII detected in metrics"
fi

echo "=== END MONITOR CHECK ==="
echo ""
