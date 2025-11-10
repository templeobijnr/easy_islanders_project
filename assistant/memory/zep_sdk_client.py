"""
Zep Cloud SDK wrapper providing backward-compatible interface.

Migrates from custom HTTP client to official zep-cloud SDK.
Uses correct /api/v2/threads/ endpoints instead of deprecated /sessions/.

Official Zep Cloud v2 API:
- POST /api/v2/threads - Create thread
- POST /api/v2/threads/{threadId}/messages - Add messages
- POST /api/v2/threads/{threadId}/messages-batch - Batch add
- GET /api/v2/threads/{threadId}/context - Get context
"""
from __future__ import annotations

import logging
import time
from threading import Lock
from typing import Any, Dict, Iterable, Optional, Literal

logger = logging.getLogger(__name__)

# Import metrics for skipped writes (same as original client)
try:
    from assistant.monitoring.metrics import inc_zep_write_skipped
    _METRICS_AVAILABLE = True
except ImportError:
    _METRICS_AVAILABLE = False
    def inc_zep_write_skipped(op: str, reason: str) -> None:
        pass


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


class ZepCloudClient:
    """
    Wrapper around official Zep Cloud SDK with backward-compatible API.

    Maps our existing ZepClient methods to Zep Cloud SDK calls using
    correct /api/v2/threads/ endpoints.
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
        session: Optional[Any] = None,  # Ignored, for compatibility
        proxies: Optional[Dict[str, str]] = None,  # Ignored, for compatibility
        api_version: Literal["v1", "v2", "auto"] = "auto",
    ) -> None:
        """
        Initialize Zep Cloud SDK client.

        Args:
            base_url: Zep API base URL (must be api.getzep.com for Cloud)
            api_key: Zep API key
            timeout_ms: Request timeout in milliseconds (passed to SDK)
            max_retries: Max retry attempts (for circuit breaker compatibility)
            failure_threshold: Circuit breaker failure threshold
            cooldown_seconds: Circuit breaker cooldown duration
            session: Ignored (compatibility with old client)
            proxies: Ignored (compatibility with old client)
            api_version: API version preference (Cloud SDK always uses v2)
        """
        # Validate we're pointing to Zep Cloud
        if "getzep.com" not in base_url.lower():
            logger.warning(
                "zep_sdk_non_cloud_base_url",
                extra={"base_url": base_url, "expected": "api.getzep.com"}
            )

        self.base_url = base_url.rstrip('/')  # Remove trailing slash
        self.api_key = api_key
        self.api_version = "v2"  # Always use v2 for Cloud API
        self.is_cloud = True

        # Circuit breaker state (same as original client)
        self._lock = Lock()
        self._failure_count = 0
        self._circuit_open_until = 0.0
        self._failure_threshold = max(failure_threshold, 1)
        self._cooldown_seconds = max(cooldown_seconds, 1.0)

        # DEBUG: Explicit initialization output
        print(f"[ZEP INIT] Base URL: {self.base_url}")
        print(f"[ZEP INIT] API Key present: {bool(api_key)}")
        print(f"[ZEP INIT] API Key length: {len(api_key) if api_key else 0}")
        print(f"[ZEP INIT] API Version: {self.api_version}")

        logger.info(
            "zep_http_client_initialized",
            extra={
                "base_url": base_url,
                "api_version": self.api_version,
                "timeout_ms": timeout_ms,
                "uses_direct_http": True,
            }
        )

    # --- Circuit Breaker (same as original client) ---

    def _ensure_circuit_allows(self) -> None:
        """Check if circuit breaker allows requests."""
        with self._lock:
            now = time.monotonic()
            if self._circuit_open_until and now >= self._circuit_open_until:
                # Cooldown complete; reset counters and allow request
                self._failure_count = 0
                self._circuit_open_until = 0.0
            if self._circuit_open_until and now < self._circuit_open_until:
                raise ZepCircuitOpenError("Circuit breaker open; skipping Zep call")

    def _record_failure(self, *, transient: bool) -> None:
        """Record a failure and potentially open circuit breaker."""
        if not transient:
            # Client errors should not open the circuit
            return
        with self._lock:
            self._failure_count += 1
            if self._failure_count >= self._failure_threshold:
                self._circuit_open_until = time.monotonic() + self._cooldown_seconds
                logger.warning(
                    "zep_client_circuit_open",
                    extra={
                        "failures": self._failure_count,
                        "cooldown_seconds": self._cooldown_seconds,
                    },
                )

    def _reset_failures(self) -> None:
        """Reset circuit breaker failure count."""
        with self._lock:
            self._failure_count = 0
            self._circuit_open_until = 0.0

    # --- Public API (backward compatible with ZepClient) ---

    def ensure_user(
        self,
        user_id: str,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Ensure user exists. Creates user if it doesn't exist.

        CRITICAL: Users MUST exist before creating threads per Zep Cloud docs.

        Maps to:
        - GET /api/v2/users/{userId} (check if exists)
        - POST /api/v2/users (create if not found)

        Args:
            user_id: User identifier
            email: Optional user email
            first_name: Optional first name
            last_name: Optional last name

        Returns:
            Empty dict on success
        """
        import requests

        print(f"[ZEP USER] Checking if user {user_id} exists")

        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }

        # Check if user exists
        check_url = f"{self.base_url}/api/v2/users/{user_id}"

        try:
            check_resp = requests.get(check_url, headers=headers, timeout=5)
            print(f"[ZEP USER] GET response: HTTP {check_resp.status_code}")

            if check_resp.status_code == 200:
                # User exists
                print(f"[ZEP USER] User {user_id} already exists")
                return {}

            if check_resp.status_code == 404:
                # User doesn't exist - create it
                create_url = f"{self.base_url}/api/v2/users"
                create_payload = {
                    "user_id": user_id,
                    "email": email or f"{user_id}@easy-islanders.local",
                    "first_name": first_name or "User",
                    "last_name": last_name or user_id[:8],
                }

                print(f"[ZEP USER] Creating user {user_id}")

                create_resp = requests.post(
                    create_url,
                    json=create_payload,
                    headers=headers,
                    timeout=10
                )

                if create_resp.status_code in (200, 201):
                    print(f"[ZEP USER] User created successfully: {user_id}")
                    logger.info(
                        "zep_user_created",
                        extra={"user_id": user_id}
                    )
                    return {}
                elif create_resp.status_code == 409:
                    # Conflict - user already exists (race condition)
                    print(f"[ZEP USER] User {user_id} already exists (409 conflict)")
                    return {}
                else:
                    error_body = create_resp.text
                    print(f"[ZEP USER ERROR] Failed to create user {user_id}: HTTP {create_resp.status_code}")
                    print(f"[ZEP USER ERROR] Response: {error_body[:500]}")

                    logger.warning(
                        "zep_user_creation_failed",
                        extra={
                            "user_id": user_id,
                            "status_code": create_resp.status_code,
                            "error": error_body[:500]
                        }
                    )
                    return {}

            # Unexpected status
            print(f"[ZEP USER ERROR] Unexpected status checking user {user_id}: HTTP {check_resp.status_code}")
            return {}

        except Exception as e:
            print(f"[ZEP USER ERROR] Exception ensuring user {user_id}: {str(e)}")
            logger.warning(
                "zep_ensure_user_error",
                extra={"user_id": user_id, "error": str(e)}
            )
            return {}

    def ensure_thread(self, thread_id: str, user_id: str) -> Dict[str, Any]:
        """
        Ensure thread exists. Creates thread if it doesn't exist.

        CRITICAL: User MUST exist before creating thread per Zep Cloud docs.

        Maps to:
        - GET /api/v2/threads/{threadId}/messages (check if exists - 404 means not found)
        - POST /api/v2/threads (create if not found)

        Args:
            thread_id: Thread identifier
            user_id: User identifier for thread ownership

        Returns:
            Empty dict on success
        """
        import requests

        print(f"[ZEP CREATE] Ensuring user {user_id} exists first")
        # CRITICAL: Create user BEFORE thread
        self.ensure_user(user_id)

        print(f"[ZEP CREATE] Checking if thread {thread_id} exists")

        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }

        # Check if thread exists by trying to get its messages
        # Per Zep docs: Direct GET /threads/{id} returns 405
        # Must use /threads/{id}/messages to check existence
        check_url = f"{self.base_url}/api/v2/threads/{thread_id}/messages"
        print(f"[ZEP CREATE] GET {check_url}")

        try:
            check_resp = requests.get(check_url, headers=headers, params={"lastn": 1}, timeout=5)
            print(f"[ZEP CREATE] GET response: HTTP {check_resp.status_code}")

            if check_resp.status_code == 200:
                # Thread exists
                logger.debug(
                    "zep_thread_exists",
                    extra={"thread_id": thread_id}
                )
                return {}

            if check_resp.status_code == 404:
                # Thread doesn't exist - create it
                create_url = f"{self.base_url}/api/v2/threads"
                create_payload = {
                    "thread_id": thread_id,  # FIXED: Zep API requires "thread_id" not "id"
                    "user_id": user_id,
                    "metadata": {
                        "source": "easy_islanders",
                        "app_version": "v2",
                        "created_by": "zep_sdk_client"
                    }
                }

                print(f"[ZEP CREATE] Creating thread {thread_id} for user {user_id}")

                create_resp = requests.post(
                    create_url,
                    json=create_payload,
                    headers=headers,
                    timeout=10
                )

                if create_resp.status_code in (200, 201):
                    logger.info(
                        "zep_thread_created",
                        extra={"thread_id": thread_id, "user_id": user_id}
                    )
                    print(f"[ZEP CREATE] Thread created successfully: {thread_id}")
                    return {}
                elif create_resp.status_code == 409:
                    # Thread already exists (race condition)
                    print(f"[ZEP CREATE] Thread {thread_id} already exists (409 Conflict)")
                    logger.info(
                        "zep_thread_already_exists",
                        extra={"thread_id": thread_id}
                    )
                    return {}
                else:
                    # Log creation failure
                    error_body = create_resp.text
                    print(f"[ZEP CREATE ERROR] Failed to create thread {thread_id}: HTTP {create_resp.status_code}")
                    print(f"[ZEP CREATE ERROR] Response: {error_body[:500]}")

                    logger.warning(
                        "zep_thread_creation_failed",
                        extra={
                            "thread_id": thread_id,
                            "status_code": create_resp.status_code,
                            "error": error_body[:500]
                        }
                    )
                    return {}

            # Unexpected status code - try creating anyway
            print(f"[ZEP CREATE WARN] Unexpected status checking thread {thread_id}: HTTP {check_resp.status_code}")
            print(f"[ZEP CREATE WARN] Response: {check_resp.text[:500]}")
            print(f"[ZEP CREATE WARN] Attempting to create thread anyway...")

            logger.warning(
                "zep_thread_check_unexpected_status",
                extra={"thread_id": thread_id, "status_code": check_resp.status_code}
            )

            # Still attempt thread creation in case it doesn't exist
            create_url = f"{self.base_url}/api/v2/threads"
            create_payload = {
                "thread_id": thread_id,  # FIXED: Zep API requires "thread_id" not "id"
                "user_id": user_id,
                "metadata": {
                    "source": "easy_islanders",
                    "app_version": "v2",
                    "created_by": "zep_sdk_client",
                    "created_after_unexpected_check": True
                }
            }

            print(f"[ZEP CREATE] Creating thread {thread_id} for user {user_id} (after unexpected check)")

            create_resp = requests.post(
                create_url,
                json=create_payload,
                headers=headers,
                timeout=10
            )

            if create_resp.status_code in (200, 201):
                logger.info(
                    "zep_thread_created",
                    extra={"thread_id": thread_id, "user_id": user_id, "after_unexpected_check": True}
                )
                print(f"[ZEP CREATE] Thread created successfully: {thread_id}")
                return {}
            elif create_resp.status_code == 409:
                # Thread already exists (race condition or check endpoint issue)
                print(f"[ZEP CREATE] Thread {thread_id} already exists (409 Conflict)")
                logger.info(
                    "zep_thread_already_exists",
                    extra={"thread_id": thread_id}
                )
                return {}
            else:
                # Failed to create
                error_body = create_resp.text
                print(f"[ZEP CREATE ERROR] Failed to create thread {thread_id}: HTTP {create_resp.status_code}")
                print(f"[ZEP CREATE ERROR] Response: {error_body[:500]}")

                logger.warning(
                    "zep_thread_creation_failed",
                    extra={
                        "thread_id": thread_id,
                        "status_code": create_resp.status_code,
                        "error": error_body[:500]
                    }
                )
                return {}

        except Exception as e:
            logger.warning(
                "zep_ensure_thread_error",
                extra={"thread_id": thread_id, "error": str(e)}
            )
            print(f"[ZEP CREATE ERROR] Exception ensuring thread {thread_id}: {str(e)}")
            return {}

    def add_messages(
        self,
        thread_id: str,
        messages: Iterable[Dict[str, Any]],
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Add messages to a thread.

        IMPORTANT: Threads must exist before adding messages. Pass user_id to
        auto-create thread if it doesn't exist.

        Maps to: POST /api/v2/threads/{threadId}/messages

        Args:
            thread_id: Thread identifier
            messages: List of message dicts with 'role' and 'content'
            user_id: User identifier (required to auto-create threads)

        Returns:
            Empty dict on success (matches original client behavior)
        """
        self._ensure_circuit_allows()

        # Ensure thread exists before adding messages (Zep requirement)
        if not user_id:
            # Auto-lookup user_id from database if not provided
            print(f"[ZEP] No user_id provided, looking up from database for thread {thread_id}")
            user_id = self._lookup_user_id_from_thread(thread_id)

        if user_id:
            print(f"[ZEP] Ensuring thread {thread_id} exists before adding messages")
            self.ensure_thread(thread_id, user_id)
        else:
            # No user_id available - attempt without thread creation
            # Will fail with 404 if thread doesn't exist
            print(f"[ZEP] WARNING: No user_id available for thread {thread_id} - cannot create thread")
            logger.warning(
                "zep_add_messages_no_user_id",
                extra={"thread_id": thread_id, "warning": "user_id not available - thread may not exist"}
            )

        messages_list = list(messages)

        # GUARD: Never enqueue empty messages arrays to Zep
        if not messages_list:
            logger.info(
                "zep_write_skipped_empty_array",
                extra={"thread_id": thread_id, "reason": "empty"}
            )
            inc_zep_write_skipped("add_messages", "empty_array")
            return {}

        # GUARD: Filter out messages with empty or too-short content
        valid_messages = []
        for msg in messages_list:
            content = (msg.get("content") or "").strip()
            role = msg.get("role", "")

            if not content:
                logger.info(
                    "zep_write_skipped_empty_content",
                    extra={"thread_id": thread_id, "role": role, "reason": "empty"}
                )
                inc_zep_write_skipped("add_messages", "empty_content")
                continue

            if len(content) < 2:
                logger.info(
                    "zep_write_skipped_short_content",
                    extra={"thread_id": thread_id, "role": role, "length": len(content), "reason": "too_short"}
                )
                inc_zep_write_skipped("add_messages", "content_too_short")
                continue

            valid_messages.append(msg)

        # If no valid messages after filtering, skip write
        if not valid_messages:
            logger.info(
                "zep_write_skipped_no_valid_messages",
                extra={"thread_id": thread_id, "original_count": len(messages_list), "reason": "empty"}
            )
            inc_zep_write_skipped("add_messages", "no_valid_messages")
            return {}

        # Use direct HTTP API call with official schema
        # Official schema: POST /api/v2/threads/{threadId}/messages
        # { "messages": [ {"role": "string", "content": "string", ...} ] }
        try:
            import requests

            # Build payload matching official Zep API schema
            payload = {
                "messages": [
                    {
                        "role": msg.get("role", "user"),
                        "content": msg["content"],
                        "metadata": msg.get("metadata"),
                        "name": msg.get("name"),
                    }
                    for msg in valid_messages
                ]
            }

            # Direct HTTP call to official endpoint
            url = f"{self.base_url}/api/v2/threads/{thread_id}/messages"
            headers = {
                "Authorization": f"Api-Key {self.api_key}",
                "Content-Type": "application/json",
            }

            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=10
            )

            # Check response status
            if response.status_code in (200, 201, 202):
                self._reset_failures()
                logger.info(
                    "zep_memory_added",
                    extra={
                        "thread_id": thread_id,
                        "message_count": len(valid_messages),
                        "status_code": response.status_code,
                    }
                )

                # Return message UUIDs if provided
                try:
                    result = response.json()
                    return result if result else {}
                except:
                    return {}

            # Handle error responses
            self._record_failure(transient=(500 <= response.status_code < 600))

            error_body = None
            try:
                error_body = response.json()
            except:
                error_body = response.text

            # DEBUG: Explicit error output (structured logging extra fields not always visible)
            print(f"[ZEP ERROR] POST {url} → HTTP {response.status_code}")
            print(f"[ZEP ERROR] Response body: {str(error_body)[:500]}")
            print(f"[ZEP ERROR] Thread ID: {thread_id}")

            logger.warning(
                "zep_add_messages_failed",
                extra={
                    "thread_id": thread_id,
                    "status_code": response.status_code,
                    "error_body": str(error_body)[:500],
                    "url": url,
                }
            )

            raise ZepRequestError(
                f"Failed to add messages: HTTP {response.status_code}",
                status_code=response.status_code,
                payload=error_body
            )

        except requests.RequestException as e:
            self._record_failure(transient=True)

            # DEBUG: Explicit error output
            print(f"[ZEP ERROR] RequestException: {type(e).__name__}: {str(e)}")
            print(f"[ZEP ERROR] Thread ID: {thread_id}")

            logger.warning(
                "zep_add_messages_network_error",
                extra={
                    "thread_id": thread_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                }
            )

            raise ZepRequestError(
                f"Network error adding messages: {str(e)}",
                status_code=None
            ) from e

        except Exception as e:
            self._record_failure(transient=self._is_transient_error(e))

            status_code = self._extract_status_code(e)

            # DEBUG: Explicit error output
            print(f"[ZEP ERROR] Unexpected exception: {type(e).__name__}: {str(e)}")
            print(f"[ZEP ERROR] Status code extracted: {status_code}")
            print(f"[ZEP ERROR] Thread ID: {thread_id}")

            logger.warning(
                "zep_add_messages_unexpected_error",
                extra={
                    "thread_id": thread_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "status_code": status_code,
                }
            )

            raise ZepRequestError(
                f"Unexpected error adding messages: {str(e)}",
                status_code=status_code
            ) from e

    def get_user_context(
        self,
        thread_id: str,
        mode: str = "summary",
    ) -> Dict[str, Any]:
        """
        Get memory context for a thread.

        Maps to: GET /api/v2/threads/{threadId}/messages

        Args:
            thread_id: Thread identifier
            mode: Context retrieval mode (summary uses lastn=10)

        Returns:
            Dict with 'context', 'facts', and 'recent' fields
        """
        self._ensure_circuit_allows()

        try:
            import requests

            # Use messages endpoint: GET /api/v2/threads/{threadId}/messages
            # Query params: lastn for recent messages
            url = f"{self.base_url}/api/v2/threads/{thread_id}/messages"
            headers = {
                "Authorization": f"Api-Key {self.api_key}",
                "Accept": "application/json",
            }

            # Get last 10 messages for context
            params = {"lastn": 10}

            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=10
            )

            # Handle responses
            if response.status_code == 404:
                # Thread doesn't exist yet - expected for new conversations
                logger.debug(
                    "zep_context_not_found",
                    extra={"thread_id": thread_id}
                )
                return {
                    "context": "",
                    "facts": [],
                    "recent": [],
                }

            if response.status_code == 200:
                self._reset_failures()

                data = response.json()
                messages = data.get("messages", [])

                # Convert to our expected format
                result = {
                    "context": "",  # Build context from messages
                    "facts": [],
                    "recent": [
                        {
                            "role": msg.get("role"),
                            "content": msg.get("content"),
                            "uuid": msg.get("uuid"),
                            "created_at": msg.get("created_at"),
                        }
                        for msg in messages
                    ],
                }

                # Build simple context summary from recent messages
                if messages:
                    summary_parts = []
                    for msg in messages[-5:]:  # Last 5 messages
                        role = msg.get("role", "unknown")
                        content = msg.get("content", "")
                        if content:
                            summary_parts.append(f"[{role}] {content[:100]}")
                    result["context"] = " | ".join(summary_parts)

                logger.debug(
                    "zep_context_fetched",
                    extra={
                        "thread_id": thread_id,
                        "recent_count": len(result["recent"]),
                        "total_count": data.get("total_count", 0),
                    }
                )

                return result

            # Handle error responses
            self._record_failure(transient=(500 <= response.status_code < 600))

            logger.warning(
                "zep_get_context_failed",
                extra={
                    "thread_id": thread_id,
                    "status_code": response.status_code,
                    "response": response.text[:500],
                }
            )

            # Return empty context on error
            return {
                "context": "",
                "facts": [],
                "recent": [],
            }

        except requests.RequestException as e:
            self._record_failure(transient=True)

            logger.warning(
                "zep_get_context_network_error",
                extra={
                    "thread_id": thread_id,
                    "error": str(e),
                }
            )

            return {
                "context": "",
                "facts": [],
                "recent": [],
            }

        except Exception as e:
            self._record_failure(transient=self._is_transient_error(e))

            logger.warning(
                "zep_get_context_unexpected_error",
                extra={
                    "thread_id": thread_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                }
            )

            return {
                "context": "",
                "facts": [],
                "recent": [],
            }

    def graph_add(self, user_id: str, *, data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add data to user's knowledge graph.

        Maps to: POST /api/v2/graph

        Note: Graph operations are handled by GraphManager using the same SDK.
        This method is here for backward compatibility but should not be used.
        """
        logger.warning(
            "zep_graph_add_deprecated",
            extra={"user_id": user_id, "data_type": data_type}
        )
        # Delegate to GraphManager instead
        return {}

    @property
    def session(self):
        """Compatibility property (not used by SDK)."""
        return None

    # --- Helper Methods ---

    def _lookup_user_id_from_thread(self, thread_id: str) -> Optional[str]:
        """
        Look up user_id from ConversationThread in database.

        Returns:
            User ID as string, or None if thread not found
        """
        try:
            # Import here to avoid circular imports
            from assistant.models import ConversationThread

            thread = ConversationThread.objects.filter(thread_id=thread_id).first()
            if thread and thread.user_id:
                user_id = str(thread.user_id)
                print(f"[ZEP] User ID lookup SUCCESS: thread {thread_id} → user {user_id}")
                logger.debug(
                    "zep_user_id_lookup_success",
                    extra={"thread_id": thread_id, "user_id": user_id}
                )
                return user_id
            else:
                print(f"[ZEP] User ID lookup FAILED: thread {thread_id} not found in database")
                logger.debug(
                    "zep_user_id_lookup_failed",
                    extra={"thread_id": thread_id, "reason": "thread_not_found"}
                )
                return None
        except Exception as e:
            print(f"[ZEP] User ID lookup ERROR: {type(e).__name__}: {str(e)}")
            logger.debug(
                "zep_user_id_lookup_error",
                extra={"thread_id": thread_id, "error": str(e)}
            )
            return None

    def _is_transient_error(self, exc: Exception) -> bool:
        """Determine if an exception is transient (should trigger circuit breaker)."""
        # Timeout and server errors are transient
        if "timeout" in str(exc).lower():
            return True

        status_code = self._extract_status_code(exc)
        if status_code:
            # 5xx errors are transient
            if 500 <= status_code < 600:
                return True
            # 429 rate limit is transient
            if status_code == 429:
                return True

        return False

    def _extract_status_code(self, exc: Exception) -> Optional[int]:
        """Extract HTTP status code from SDK exception."""
        # Zep Cloud SDK exceptions may have status_code attribute
        if hasattr(exc, "status_code"):
            return exc.status_code

        # Try to parse from error message
        error_str = str(exc).lower()
        if "404" in error_str or "not found" in error_str:
            return 404
        if "401" in error_str or "unauthorized" in error_str:
            return 401
        if "403" in error_str or "forbidden" in error_str:
            return 403
        if "429" in error_str or "rate limit" in error_str:
            return 429
        if "500" in error_str or "internal server error" in error_str:
            return 500

        return None

    # --- Compatibility helpers with legacy client ----------------------

    def query_memory(self, thread_id: str, query: str, limit: int = 5) -> list[str]:
        """
        Semantic recall for a thread.

        Preference order:
        1) Use Zep Cloud v2 search endpoint if available: POST /api/v2/threads/{id}/search
        2) Fallback: fetch recent window (lastn=50) and substring-match locally
        """
        try:
            import requests

            headers = {
                "Authorization": f"Api-Key {self.api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }

            # Try semantic search endpoint first
            try:
                search_url = f"{self.base_url}/api/v2/threads/{thread_id}/search"
                payload = {"text": query, "limit": limit}
                sresp = requests.post(search_url, json=payload, headers=headers, timeout=10)
                if sresp.status_code == 404:
                    # Thread not found yet → no memories
                    return []
                if sresp.status_code in (200, 201):
                    sdata = sresp.json() or {}
                    results = sdata.get("results", []) or sdata.get("messages", []) or []
                    out: list[str] = []
                    for item in results:
                        # result may be dict with content/message
                        content = None
                        if isinstance(item, dict):
                            content = item.get("content") or item.get("message")
                        if isinstance(content, str) and content.strip():
                            out.append(content.strip())
                        if len(out) >= limit:
                            break
                    if out:
                        return out
            except requests.RequestException as e:
                logger.debug("zep_query_semantic_network_error", extra={"thread_id": thread_id, "error": str(e)})
            except Exception as e:
                logger.debug("zep_query_semantic_unexpected", extra={"thread_id": thread_id, "error": str(e)})

            # Fallback: windowed fetch + substring filter
            msgs_url = f"{self.base_url}/api/v2/threads/{thread_id}/messages"
            params = {"lastn": 50}
            mresp = requests.get(msgs_url, headers=headers, params=params, timeout=10)
            if mresp.status_code == 404:
                return []
            if mresp.status_code != 200:
                logger.debug(
                    "zep_query_memory_window_fetch_failed",
                    extra={"thread_id": thread_id, "status_code": mresp.status_code}
                )
                return []

            data = mresp.json() or {}
            messages = list(data.get("messages", []))
            q = (query or "").strip().lower()
            if not q:
                return []

            matches: list[str] = []
            for msg in reversed(messages):  # Search newest to oldest
                try:
                    content = (msg.get("content") or "").strip()
                    if not content:
                        continue
                    if q in content.lower():
                        matches.append(content)
                        if len(matches) >= limit:
                            break
                except Exception:
                    continue
            return matches
        except Exception as e:
            logger.debug(
                "zep_query_memory_error",
                extra={"thread_id": thread_id, "error": str(e)}
            )
            return []


# Export same interface as original zep_client.py
__all__ = [
    "ZepCloudClient",
    "ZepClientError",
    "ZepRequestError",
    "ZepCircuitOpenError",
]
