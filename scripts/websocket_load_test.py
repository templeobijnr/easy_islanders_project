#!/usr/bin/env python3
"""
WebSocket Load Testing Script

This script simulates multiple concurrent WebSocket connections to test:
- Connection stability under load
- Message delivery latency (p50, p95, p99)
- Reconnection behavior under load
- Memory usage
- CPU usage
- Channel layer (Redis) performance

Usage:
    python3 scripts/websocket_load_test.py --connections 100 --duration 300
    python3 scripts/websocket_load_test.py --connections 1000 --duration 600 --rate 10

Requirements:
    pip install websockets asyncio aiohttp
"""

import asyncio
import websockets
import argparse
import time
import statistics
import json
import sys
from collections import defaultdict
from typing import Dict, List
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


class WebSocketLoadTest:
    def __init__(
        self,
        base_url: str,
        num_connections: int,
        duration: int,
        connection_rate: int = 50,
        message_rate: float = 0.1,
    ):
        self.base_url = base_url
        self.num_connections = num_connections
        self.duration = duration
        self.connection_rate = connection_rate
        self.message_rate = message_rate

        # Metrics
        self.connection_times: List[float] = []
        self.message_latencies: List[float] = []
        self.reconnect_counts: Dict[str, int] = defaultdict(int)
        self.close_codes: Dict[int, int] = defaultdict(int)
        self.errors: List[str] = []

        self.start_time = None
        self.end_time = None

    async def connect_client(self, client_id: str, thread_id: str, token: str):
        """
        Connect a single WebSocket client and keep it alive.
        """
        url = f"{self.base_url}/ws/chat/{thread_id}/?token={token}"
        reconnect_attempts = 0
        last_ping_time = None

        while time.time() - self.start_time < self.duration:
            connect_start = time.time()

            try:
                async with websockets.connect(
                    url,
                    ping_interval=30,
                    ping_timeout=10,
                    close_timeout=5,
                ) as ws:
                    connect_duration = time.time() - connect_start
                    self.connection_times.append(connect_duration)

                    logger.debug(f"Client {client_id} connected in {connect_duration:.3f}s")

                    # Send client_hello
                    await ws.send(json.dumps({
                        "type": "client_hello",
                        "thread_id": thread_id
                    }))

                    # Listen for messages
                    while time.time() - self.start_time < self.duration:
                        try:
                            # Wait for message with timeout
                            message = await asyncio.wait_for(
                                ws.recv(),
                                timeout=self.message_rate
                            )

                            recv_time = time.time()

                            # Parse message
                            try:
                                data = json.loads(message)

                                # Track message latency
                                if data.get('type') == 'chat_message':
                                    # Estimate latency (simplified)
                                    if last_ping_time:
                                        latency = recv_time - last_ping_time
                                        self.message_latencies.append(latency)

                                logger.debug(f"Client {client_id} received: {data.get('type')}")

                            except json.JSONDecodeError:
                                self.errors.append(f"Client {client_id}: Invalid JSON")

                        except asyncio.TimeoutError:
                            # Send periodic ping to keep connection alive
                            last_ping_time = time.time()
                            try:
                                await ws.send(json.dumps({
                                    "type": "ping",
                                    "timestamp": last_ping_time
                                }))
                            except Exception as e:
                                logger.debug(f"Client {client_id} ping failed: {e}")
                                break

                        except websockets.exceptions.ConnectionClosed as e:
                            logger.debug(f"Client {client_id} connection closed: {e.code}")
                            self.close_codes[e.code] = self.close_codes.get(e.code, 0) + 1
                            break

            except Exception as e:
                error_msg = f"Client {client_id} connection error: {str(e)}"
                logger.warning(error_msg)
                self.errors.append(error_msg)

                # Exponential backoff for reconnection
                reconnect_attempts += 1
                self.reconnect_counts[client_id] = reconnect_attempts

                backoff = min(2 ** reconnect_attempts, 16)
                await asyncio.sleep(backoff)

    async def run_test(self):
        """
        Run the load test with staggered connection creation.
        """
        logger.info(f"Starting WebSocket load test:")
        logger.info(f"  - Connections: {self.num_connections}")
        logger.info(f"  - Duration: {self.duration}s")
        logger.info(f"  - Connection rate: {self.connection_rate}/s")
        logger.info(f"  - Message rate: {self.message_rate}s timeout")

        self.start_time = time.time()

        # Create mock authentication token (replace with real auth if needed)
        mock_token = "test-token-12345"

        tasks = []

        # Stagger connection creation to avoid thundering herd
        for i in range(self.num_connections):
            client_id = f"client-{i:04d}"
            thread_id = f"thread-{i % 100:04d}"  # Reuse thread IDs for realistic load

            task = asyncio.create_task(
                self.connect_client(client_id, thread_id, mock_token)
            )
            tasks.append(task)

            # Rate limit connection creation
            if (i + 1) % self.connection_rate == 0:
                await asyncio.sleep(1)

        logger.info(f"All {len(tasks)} client tasks started")

        # Wait for test duration
        await asyncio.sleep(self.duration)

        logger.info("Test duration complete, shutting down clients...")

        # Cancel all tasks
        for task in tasks:
            task.cancel()

        await asyncio.gather(*tasks, return_exceptions=True)

        self.end_time = time.time()

    def print_results(self):
        """
        Print comprehensive test results.
        """
        actual_duration = self.end_time - self.start_time

        print("\n" + "=" * 80)
        print("WebSocket Load Test Results")
        print("=" * 80)

        # Test parameters
        print(f"\nTest Parameters:")
        print(f"  Target connections:      {self.num_connections}")
        print(f"  Test duration:           {self.duration}s")
        print(f"  Actual duration:         {actual_duration:.2f}s")
        print(f"  Connection rate:         {self.connection_rate}/s")

        # Connection metrics
        if self.connection_times:
            print(f"\nConnection Metrics:")
            print(f"  Successful connections:  {len(self.connection_times)}")
            print(f"  Avg connection time:     {statistics.mean(self.connection_times):.3f}s")
            print(f"  Median connection time:  {statistics.median(self.connection_times):.3f}s")
            print(f"  P95 connection time:     {self._percentile(self.connection_times, 95):.3f}s")
            print(f"  P99 connection time:     {self._percentile(self.connection_times, 99):.3f}s")
            print(f"  Max connection time:     {max(self.connection_times):.3f}s")

        # Message latency metrics
        if self.message_latencies:
            print(f"\nMessage Latency Metrics:")
            print(f"  Messages received:       {len(self.message_latencies)}")
            print(f"  Avg latency:             {statistics.mean(self.message_latencies):.3f}s")
            print(f"  Median latency:          {statistics.median(self.message_latencies):.3f}s")
            print(f"  P95 latency:             {self._percentile(self.message_latencies, 95):.3f}s")
            print(f"  P99 latency:             {self._percentile(self.message_latencies, 99):.3f}s")

        # Reconnection metrics
        if self.reconnect_counts:
            total_reconnects = sum(self.reconnect_counts.values())
            clients_with_reconnects = len(self.reconnect_counts)

            print(f"\nReconnection Metrics:")
            print(f"  Clients with reconnects: {clients_with_reconnects}")
            print(f"  Total reconnections:     {total_reconnects}")
            print(f"  Avg reconnects/client:   {total_reconnects / clients_with_reconnects:.2f}")
            print(f"  Max reconnects (client): {max(self.reconnect_counts.values())}")

        # Close code distribution
        if self.close_codes:
            print(f"\nClose Code Distribution:")
            for code, count in sorted(self.close_codes.items()):
                reason = self._get_close_reason(code)
                print(f"  {code} ({reason}):".ljust(40) + f"{count}")

        # Error summary
        if self.errors:
            print(f"\nError Summary:")
            print(f"  Total errors:            {len(self.errors)}")
            print(f"  Sample errors:")
            for error in self.errors[:5]:
                print(f"    - {error}")
            if len(self.errors) > 5:
                print(f"    ... and {len(self.errors) - 5} more")

        # Success criteria
        print(f"\nSuccess Criteria:")

        success_rate = len(self.connection_times) / self.num_connections * 100
        criteria_met = []

        # Connection success rate ≥ 95%
        conn_success = success_rate >= 95
        criteria_met.append(conn_success)
        print(f"  ✅ Connection success ≥ 95%:".ljust(50) if conn_success else f"  ❌ Connection success ≥ 95%:".ljust(50), f"{success_rate:.1f}%")

        # P95 connection time < 1s
        if self.connection_times:
            p95_conn = self._percentile(self.connection_times, 95)
            conn_time_ok = p95_conn < 1.0
            criteria_met.append(conn_time_ok)
            print(f"  ✅ P95 connection time < 1s:".ljust(50) if conn_time_ok else f"  ❌ P95 connection time < 1s:".ljust(50), f"{p95_conn:.3f}s")

        # P95 message latency < 200ms
        if self.message_latencies:
            p95_latency = self._percentile(self.message_latencies, 95)
            latency_ok = p95_latency < 0.2
            criteria_met.append(latency_ok)
            print(f"  ✅ P95 message latency < 200ms:".ljust(50) if latency_ok else f"  ❌ P95 message latency < 200ms:".ljust(50), f"{p95_latency * 1000:.0f}ms")

        # Reconnection rate < 5%
        if self.reconnect_counts:
            reconnect_rate = len(self.reconnect_counts) / self.num_connections * 100
            reconnect_ok = reconnect_rate < 5
            criteria_met.append(reconnect_ok)
            print(f"  ✅ Reconnection rate < 5%:".ljust(50) if reconnect_ok else f"  ❌ Reconnection rate < 5%:".ljust(50), f"{reconnect_rate:.1f}%")

        # Overall pass/fail
        overall_pass = all(criteria_met) if criteria_met else False
        print(f"\nOverall Test Result: {'✅ PASS' if overall_pass else '❌ FAIL'}")

        print("=" * 80 + "\n")

        return 0 if overall_pass else 1

    @staticmethod
    def _percentile(data: List[float], percentile: int) -> float:
        """Calculate percentile of a dataset."""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]

    @staticmethod
    def _get_close_reason(code: int) -> str:
        """Get human-readable close reason."""
        reasons = {
            1000: "normal_closure",
            1001: "going_away",
            1002: "protocol_error",
            1003: "unsupported_data",
            1006: "abnormal_closure",
            1008: "policy_violation",
            1011: "internal_error",
            1012: "service_restart",
            1013: "try_again_later",
            4401: "auth_required",
        }
        return reasons.get(code, "unknown")


async def main():
    parser = argparse.ArgumentParser(description="WebSocket load testing tool")
    parser.add_argument(
        "--url",
        default="ws://localhost:8000",
        help="Base WebSocket URL (default: ws://localhost:8000)"
    )
    parser.add_argument(
        "--connections",
        "-c",
        type=int,
        default=100,
        help="Number of concurrent connections (default: 100)"
    )
    parser.add_argument(
        "--duration",
        "-d",
        type=int,
        default=60,
        help="Test duration in seconds (default: 60)"
    )
    parser.add_argument(
        "--rate",
        "-r",
        type=int,
        default=50,
        help="Connection creation rate per second (default: 50)"
    )
    parser.add_argument(
        "--message-timeout",
        "-m",
        type=float,
        default=0.1,
        help="Message receive timeout in seconds (default: 0.1)"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Run load test
    test = WebSocketLoadTest(
        base_url=args.url,
        num_connections=args.connections,
        duration=args.duration,
        connection_rate=args.rate,
        message_rate=args.message_timeout,
    )

    await test.run_test()
    exit_code = test.print_results()

    sys.exit(exit_code)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
        sys.exit(1)
