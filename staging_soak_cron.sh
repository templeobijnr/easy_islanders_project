#!/bin/bash
# Easy Islanders - Staging Soak Cron Job
# Runs every 30 minutes during 24-hour staging soak

set -euo pipefail

PROJECT_DIR=/Users/apple_trnc/Desktop/work/easy_islanders_project
MONITOR_LOG="${PROJECT_DIR}/staging_soak_logs.txt"
CRON_LOG="${PROJECT_DIR}/staging_soak_cron.log"

export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH

# Ensure virtual environment is available when running under cron
if [[ -f "${PROJECT_DIR}/.venv/bin/activate" ]]; then
    # shellcheck disable=SC1091
    source "${PROJECT_DIR}/.venv/bin/activate"
fi

# Set environment variables
export ENVIRONMENT=staging
export ENABLE_OTEL_METRICS=true
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_TRACES_SAMPLER_ARG=1.0
export PROM_SCRAPE_ENABLED=true

echo "$(date -u): cron started" >> "$CRON_LOG"

cd "$PROJECT_DIR"

# Run the staging soak monitor
"${PROJECT_DIR}/staging_soak_monitor.sh" >> "$MONITOR_LOG" 2>&1

echo "Monitor run completed at $(date -u)" >> "$MONITOR_LOG"
echo "---" >> "$MONITOR_LOG"
echo "$(date -u): cron completed" >> "$CRON_LOG"
