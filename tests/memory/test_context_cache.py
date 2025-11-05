import time
from typing import Any, Dict

import pytest
from django.conf import settings
from django.core.cache import cache


@pytest.mark.skipif('sqlite3' in settings.DATABASES['default']['ENGINE'], reason='Requires PostgreSQL due to migrations')
@pytest.mark.django_db
def test_context_cache_roundtrip(monkeypatch):
    from assistant.memory import service as mem_service

    class DummyClient:
        def __init__(self):
            self.calls = 0

        def get_user_context(self, thread_id: str, mode: str = "summary") -> Dict[str, Any]:
            self.calls += 1
            return {
                "context": f"Hello {thread_id}",
                "facts": ["a", "b"],
                "recent": ["x"],
            }

    dummy = DummyClient()
    monkeypatch.setattr(mem_service, "get_client", lambda require_read=True: dummy)

    thread = "test-thread-ctx"
    try:
        cache.delete(f"zep:ctx:v1:{thread}:summary")
    except Exception:
        pass

    # First fetch → hits client, cached=False
    ctx1, meta1 = mem_service.fetch_thread_context(thread, mode="summary", timeout_ms=250)
    assert ctx1 and ctx1.get("context") == f"Hello {thread}"
    assert meta1.get("used") is True
    assert meta1.get("cached") is False
    assert dummy.calls == 1

    # Second fetch (within TTL) → cache hit, cached=True and no new client calls
    ctx2, meta2 = mem_service.fetch_thread_context(thread, mode="summary", timeout_ms=250)
    assert ctx2 and ctx2.get("context") == f"Hello {thread}"
    assert meta2.get("used") is True
    assert meta2.get("cached") is True
    assert dummy.calls == 1

    # Invalidate and fetch again → misses cache, calls client again
    mem_service.invalidate_context(thread)
    ctx3, meta3 = mem_service.fetch_thread_context(thread, mode="summary", timeout_ms=250)
    assert ctx3 and ctx3.get("context") == f"Hello {thread}"
    assert meta3.get("cached") is False
    assert dummy.calls == 2
