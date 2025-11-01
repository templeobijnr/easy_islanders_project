from __future__ import annotations

import asyncio
import json
import sys
import time
from dataclasses import dataclass
from typing import Optional
from uuid import uuid4

from django.core.management.base import BaseCommand, CommandError


@dataclass
class SmokeConfig:
    api_base: str
    ws_base: str
    username: Optional[str]
    password: Optional[str]
    token: Optional[str]
    timeout: float


class Command(BaseCommand):
    help = "End-to-end chat smoke test: HTTP enqueue → Celery → WebSocket assistant_message."

    def add_arguments(self, parser):
        parser.add_argument("--api", dest="api_base", default="http://127.0.0.1:8000", help="API base URL")
        parser.add_argument("--ws", dest="ws_base", default="ws://127.0.0.1:8000", help="WS base URL")
        parser.add_argument("--username", dest="username", default=None, help="Username for JWT token")
        parser.add_argument("--password", dest="password", default=None, help="Password for JWT token")
        parser.add_argument("--token", dest="token", default=None, help="JWT access token (if provided, skips login)")
        parser.add_argument("--timeout", dest="timeout", type=float, default=20.0, help="Overall timeout seconds")

    def handle(self, *args, **options):
        cfg = SmokeConfig(
            api_base=options["api_base"].rstrip("/"),
            ws_base=options["ws_base"].rstrip("/"),
            username=options.get("username"),
            password=options.get("password"),
            token=options.get("token"),
            timeout=float(options.get("timeout") or 20.0),
        )

        if not cfg.token and not (cfg.username and cfg.password):
            raise CommandError("Provide --token or (--username and --password)")

        try:
            ok = asyncio.run(self._run_smoke(cfg))
        except KeyboardInterrupt:
            raise CommandError("Interrupted")

        if ok:
            self.stdout.write(self.style.SUCCESS("Chat smoke test: OK"))
            sys.exit(0)
        raise CommandError("Chat smoke test: FAILED (no assistant_message received)")

    async def _run_smoke(self, cfg: SmokeConfig) -> bool:
        import aiohttp

        # Acquire token if needed
        token = cfg.token
        async with aiohttp.ClientSession() as http:
            if not token:
                auth_url = f"{cfg.api_base}/api/token/"
                async with http.post(
                    auth_url,
                    headers={"Content-Type": "application/json"},
                    data=json.dumps({"username": cfg.username, "password": cfg.password}),
                ) as resp:
                    if resp.status != 200:
                        text = await resp.text()
                        raise CommandError(f"Token request failed ({resp.status}): {text}")
                    data = await resp.json()
                    token = data.get("access")
                    if not token:
                        raise CommandError("Token response missing 'access'")

            # Phase 1: enqueue to get a thread_id
            cid1 = str(uuid4())
            enqueue_url = f"{cfg.api_base}/api/chat/"
            async with http.post(
                enqueue_url,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                    "X-Correlation-ID": f"smoke-{int(time.time())}",
                },
                data=json.dumps({"message": "smoke-handshake", "client_msg_id": cid1}),
            ) as resp:
                if resp.status != 202:
                    text = await resp.text()
                    raise CommandError(f"Enqueue handshake failed ({resp.status}): {text}")
                d = await resp.json()
                thread_id = d.get("thread_id")
                if not thread_id:
                    raise CommandError("No thread_id in 202 response")

            # Connect WS for the thread
            ws_url = f"{cfg.ws_base}/ws/chat/{thread_id}/?token={token}&cid=smoke"
            timeout = aiohttp.ClientTimeout(total=cfg.timeout)
            async with aiohttp.ClientSession(timeout=timeout) as ws_http:
                async with ws_http.ws_connect(ws_url) as ws:
                    # Phase 2: enqueue a tracked message and wait for assistant reply in WS
                    cid2 = str(uuid4())
                    async with http.post(
                        enqueue_url,
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {token}",
                            "X-Correlation-ID": f"smoke-{int(time.time())}-2",
                        },
                        data=json.dumps({"message": "smoke-check", "client_msg_id": cid2, "thread_id": thread_id}),
                    ) as resp2:
                        if resp2.status != 202:
                            text2 = await resp2.text()
                            raise CommandError(f"Enqueue tracked failed ({resp2.status}): {text2}")

                    # Await frames until assistant_message with in_reply_to == cid2
                    deadline = time.monotonic() + cfg.timeout
                    while time.monotonic() < deadline:
                        msg = await ws.receive(timeout=max(0.1, deadline - time.monotonic()))
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            try:
                                payload = json.loads(msg.data)
                            except Exception:
                                continue
                            if payload.get("type") == "chat_message" and payload.get("event") == "assistant_message":
                                meta = payload.get("meta") or {}
                                in_reply_to = meta.get("in_reply_to") or payload.get("in_reply_to")
                                if in_reply_to == cid2:
                                    return True
                        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                            break
        return False

