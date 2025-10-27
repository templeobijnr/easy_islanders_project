import uuid
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_request_id_propagation_in_response_headers(settings):
    User = get_user_model()
    user = User.objects.create_user(username="traceuser", email="t@example.com", password="pw12345")
    client = APIClient()
    resp = client.post("/api/auth/login/", {"email": "t@example.com", "password": "pw12345"}, format='json')
    assert resp.status_code == 200
    token = resp.data["token"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    payload = {"message": "hello", "thread_id": str(uuid.uuid4())}
    r = client.post("/api/chat/", payload, format='json')
    assert r.status_code == 200
    # Middleware should inject X-Request-ID in response
    assert 'X-Request-ID' in r._headers or 'x-request-id' in r.headers

