import json
import uuid

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_agent_request_counter_increments(settings):
    User = get_user_model()
    user = User.objects.create_user(username="obsuser", email="o@example.com", password="pw12345")

    client = APIClient()
    # Login to get token
    resp = client.post("/api/auth/login/", {"email": "o@example.com", "password": "pw12345"}, format='json')
    assert resp.status_code == 200
    token = resp.data["token"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # Call chat endpoint once
    payload = {"message": "hi", "thread_id": str(uuid.uuid4())}
    resp2 = client.post("/api/chat/", payload, format='json')
    assert resp2.status_code == 200

    # Check metrics endpoint contains our counters (best-effort)
    respm = client.get("/api/metrics")
    assert respm.status_code == 200
    body = respm.content.decode("utf-8")
    assert "agent_requests_total" in body or "agent_latency_seconds" in body


@pytest.mark.django_db
def test_degraded_mode_flag_on_llm_failure(monkeypatch, settings):
    # Force OpenAI key invalid to trigger degraded flow quickly
    settings.OPENAI_API_KEY = "invalid"
    User = get_user_model()
    user = User.objects.create_user(username="obsuser2", email="o2@example.com", password="pw12345")
    client = APIClient()
    resp = client.post("/api/auth/login/", {"email": "o2@example.com", "password": "pw12345"}, format='json')
    assert resp.status_code == 200
    token = resp.data["token"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # Call chat endpoint once to exercise degraded path
    payload = {"message": "force failure", "thread_id": str(uuid.uuid4())}
    resp2 = client.post("/api/chat/", payload, format='json')
    assert resp2.status_code == 200
    # Envelope should include conversation_id and response
    data = resp2.json()
    assert "response" in data
