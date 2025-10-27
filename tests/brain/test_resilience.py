import pytest

from assistant.brain.resilience import safe_execute
from assistant.brain.checkpointing import save_checkpoint, load_checkpoint


def test_safe_execute_retries():
    counter = {"n": 0}

    def flaky():
        counter["n"] += 1
        if counter["n"] < 3:
            raise ConnectionError("Simulated transient")
        return "ok"

    assert safe_execute(flaky) == "ok"
    assert counter["n"] == 3


@pytest.mark.django_db
def test_checkpoint_roundtrip():
    cid = "thread-test-1"
    state = {"state": "x"}
    assert save_checkpoint(cid, state) is True
    loaded = load_checkpoint(cid)
    assert loaded == state

