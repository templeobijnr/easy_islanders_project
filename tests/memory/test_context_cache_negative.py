import time
import pytest
from django.conf import settings


@pytest.mark.skipif('sqlite' in settings.DATABASES['default']['ENGINE'], reason='Requires PostgreSQL due to migrations')
@pytest.mark.django_db
def test_negative_cache_suppresses_followups(monkeypatch):
    from assistant.memory import service as memsvc

    calls = {"count": 0}

    class SlowFailingClient:
        def get_user_context(self, thread_id: str, mode: str = "summary"):
            calls["count"] += 1
            # Mimic timeout exception path
            raise TimeoutError("Timeout while reading Zep context")

    # Patch client factory to return our slow failing client
    monkeypatch.setattr(memsvc, "get_client", lambda require_read=True: SlowFailingClient())

    thread = "neg-cache-thread-1"

    # First call: triggers timeout path and sets 3s negative cache
    ctx1, meta1 = memsvc.fetch_thread_context(thread, mode="summary", timeout_ms=50)
    assert ctx1 is None
    assert meta1.get("used") is False
    assert meta1.get("reason") == "timeout"
    assert meta1.get("source") == "timeout"
    assert calls["count"] == 1

    # Second call within 3 seconds should be suppressed by negative cache (no new backend call)
    time.sleep(1.0)
    ctx2, meta2 = memsvc.fetch_thread_context(thread, mode="summary", timeout_ms=50)
    assert ctx2 is None
    assert meta2.get("used") is False
    assert meta2.get("source") == "timeout"
    assert calls["count"] == 1

    # After 3s total, backend is tried again (another failure here)
    time.sleep(2.2)
    ctx3, meta3 = memsvc.fetch_thread_context(thread, mode="summary", timeout_ms=50)
    assert ctx3 is None
    assert meta3.get("reason") == "timeout"
    assert calls["count"] == 2

