"""
Thin HTTP client for the Zep memory service.

The design goal is operational safety: bounded latency, minimal dependencies,
and clear failure semantics so the caller can decide when to fall back.
"""
from __future__ import annotations

import json
import logging
import random
import time
from datetime import datetime, timezone
from dataclasses import dataclass
from threading import Lock
from typing import Any, Dict, Iterable, Optional, Sequence, Literal, List
from urllib.parse import urlparse

import requests
from email.utils import parsedate_to_datetime

logger = logging.getLogger(__name__)


class ZepClientError(RuntimeError):
    """Base error for Zep client failures."""


class ZepRequestError(ZepClientError):
    """Raised when Zep returns a non-2xx response or the request fails."""

    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        payload: Optional[Any] = None,
        retry_after: Optional[float] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload
        self.retry_after = retry_after


class ZepCircuitOpenError(ZepClientError):
    """Raised when the circuit breaker is open and the client refuses to call Zep."""


def _join_url(base_url: str, path: str) -> str:
    if base_url.endswith("/"):
        base = base_url[:-1]
    else:
        base = base_url
    if path.startswith("/"):
        return f"{base}{path}"
    return f"{base}/{path}"


def _default_headers(api_key: Optional[str], base_url: Optional[str] = None) -> Dict[str, str]:
    """Build default headers with broad compatibility for Zep Cloud variants.
    
    Includes comprehensive browser-like headers to bypass Cloudflare bot detection.
    """
    # Modern Chrome user agent (updated to latest stable)
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    
    # Extract origin from base_url (scheme + netloc only, no path)
    origin = "https://www.google.com"
    referer = "https://www.google.com/"
    if base_url:
        parsed = urlparse(base_url)
        # Origin should be scheme + netloc only (no trailing slash)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        # Referer can include path
        referer = base_url.rstrip("/") + "/"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        # Cloudflare blocks "bot"-looking clients; present a modern browser UA and headers.
        "User-Agent": user_agent,
        # Chrome security headers (helps bypass Cloudflare)
        "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        # Origin header for CORS requests (scheme + netloc only)
        "Origin": origin,
        # Referer helps with Cloudflare validation
        "Referer": referer,
    }
    if api_key:
        headers["Authorization"] = f"Api-Key {api_key}"
        # Keep x-api-key for compatibility with proxies that prefer it
        headers["x-api-key"] = api_key
    return headers


def _extract_error_body(response: Optional[requests.Response]) -> Optional[Any]:
    if response is None:
        return None
    try:
        return response.json()
    except (ValueError, json.JSONDecodeError):
        return response.text


def _truncate_payload(payload: Optional[Any], *, limit: int = 512) -> Optional[str]:
    if payload is None:
        return None
    if isinstance(payload, (bytes, bytearray)):
        try:
            payload = payload.decode()
        except Exception:
            payload = repr(payload)
    if not isinstance(payload, str):
        try:
            payload = json.dumps(payload)
        except Exception:
            payload = str(payload)
    payload = payload.strip()
    if len(payload) <= limit:
        return payload
    return payload[:limit] + "…"


def _retry_after_seconds(response: requests.Response, *, default: float = 1.0) -> float:
    header = response.headers.get("Retry-After")
    if not header:
        return default
    header = header.strip()
    if not header:
        return default
    try:
        delay = float(header)
    except ValueError:
        try:
            retry_dt = parsedate_to_datetime(header)
        except (TypeError, ValueError, OverflowError):
            return default
        if retry_dt is None:
            return default
        now = datetime.now(timezone.utc if retry_dt.tzinfo is None else retry_dt.tzinfo)
        delay = max(0.0, (retry_dt - now).total_seconds())
    delay = max(default, delay)
    return min(delay, 10.0)


@dataclass(frozen=True)
class _RequestConfig:
    timeout_seconds: float
    max_retries: int
    failure_threshold: int
    cooldown_seconds: float


