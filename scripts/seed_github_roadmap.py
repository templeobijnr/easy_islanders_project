#!/usr/bin/env python3
"""
Seed GitHub milestones and issues from the Phase B2 roadmap.

Usage:
  export GITHUB_TOKEN=ghp_xxx
  python scripts/seed_github_roadmap.py --repo templeobijnr/easy_islanders_project

This script is idempotent: it will not duplicate labels or milestones.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Dict, List

import requests

GITHUB_API = "https://api.github.com"


def gh_headers() -> Dict[str, str]:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


def ensure_labels(repo: str, labels: List[Dict[str, str]]):
    existing = requests.get(f"{GITHUB_API}/repos/{repo}/labels", headers=gh_headers()).json()
    existing_names = {l["name"] for l in existing if isinstance(existing, list)} if isinstance(existing, list) else set()
    for label in labels:
        if label["name"] in existing_names:
            continue
        requests.post(f"{GITHUB_API}/repos/{repo}/labels", headers=gh_headers(), json=label)
        time.sleep(0.2)


def ensure_milestone(repo: str, title: str, description: str = "") -> int:
    # Find existing
    r = requests.get(f"{GITHUB_API}/repos/{repo}/milestones?state=all", headers=gh_headers())
    r.raise_for_status()
    for m in r.json():
        if m.get("title") == title:
            return m["number"]
    # Create
    r = requests.post(
        f"{GITHUB_API}/repos/{repo}/milestones",
        headers=gh_headers(),
        json={"title": title, "state": "open", "description": description},
    )
    r.raise_for_status()
    return r.json()["number"]


def ensure_issue(repo: str, title: str, body: str, labels: List[str], milestone: int | None = None):
    # Skip if issue with same title exists open
    q = f"repo:{repo} is:issue in:title \"{title}\""
    r = requests.get(f"{GITHUB_API}/search/issues", headers=gh_headers(), params={"q": q})
    r.raise_for_status()
    if r.json().get("total_count", 0) > 0:
        return
    payload = {"title": title, "body": body, "labels": labels}
    if milestone:
        payload["milestone"] = milestone
    r = requests.post(f"{GITHUB_API}/repos/{repo}/issues", headers=gh_headers(), json=payload)
    r.raise_for_status()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="owner/repo")
    args = parser.parse_args()

    repo = args.repo

    # Global labels
    ensure_labels(
        repo,
        labels=[
            {"name": "epic:E1", "color": "0e8a16"},
            {"name": "epic:E2", "color": "1d76db"},
            {"name": "epic:E3", "color": "5319e7"},
            {"name": "epic:E4", "color": "fbca04"},
            {"name": "epic:E5", "color": "b60205"},
            {"name": "epic:E6", "color": "d4c5f9"},
            {"name": "area:agent", "color": "c5def5"},
            {"name": "area:telemetry", "color": "a2eeef"},
            {"name": "area:frontend", "color": "ededed"},
            {"name": "area:infra", "color": "fef2c0"},
            {"name": "type:story", "color": "bfd4f2"},
        ],
    )

    sprints = [
        {
            "title": "Sprint 1 — Agent Resilience Integration",
            "epic": "epic:E2",
            "milestone_desc": "Make agent self‑recovering under failure.",
            "labels": ["type:story", "area:agent", "epic:E2"],
            "stories": [
                ("Integrate resilience with checkpointing and memory", "Wire assistant/brain/resilience.py into checkpointing.py + memory.py.", [
                    "- Wrap persistence with try/except and log",
                    "- Return cached state on store/load failure",
                ]),
                ("Transactional rollback for LLM + DB writes", "Strengthen assistant/brain/transactions.py rollback on partial failures.", [
                    "- Validate atomic sections and on_commit hooks",
                    "- Map exceptions to safe responses",
                ]),
                ("Response cache read‑through fallback", "Add caching/response_cache.py and integrate into synthesis node.", [
                    "- Cache by (intent, language, normalized prompt)",
                    "- TTL 15 minutes and metrics on cache hits",
                ]),
                ("Chaos tests for LLM/DB/network faults", "pytest chaos cases to assert safe fallbacks (no 500s).", [
                    "- Simulate LLM/network exceptions",
                    "- Verify < 2% unhandled exceptions/1k req",
                ]),
            ],
        },
        {
            "title": "Sprint 2 — Telemetry & Observability",
            "epic": "epic:E3",
            "milestone_desc": "Full tracing and metrics correlation.",
            "labels": ["type:story", "area:telemetry", "epic:E3"],
            "stories": [
                ("Django OTEL middleware end‑to‑end", "Ensure request_id + otel middleware wraps all views.", [
                    "- Confirm assistant/monitoring/otel_instrumentation hooks",
                    "- Add span creation in critical endpoints",
                ]),
                ("Span decorators across brain", "Add spans in llm, tools, context manager.", [
                    "- create_agent_span around synthesis, retrieval, routing",
                ]),
                ("Compose collector + Prometheus + Grafana", "Provide docker‑compose.observability.yml and dashboards.", [
                    "- Validate metrics ingestion/startup",
                ]),
                ("Dashboards + alert rules", "Add dashboards.md + alerts.md and wire alert thresholds.", [
                    "- p95 latency, error bursts, missing traces",
                ]),
            ],
        },
        {
            "title": "Sprint 3 — Guardrails & Compliance Layer",
            "epic": "epic:E6",
            "milestone_desc": "Enforce enterprise policies and safe behavior.",
            "labels": ["type:story", "area:agent", "epic:E6"],
            "stories": [
                ("Activate enterprise guardrails in chat", "Ensure end‑to‑end guardrail gating + audit trail.", []),
                ("Structured logging via enterprise_schemas", "Persist typed intent + request payloads.", []),
                ("Feature flag toggles for rollout", "Add models.FeatureFlag + admin.", []),
            ],
        },
        {
            "title": "Sprint 4 — Production Infrastructure & Soak Testing",
            "epic": "epic:E4",
            "milestone_desc": "Stable, monitored production environment.",
            "labels": ["type:story", "area:infra", "epic:E4"],
            "stories": [
                ("Managed Postgres migration", "DB_* envs, migrations, health probes.", []),
                ("Checkpoint + health checks", "bootstrap_postgres_checkpoints.py and health_check.py.", []),
                ("Staging soak monitor run", "Run staging_soak_monitor.sh overnight.", []),
                ("CI/CD deploy + rollback", "Workflow for deployment + rollback.", []),
            ],
        },
        {
            "title": "Sprint 5 — Frontend Integration & Experience",
            "epic": "epic:E5",
            "milestone_desc": "Full‑stack sync and UX reliability.",
            "labels": ["type:story", "area:frontend", "epic:E5"],
            "stories": [
                ("JWT refresh + auth retry", "Axios interceptor to refresh /api/token/refresh/ and retry.", []),
                ("Degraded UX fallbacks", "Fallback UI for 5xx/latency; optimistic unread badge.", []),
                ("IndexedDB chat cache", "Local cache of threads/messages for offline/degraded mode.", []),
            ],
        },
        {
            "title": "Sprint 6 — Release Hardening & Documentation",
            "epic": "epic:E1",
            "milestone_desc": "Ship version 1.0.",
            "labels": ["type:story", "epic:E1"],
            "stories": [
                ("QA regression suite", "Full regression + load tests.", []),
                ("Runbook + API contracts", "Refresh API_CONTRACTS.md and ops runbooks.", []),
                ("Telemetry benchmarks + post‑mortems", "Archive dashboards and incident reviews.", []),
            ],
        },
    ]

    for sprint in sprints:
        ms_number = ensure_milestone(repo, sprint["title"], sprint["milestone_desc"])
        for story_title, summary, bullets in sprint["stories"]:
            body_lines = [summary, "", "Acceptance Criteria:"]
            if bullets:
                body_lines.extend([f"- {b}" for b in bullets])
            body_lines.extend(["", f"Milestone: {sprint['title']}"])
            ensure_issue(repo, story_title, "\n".join(body_lines), sprint["labels"], milestone=ms_number)

    print("✅ Seeded milestones and issues.")


if __name__ == "__main__":
    main()

