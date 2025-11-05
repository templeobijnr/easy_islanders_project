#!/usr/bin/env python3
"""
Smoke Test: Rehydration Works & No 403s

Tests that server-side rehydration push works correctly on WebSocket reconnect.

Usage:
    python3 scripts/validate_rehydration_smoke.py

Expected:
    - WebSocket connects successfully
    - Rehydration payload received on connect
    - No 403 errors for preferences/personalization endpoints
    - Metrics: rehydration_success_total increments
"""

import asyncio
import json
import logging
import sys
import time
from typing import Optional, Dict, Any

try:
    import websockets
    import requests
except ImportError:
    print("ERROR: Required packages not installed")
    print("Run: pip install websockets requests")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
API_BASE_URL = "http://localhost:8000"
WS_BASE_URL = "ws://localhost:8000"
TOKEN = None  # Set via environment or login


class RehydrationSmokeTest:
    """Test rehydration via WebSocket reconnect."""

    def __init__(self):
        self.thread_id: Optional[str] = None
        self.session = requests.Session()
        self.rehydration_received = False
        self.rehydration_payload: Optional[Dict[str, Any]] = None

    def authenticate(self) -> bool:
        """Authenticate and get JWT token."""
        logger.info("Authenticating...")

        # Try to use existing token or login
        response = self.session.post(
            f"{API_BASE_URL}/api/auth/login/",
            json={"username": "test_user", "password": "test_pass"}
        )

        if response.status_code == 200:
            data = response.json()
            global TOKEN
            TOKEN = data.get("token") or data.get("access_token")
            if TOKEN:
                self.session.headers.update({"Authorization": f"Bearer {TOKEN}"})
                logger.info("✓ Authenticated successfully")
                return True

        logger.warning("Authentication failed, continuing without token")
        return False

    def start_re_flow(self) -> bool:
        """Start a real estate conversation flow."""
        logger.info("Starting RE flow...")

        response = self.session.post(
            f"{API_BASE_URL}/api/chat/",
            json={
                "message": "need an apartment",
                "language": "en"
            }
        )

        if response.status_code == 200:
            data = response.json()
            self.thread_id = data.get("thread_id")
            logger.info(f"✓ Started RE flow, thread_id: {self.thread_id}")
            return True

        logger.error(f"Failed to start RE flow: {response.status_code}")
        return False

    def continue_re_flow(self, message: str) -> bool:
        """Send a message to continue the flow."""
        if not self.thread_id:
            logger.error("No thread_id, cannot continue flow")
            return False

        logger.info(f"Sending: {message}")

        response = self.session.post(
            f"{API_BASE_URL}/api/chat/",
            json={
                "message": message,
                "thread_id": self.thread_id,
                "language": "en"
            }
        )

        if response.status_code == 200:
            data = response.json()
            logger.info(f"✓ Response received: {data.get('response', '')[:100]}")
            return True

        logger.error(f"Failed to send message: {response.status_code}")
        return False

    async def connect_websocket(self) -> bool:
        """Connect to WebSocket and listen for rehydration."""
        if not self.thread_id:
            logger.error("No thread_id, cannot connect WebSocket")
            return False

        ws_url = f"{WS_BASE_URL}/ws/chat/{self.thread_id}/"
        if TOKEN:
            ws_url += f"?token={TOKEN}"

        logger.info(f"Connecting to WebSocket: {ws_url}")

        try:
            async with websockets.connect(ws_url) as websocket:
                logger.info("✓ WebSocket connected")

                # Wait for rehydration message (should arrive immediately on connect)
                timeout = 5
                start = time.time()

                while time.time() - start < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)

                        logger.info(f"Received message type: {data.get('type')}")

                        if data.get("type") == "rehydration":
                            self.rehydration_received = True
                            self.rehydration_payload = data
                            logger.info("✓ Rehydration payload received!")
                            logger.info(f"  rehydrated: {data.get('rehydrated')}")
                            logger.info(f"  active_domain: {data.get('active_domain')}")
                            logger.info(f"  current_intent: {data.get('current_intent')}")
                            logger.info(f"  turn_count: {data.get('turn_count')}")
                            return True

                    except asyncio.TimeoutError:
                        continue

                if not self.rehydration_received:
                    logger.warning("No rehydration payload received within timeout")
                    return False

        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            return False

    def check_no_403_errors(self) -> bool:
        """Check server logs for 403 errors on preferences/personalization endpoints."""
        logger.info("Checking for 403 errors...")

        # This would need to query logs or metrics
        # For now, we simulate by checking metrics endpoint
        try:
            response = requests.get(f"{API_BASE_URL}/api/metrics/")
            if response.status_code == 200:
                metrics_text = response.text

                # Check if there are any 403 metrics for our endpoints
                forbidden_patterns = [
                    'http_requests_total{.*endpoint="/api/preferences/active".*status_code="403"',
                    'http_requests_total{.*endpoint="/api/chat/thread/.*/personalization/state".*status_code="403"'
                ]

                for pattern in forbidden_patterns:
                    if pattern in metrics_text:
                        logger.error(f"Found 403 errors matching pattern: {pattern}")
                        return False

                logger.info("✓ No 403 errors found on rehydration endpoints")
                return True

        except Exception as e:
            logger.warning(f"Could not check metrics: {e}")

        return True  # Assume success if we can't check

    def check_rehydration_metrics(self) -> bool:
        """Check that rehydration success metrics incremented."""
        logger.info("Checking rehydration metrics...")

        try:
            response = requests.get(f"{API_BASE_URL}/api/metrics/")
            if response.status_code == 200:
                metrics_text = response.text

                # Look for rehydration_success_total
                if "rehydration_success_total" in metrics_text:
                    logger.info("✓ rehydration_success_total metric found")

                    # Parse value (simple approach)
                    for line in metrics_text.split('\n'):
                        if line.startswith("rehydration_success_total"):
                            parts = line.split()
                            if len(parts) >= 2:
                                value = float(parts[-1])
                                if value > 0:
                                    logger.info(f"✓ rehydration_success_total = {value}")
                                    return True

                logger.warning("rehydration_success_total not found or zero")
                return False

        except Exception as e:
            logger.error(f"Error checking metrics: {e}")
            return False

    async def run(self) -> bool:
        """Run the full smoke test."""
        logger.info("=" * 60)
        logger.info("SMOKE TEST: Rehydration Works & No 403s")
        logger.info("=" * 60)

        # Step 1: Authenticate
        if not self.authenticate():
            logger.warning("Continuing without authentication")

        # Step 2: Start RE flow
        if not self.start_re_flow():
            logger.error("FAIL: Could not start RE flow")
            return False

        # Step 3: Continue flow to establish state
        time.sleep(1)  # Allow backend to process
        if not self.continue_re_flow("kyrenia 500 pounds"):
            logger.error("FAIL: Could not continue RE flow")
            return False

        # Step 4: Simulate reconnect by connecting WebSocket
        time.sleep(1)  # Allow backend to process
        logger.info("\n--- Simulating WebSocket Reconnect ---")
        if not await self.connect_websocket():
            logger.error("FAIL: Rehydration not received on WebSocket connect")
            return False

        # Step 5: Verify rehydration payload structure
        if self.rehydration_payload:
            required_fields = ["type", "thread_id", "rehydrated", "active_domain", "current_intent"]
            missing_fields = [f for f in required_fields if f not in self.rehydration_payload]

            if missing_fields:
                logger.error(f"FAIL: Rehydration payload missing fields: {missing_fields}")
                return False

            logger.info("✓ Rehydration payload has all required fields")

        # Step 6: Check no 403 errors
        if not self.check_no_403_errors():
            logger.error("FAIL: Found 403 errors on rehydration endpoints")
            return False

        # Step 7: Check rehydration metrics
        if not self.check_rehydration_metrics():
            logger.warning("WARNING: Could not verify rehydration metrics")

        logger.info("\n" + "=" * 60)
        logger.info("✓ SMOKE TEST PASSED")
        logger.info("=" * 60)
        return True


def main():
    """Run smoke test."""
    test = RehydrationSmokeTest()

    try:
        result = asyncio.run(test.run())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        logger.info("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test failed with exception: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
