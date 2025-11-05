#!/usr/bin/env bash
#
# Pre-flight Validation Check
#
# Verifies environment is ready for Rehydration + Zep Guard Validation Gate execution.
# Run this before attempting validation to catch missing dependencies early.
#
# Usage:
#   bash scripts/preflight_validation_check.sh
#

set +e  # Don't exit on errors, we want to collect all checks

ERRORS=0
WARNINGS=0

echo "================================================================"
echo "Pre-flight Validation Check"
echo "Branch: claude/check-repo-b-011CUq9UvQmVEK185fB4AS8W"
echo "================================================================"
echo ""

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

check_command() {
    local cmd=$1
    local name=$2
    local required=${3:-true}

    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -1)
        echo -e "${GREEN}✓${NC} $name found: $version"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗${NC} $name NOT FOUND (required)"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠${NC} $name not found (optional)"
            ((WARNINGS++))
        fi
        return 1
    fi
}

check_file() {
    local file=$1
    local name=$2

    if [ -f "$file" ]; then
        local size=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✓${NC} $name exists ($size)"
        return 0
    else
        echo -e "${RED}✗${NC} $name NOT FOUND"
        ((ERRORS++))
        return 1
    fi
}

check_python_package() {
    local package=$1
    local name=$2

    if python3 -c "import $package" 2>/dev/null; then
        local version=$(python3 -c "import $package; print($package.__version__)" 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓${NC} Python package '$name' installed (version: $version)"
        return 0
    else
        echo -e "${RED}✗${NC} Python package '$name' NOT INSTALLED"
        ((ERRORS++))
        return 1
    fi
}

echo "=== System Dependencies ==="
check_command docker "Docker" true
check_command "docker compose" "Docker Compose" true
check_command python3 "Python 3" true
check_command psql "PostgreSQL client" true
check_command curl "curl" true
echo ""

echo "=== Python Packages ==="
check_python_package django "Django"
check_python_package websockets "websockets"
check_python_package requests "requests"
check_python_package celery "Celery"
check_python_package redis "redis"
echo ""

echo "=== Implementation Files ==="
check_file "assistant/consumers.py" "WebSocket consumer (rehydration push)"
check_file "assistant/memory/zep_client.py" "Zep client (empty message guard)"
check_file "assistant/tasks.py" "Celery tasks (mirror guards)"
check_file "assistant/brain/supervisor_graph.py" "Supervisor graph (checkpoint helper)"
check_file "frontend/src/shared/hooks/useChatSocket.ts" "Frontend WebSocket hook"
check_file "frontend/src/features/chat/ChatPage.tsx" "Frontend chat page"
check_file "tests/memory/test_zep_empty_guard.py" "Zep guard unit tests"
echo ""

echo "=== Validation Artifacts ==="
check_file "VALIDATION_GATE_REHYDRATION_ZEP.md" "Validation runbook"
check_file "VALIDATION_EXECUTION_LOG.md" "Execution log template"
check_file "VALIDATION_READY_FOR_EXECUTION.md" "Operator quick start guide"
check_file "scripts/validate_rehydration_smoke.py" "Automated smoke test"
check_file ".env.validation_gate" "Environment configuration"
check_file "grafana/dashboards/re_agent_readiness_gate.json" "Grafana dashboard"
check_file "prometheus/alerts/re_agent_alerts.yml" "Prometheus alerts"
echo ""

echo "=== Docker Services Check ==="
if command -v docker &> /dev/null; then
    if docker compose ps &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose is accessible"

        # Check if services are running
        RUNNING=$(docker compose ps --services --filter "status=running" 2>/dev/null | wc -l)
        TOTAL=$(docker compose ps --services 2>/dev/null | wc -l)

        if [ "$RUNNING" -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Docker services running: $RUNNING/$TOTAL"
            docker compose ps --format table
        else
            echo -e "${YELLOW}⚠${NC} No Docker services are currently running"
            echo "  Run: docker compose up -d"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} Docker Compose not configured or no services defined"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} Docker not available - cannot check services"
    ((ERRORS++))
fi
echo ""

echo "=== Database Check ==="
if command -v psql &> /dev/null; then
    # Try to connect with common credentials
    if psql -h 127.0.0.1 -U easy_user -d easy_islanders -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL database accessible"

        # Check for pgvector extension
        if psql -h 127.0.0.1 -U easy_user -d easy_islanders -c "SELECT 1 FROM pg_extension WHERE extname = 'vector'" -t 2>/dev/null | grep -q 1; then
            echo -e "${GREEN}✓${NC} pgvector extension installed"
        else
            echo -e "${YELLOW}⚠${NC} pgvector extension not found (may be optional)"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} PostgreSQL database not accessible (may not be started yet)"
        echo "  Expected: postgresql://easy_user:***@127.0.0.1:5432/easy_islanders"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} psql not available"
    ((ERRORS++))
fi
echo ""

echo "=== Git Status ==="
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "claude/check-repo-b-011CUq9UvQmVEK185fB4AS8W" ]; then
    echo -e "${GREEN}✓${NC} On correct branch: $BRANCH"
else
    echo -e "${YELLOW}⚠${NC} On branch: $BRANCH"
    echo "  Expected: claude/check-repo-b-011CUq9UvQmVEK185fB4AS8W"
    ((WARNINGS++))
fi

# Check if there are unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l)
if [ "$UNPUSHED" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All commits pushed to remote"
else
    echo -e "${YELLOW}⚠${NC} $UNPUSHED unpushed commit(s)"
    ((WARNINGS++))
fi

# Show recent commits
echo ""
echo "Recent commits:"
git log --oneline -3 | sed 's/^/  /'
echo ""

echo "================================================================"
echo "Pre-flight Summary"
echo "================================================================"

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo ""
    echo "Environment is ready for validation execution."
    echo ""
    echo "Next steps:"
    echo "  1. Review: VALIDATION_READY_FOR_EXECUTION.md"
    echo "  2. Start services: docker compose up -d"
    echo "  3. Run smoke test: python3 scripts/validate_rehydration_smoke.py"
    echo "  4. Follow runbook: VALIDATION_GATE_REHYDRATION_ZEP.md"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠ PASSED WITH $WARNINGS WARNING(S)${NC}"
    echo ""
    echo "Environment is mostly ready. Review warnings above."
    echo "You may proceed with validation but some features may not work."
    exit 0
else
    echo -e "${RED}✗ FAILED WITH $ERRORS ERROR(S) AND $WARNINGS WARNING(S)${NC}"
    echo ""
    echo "Environment is NOT ready for validation."
    echo ""
    echo "Common fixes:"
    echo "  - Install Docker: https://docs.docker.com/get-docker/"
    echo "  - Install Python packages: pip install django websockets requests celery redis"
    echo "  - Start services: docker compose up -d"
    echo "  - Check database: psql -h 127.0.0.1 -U easy_user -d easy_islanders"
    exit 1
fi