class ZepClient:
    """
    Minimal Zep API client with retries and a simple circuit breaker.

    Retries:
        - Up to `max_retries` additional attempts (default: 2) for timeouts / 5xx.
        - Exponential backoff with jitter (bounded to < 0.5s total sleep).
    Circuit breaker:
        - Opens after `failure_threshold` consecutive transient failures.
        - Remains open for `cooldown_seconds`, then allows another attempt.
    """

    def __init__(
        self,
        base_url: str,
        *,
        api_key: Optional[str] = None,
        timeout_ms: int = 1500,
        max_retries: int = 2,
        failure_threshold: int = 3,
        cooldown_seconds: float = 30.0,
        session: Optional[requests.Session] = None,
        proxies: Optional[Dict[str, str]] = None,
        api_version: Literal["v1", "v2", "auto"] = "auto",
    ) -> None:
        if not base_url:
            raise ValueError("base_url is required for ZepClient")
        self.base_url = base_url
        self.api_key = api_key
        self._session = session or requests.Session()
        if proxies:
            # Route requests through an explicit proxy when supplied (e.g., host egress)
            self._session.proxies.update(proxies)
        # Pass base_url to headers function for Origin/Referer headers
        self._headers = _default_headers(api_key, base_url=base_url)
        version_pref = api_version if api_version in ("v1", "v2") else "auto"
        self._version_pref: Literal["v1", "v2", "auto"] = version_pref
        self._negotiated_version: Optional[Literal["v1", "v2"]] = (
            version_pref if version_pref in ("v1", "v2") else None
        )
        # Public attribute for diagnostics (auto until resolved)
        self.api_version: Literal["v1", "v2", "auto"] = version_pref
        self._config = _RequestConfig(
            timeout_seconds=max(timeout_ms / 1000.0, 0.1),
            max_retries=max(max_retries, 0),
            failure_threshold=max(failure_threshold, 1),
            cooldown_seconds=max(cooldown_seconds, 1.0),
        )
        self._lock = Lock()
        self._failure_count = 0
        self._circuit_open_until = 0.0

    # --- Public API -----------------------------------------------------

    def _preferred_versions(self) -> Sequence[str]:
        """Return API versions to attempt in order of preference."""
        if self._negotiated_version:
            primary = self._negotiated_version
            secondary = "v1" if primary == "v2" else "v2"
            return (primary, secondary)
        if self._version_pref == "v1":
            return ("v1", "v2")
        if self._version_pref == "v2":
            return ("v2", "v1")
        # auto-detect defaults to v2 first, then v1
        return ("v2", "v1")

    def _effective_version(self) -> Literal["v1", "v2"]:
        if self._negotiated_version:
            return self._negotiated_version
        if self._version_pref in ("v1", "v2"):
            return self._version_pref
        # auto (undetermined) defaults to v2 until a v1 endpoint succeeds
        return "v2"

    def _mark_version_success(self, version: str) -> None:
        if version not in ("v1", "v2"):
            return
        if self._negotiated_version is None and self._version_pref == "auto":
            self._negotiated_version = version  # cache negotiated version
        self.api_version = version  # expose resolved version for callers

    def ensure_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"userId": str(user_id)}
        if email:
            payload["email"] = email
        if first_name:
            payload["firstName"] = first_name
        if last_name:
            payload["lastName"] = last_name
        # Some Zep deployments return 409 (conflict) when the user already exists.
        # Treat that as a successful ensure. v1 deployments typically skip explicit users.
        for version in self._preferred_versions():
            if version == "v1":
                self._mark_version_success("v1")
                logger.debug(
                    "zep_user_implicit_v1",
                    extra={"user_id": user_id},
                )
                return {}
            path = f"/api/{version}/users"
            try:
                resp = self._request_json(
                    "POST",
                    path,
                    json_payload=payload,
                    expected_status=(200, 201, 409),
                )
            except ZepRequestError as exc:
                if exc.status_code in (404, 405):
                    continue
                raise
            else:
                self._mark_version_success(version)
                return resp or {}

        logger.debug(
            "zep_user_endpoint_unavailable",
            extra={"user_id": user_id},
        )
        return {}

    def ensure_thread(self, thread_id: str, user_id: str) -> Dict[str, Any]:
        """
        Ensure a session exists for the given user/thread.

        API variants observed:
        - v1:             POST /api/v1/sessions {sessionId,userId}
        - v2 (nested):    POST /api/v2/users/{userId}/sessions
        - v2 (flat):      POST /api/v2/sessions

        Strategy:
        - Try negotiated/preferred version first.
        - v1 deployments auto-create sessions via /memory writes; skip explicit ensures.
        - On 404/405, fall back to alternates.
        - Accept 409 as "already exists".
        """
        payload = {"sessionId": str(thread_id), "userId": str(user_id)}
        for version in self._preferred_versions():
            if version == "v1":
                # v1 sessions are implicitly created when writing to /memory.
                self._mark_version_success("v1")
                logger.debug(
                    "zep_session_auto_create_v1",
                    extra={"thread_id": thread_id},
                )
                return {}

            # version == "v2"
            last_exc: Optional[Exception] = None
            for path in (
                f"/api/v2/users/{user_id}/sessions",
                "/api/v2/sessions",
            ):
                try:
                    resp = self._request_json(
                        "POST",
                        path,
                        json_payload=payload,
                        expected_status=(200, 201, 202, 409),
                    )
                except ZepRequestError as exc:
                    last_exc = exc
                    if exc.status_code in (404, 405):
                        continue
                    raise
                else:
                    self._mark_version_success("v2")
                    return resp or {}

            if isinstance(last_exc, ZepRequestError) and last_exc.status_code in (404, 405):
                # Try the next version candidate (v1)
                continue
            if last_exc:
                raise last_exc

        logger.debug(
            "zep_session_endpoint_unavailable",
            extra={"thread_id": thread_id, "user_id": user_id},
        )
        return {}

    def add_messages(
        self,
        thread_id: str,
        messages: Iterable[Dict[str, Any]],
    ) -> Dict[str, Any]:
        payload = {"messages": list(messages)}
        paths: List[tuple[str, str]] = []
        seen: set[str] = set()
        for version in self._preferred_versions():
            memory_path = f"/api/{version}/sessions/{thread_id}/memory"
            if memory_path not in seen:
                paths.append((version, memory_path))
                seen.add(memory_path)
            if version == "v2":
                legacy_messages = f"/api/v2/sessions/{thread_id}/messages"
                if legacy_messages not in seen:
                    paths.append(("v2", legacy_messages))
                    seen.add(legacy_messages)

        last_exc: Optional[Exception] = None
        for version, path in paths:
            try:
                resp = self._request_json(
                    "POST",
                    path,
                    json_payload=payload,
                    expected_status=(200, 201, 202),
                )
            except ZepRequestError as exc:
                last_exc = exc
                if exc.status_code in (404, 405):
                    continue
                raise
            else:
                self._mark_version_success(version)
                return resp or {}

        if isinstance(last_exc, ZepRequestError) and last_exc.status_code in (404, 405):
            logger.debug(
                "zep_memory_endpoint_unavailable",
                extra={"thread_id": thread_id, "attempted": [p for _, p in paths]},
            )
            return {}
        if last_exc:
            raise last_exc
        return {}

    def get_user_context(
        self,
        thread_id: str,
        mode: str = "summary",
    ) -> Dict[str, Any]:
        if mode not in {"summary", "basic"}:
            raise ValueError("mode must be either 'summary' or 'basic'")
        candidates: List[tuple[str, str]] = []
        seen: set[str] = set()
        for version in self._preferred_versions():
            path = f"/api/{version}/sessions/{thread_id}/memory"
            if path not in seen:
                candidates.append((version, path))
                seen.add(path)

        response: Optional[Dict[str, Any]] = None
        last_exc: Optional[Exception] = None
        for version, path in candidates:
            try:
                response = self._request_json(
                    "GET",
                    path,
                    params={"mode": mode},
                    expected_status=(200, 204),
                )
            except ZepRequestError as exc:
                last_exc = exc
                if exc.status_code in (404, 405):
                    continue
                raise
            else:
                self._mark_version_success(version)
                break

        if response is None:
            if isinstance(last_exc, ZepRequestError) and last_exc.status_code in (404, 405):
                logger.debug(
                    "zep_context_not_found",
                    extra={"thread_id": thread_id, "attempted": [p for _, p in candidates]},
                )
                response = {}
            elif last_exc:
                raise last_exc
            else:
                response = {}
        # Normalise missing fields to keep downstream callers simple.
        if not isinstance(response, dict):
            response = {}
        return {
            "context": response.get("context") or "",
            "facts": response.get("facts") or [],
            "recent": response.get("recent") or [],
        }

    def graph_add(self, user_id: str, *, data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {"type": data_type, "data": data}
        # Graph endpoint primarily available on v2; attempt v2 then v1 as fallback
        try:
            resp = self._request_json(
                "POST",
                f"/api/v2/users/{user_id}/graph",
                json_payload=payload,
                expected_status=(200, 201, 202),
            )
        except ZepRequestError as exc:
            if exc.status_code in (404, 405):
                resp = self._request_json(
                    "POST",
                    f"/api/v1/users/{user_id}/graph",
                    json_payload=payload,
                    expected_status=(200, 201, 202),
                )
            else:
                raise
        return resp or {}

    # --- Internal helpers -----------------------------------------------

    @property
    def session(self) -> requests.Session:
        return self._session

    def _request_json(
        self,
        method: str,
        path: str,
        *,
        json_payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        expected_status: Sequence[int],
    ) -> Optional[Dict[str, Any]]:
        response = self._request(
            method,
            path,
            json_payload=json_payload,
            params=params,
            expected_status=expected_status,
        )
        if response.status_code == 204:
            return None
        try:
            return response.json()
        except (ValueError, json.JSONDecodeError) as exc:
            logger.warning(
                "zep_client_invalid_json",
                extra={"status": response.status_code, "path": path, "error": str(exc)},
            )
            return None

    def _request(
        self,
        method: str,
        path: str,
        *,
        json_payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        expected_status: Sequence[int],
    ) -> requests.Response:
        self._ensure_circuit_allows()
        url = _join_url(self.base_url, path)
        attempt = 0
        response: Optional[requests.Response] = None
        last_error: Optional[Exception] = None

        while True:
            sleep_override: Optional[float] = None
            try:
                response = self.session.request(
                    method,
                    url,
                    headers=self._headers,
                    json=json_payload,
                    params=params,
                    timeout=self._config.timeout_seconds,
                )
            except (requests.Timeout, requests.ConnectionError) as exc:
                last_error = exc
                self._record_failure(transient=True)
                logger.warning(
                    "zep_http_request_exception",
                    extra={
                        "method": method,
                        "path": path,
                        "error": exc.__class__.__name__,
                        "error_message": str(exc),
                        "attempt": attempt + 1,
                    },
                )
            else:
                if response.status_code in expected_status:
                    self._reset_failures()
                    return response

                error_payload = _extract_error_body(response)
                logger.warning(
                    "zep_http_status_unexpected",
                    extra={
                        "method": method,
                        "path": path,
                        "status_code": response.status_code,
                        "attempt": attempt + 1,
                        "api_version": self.api_version,
                        "host": urlparse(self.base_url).netloc,
                        "body_preview": _truncate_payload(error_payload),
                    },
                )

                if response.status_code == 429:
                    payload = _extract_error_body(response)
                    sleep_override = _retry_after_seconds(response)
                    error = ZepRequestError(
                        "Zep request throttled (429)",
                        status_code=response.status_code,
                        payload=payload,
                        retry_after=sleep_override,
                    )
                    last_error = error
                    logger.warning(
                        "zep_client_throttled",
                        extra={
                            "path": path,
                            "retry_after_seconds": round(sleep_override, 3),
                        },
                    )
                elif response.status_code >= 500:
                    payload = _extract_error_body(response)
                    error = ZepRequestError(
                        f"Zep request failed with status {response.status_code}",
                        status_code=response.status_code,
                        payload=payload,
                    )
                    last_error = error
                    self._record_failure(transient=True)
                elif response.status_code >= 400:
                    payload = _extract_error_body(response)
                    error = ZepRequestError(
                        f"Zep request failed with status {response.status_code}",
                        status_code=response.status_code,
                        payload=payload,
                    )
                    self._record_failure(transient=False)
                    raise error
                else:
                    payload = _extract_error_body(response)
                    error = ZepRequestError(
                        f"Unexpected status code {response.status_code}",
                        status_code=response.status_code,
                        payload=payload,
                    )
                    last_error = error
                    self._record_failure(transient=True)

                if response.status_code != 429:
                    sleep_override = None

            attempt += 1
            if attempt > self._config.max_retries:
                if isinstance(last_error, ZepClientError):
                    raise last_error
                raise ZepRequestError(str(last_error or "Zep request failed")) from last_error

            sleep_for = sleep_override if sleep_override is not None else self._backoff_with_jitter(attempt)
            logger.debug(
                "zep_client_retrying",
                extra={
                    "path": path,
                    "attempt": attempt,
                    "sleep_seconds": round(sleep_for, 3),
                    "error": str(last_error),
                },
            )
            time.sleep(sleep_for)

    def _ensure_circuit_allows(self) -> None:
        with self._lock:
            now = time.monotonic()
            if self._circuit_open_until and now >= self._circuit_open_until:
                # Cooldown complete; reset counters and allow request.
                self._failure_count = 0
                self._circuit_open_until = 0.0
            if self._circuit_open_until and now < self._circuit_open_until:
                raise ZepCircuitOpenError("Circuit breaker open; skipping Zep call")

    def _record_failure(self, *, transient: bool) -> None:
        if not transient:
            # Client errors should not open the circuit.
            return
        with self._lock:
            self._failure_count += 1
            if self._failure_count >= self._config.failure_threshold:
                self._circuit_open_until = time.monotonic() + self._config.cooldown_seconds
                logger.warning(
                    "zep_client_circuit_open",
                    extra={
                        "failures": self._failure_count,
                        "cooldown_seconds": self._config.cooldown_seconds,
                    },
                )

    def _reset_failures(self) -> None:
        with self._lock:
            self._failure_count = 0
            self._circuit_open_until = 0.0

    @staticmethod
    def _backoff_with_jitter(attempt: int) -> float:
        # attempt starts at 1 for the first retry.
        base = min(0.4, 0.1 * (2 ** (attempt - 1)))
        jitter = random.uniform(0.05, 0.15)
        return min(0.5, base + jitter)


__all__ = [
    "ZepClient",
    "ZepClientError",
    "ZepRequestError",
    "ZepCircuitOpenError",
]
