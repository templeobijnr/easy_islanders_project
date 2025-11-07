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

        # Detect if using Zep Cloud vs local Zep
        self.is_cloud = "getzep.com" in self.base_url
        # Zep Cloud uses /v1, local Zep uses /api/v1
        self.api_prefix = "/v1" if self.is_cloud else "/api/v1"

        # Track created sessions to avoid redundant creation calls
        self._created_sessions = set()

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
    # Session management
    # ------------------------------------------------------------------
    def create_session(self, session_id: str, user_id: str | None = None) -> bool:
        """
        Create a session in Zep Cloud.
        Required before adding memory to a new session.

        Args:
            session_id: The session ID (thread_id)
            user_id: Optional user ID associated with the session

        Returns:
            True if session created successfully or already exists, False otherwise
        """
        if not session_id:
            return False

        # Check if we've already created this session in this instance
        if session_id in self._created_sessions:
            return True

        url = f"{self.base_url}{self.api_prefix}/sessions/{session_id}"
        payload = {"session_uuid": session_id}
        if user_id:
            payload["user_uuid"] = user_id

        try:
            # First check if session exists
            resp = requests.get(url, headers=self.headers, timeout=self.timeout)
            if resp.ok:
                logger.debug("[ZEP] Session %s already exists", session_id)
                self._created_sessions.add(session_id)
                return True

            # Session doesn't exist, create it
            resp = requests.post(
                f"{self.base_url}{self.api_prefix}/sessions",
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            if resp.ok or resp.status_code == 409:  # 409 = already exists
                logger.info("[ZEP] Created session %s", session_id)
                self._created_sessions.add(session_id)
                self._record_success()
                return True
            else:
                logger.warning("[ZEP] create_session failed %s: %s", resp.status_code, resp.text)
                self._record_failure()
                return False
        except Exception as exc:  # noqa: BLE001
            logger.error("[ZEP] create_session exception: %s", exc)
            self._record_failure()
            return False

    # ------------------------------------------------------------------
    # Write memory
    # ------------------------------------------------------------------
    def add_memory(self, thread_id: str, role: str, content: str) -> None:
        """
        Add a memory message to a session.
        For Zep Cloud, automatically creates the session if it doesn't exist (handles 404).

        Args:
            thread_id: The session ID
            role: Message role (e.g., "user", "assistant")
            content: Message content
        """
        if not thread_id or not content:
            return

        url = f"{self.base_url}{self.api_prefix}/sessions/{thread_id}/memory"
        payload = {"role": role, "content": content}

        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=self.timeout)

            # Success
            if resp.ok:
                self._record_success()
                return

            # Handle 404: session doesn't exist (common with Zep Cloud)
            if resp.status_code == 404:
                logger.info("[ZEP] Session %s not found, creating it", thread_id)
                if self.create_session(thread_id):
                    # Retry after creating session
                    retry_resp = requests.post(url, json=payload, headers=self.headers, timeout=self.timeout)
                    if retry_resp.ok:
                        logger.info("[ZEP] Successfully added memory after creating session %s", thread_id)
                        self._record_success()
                        return
                    else:
                        logger.error(
                            "[ZEP] Failed to add memory after creating session: %s: %s",
                            retry_resp.status_code,
                            retry_resp.text
                        )
                        self._record_failure()
                else:
                    logger.error("[ZEP] Failed to create session %s, cannot add memory", thread_id)
                    self._record_failure()
            else:
                # Other error
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

        url = f"{self.base_url}{self.api_prefix}/sessions/{thread_id}/search"
        payload = {"text": query, "limit": limit}
        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=self.timeout)

            # Handle 404: session doesn't exist yet (expected for new threads)
            if resp.status_code == 404:
                logger.debug(
                    "[ZEP] query_memory: session %s not found (expected for new threads)",
                    thread_id
                )
                # Don't record as failure - this is expected behavior
                return []

            # Handle other errors
            if not resp.ok:
                logger.warning("[ZEP] query_memory failed %s: %s", resp.status_code, resp.text)
                self._record_failure()
                return []

            # Parse successful response
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
