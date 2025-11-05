"""Lightweight REST client for interacting with the Zep long-term memory service."""

from __future__ import annotations

import logging
import os
from typing import List

import requests


logger = logging.getLogger(__name__)


class ZepClient:
    """Minimal wrapper around Zep's HTTP API for storing and retrieving memory."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None, *, timeout: float = 5.0, max_retries: int = 5, failure_threshold: int = 5, cooldown_seconds: float = 60.0) -> None:
        env_base = os.getenv("ZEP_URL")
        env_key = os.getenv("ZEP_API_KEY")
        base = base_url or env_base or "http://localhost:8001"
        self.base_url = base.rstrip("/")
        key = api_key or env_key or "local-dev-key"
        self.headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.timeout = timeout
        self.max_retries = max_retries
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        # Circuit breaker state
        self._failure_count = 0
        self._circuit_open_until = 0.0  # timestamp when circuit can try again

    def _is_circuit_open(self) -> bool:
        """Check if circuit breaker is open."""
        import time
        now = time.monotonic()
        if self._circuit_open_until > 0 and now < self._circuit_open_until:
            return True
        if self._circuit_open_until > 0 and now >= self._circuit_open_until:
            # Cooldown expired, reset and allow retry
            logger.info("[ZEP] Circuit breaker cooldown expired, allowing retry")
            self._failure_count = 0
            self._circuit_open_until = 0.0
        return False

    def _record_success(self) -> None:
        """Record successful call, reset circuit breaker."""
        self._failure_count = 0
        self._circuit_open_until = 0.0

    def _record_failure(self) -> None:
        """Record failure, potentially open circuit breaker."""
        import time
        self._failure_count += 1
        if self._failure_count >= self.failure_threshold:
            self._circuit_open_until = time.monotonic() + self.cooldown_seconds
            logger.warning(
                "[ZEP] Circuit breaker OPEN after %d failures (cooldown: %ds)",
                self._failure_count,
                self.cooldown_seconds,
            )

    # ------------------------------------------------------------------
    # Write memory
    # ------------------------------------------------------------------
    def add_memory(self, thread_id: str, role: str, content: str) -> None:
        if not thread_id or not content:
            return
        url = f"{self.base_url}/api/v1/sessions/{thread_id}/memory"
        payload = {"role": role, "content": content}
        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=self.timeout)
            if resp.ok:
                self._record_success()
            else:
                logger.warning("[ZEP] add_memory failed %s: %s", resp.status_code, resp.text)
                self._record_failure()
        except Exception as exc:  # noqa: BLE001
            logger.error("[ZEP] add_memory exception: %s", exc)
            self._record_failure()

    # ------------------------------------------------------------------
    # Retrieve semantic memory
    # ------------------------------------------------------------------
    def query_memory(self, thread_id: str, query: str, *, limit: int = 5) -> List[str]:
        if not thread_id or not query:
            return []

        # Circuit breaker check - degrade to WRITE_ONLY if open
        if self._is_circuit_open():
            logger.warning(
                "[ZEP] Circuit breaker OPEN - skipping query_memory (WRITE_ONLY mode), thread=%s",
                thread_id,
            )
            return []

        url = f"{self.base_url}/api/v1/sessions/{thread_id}/search"
        payload = {"text": query, "limit": limit}
        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=self.timeout)
            if not resp.ok:
                logger.warning("[ZEP] query_memory failed %s: %s", resp.status_code, resp.text)
                self._record_failure()
                return []
            data = resp.json()
            results = data.get("results", []) if isinstance(data, dict) else []
            contents: List[str] = []
            for item in results:
                if isinstance(item, dict) and item.get("content"):
                    contents.append(str(item["content"]))
            self._record_success()
            return contents
        except Exception as exc:  # noqa: BLE001
            logger.error("[ZEP] query_memory exception: %s", exc)
            self._record_failure()
            return []


__all__ = ["ZepClient"]
