#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"
docker compose -f docker-compose.observability.yml up -d
echo "Observability stack started: Prometheus on :9090, Grafana on :3001"

