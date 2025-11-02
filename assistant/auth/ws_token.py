from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt

@database_sync_to_async
def _get_user(uid):
    User = get_user_model()
    try:
        return User.objects.get(id=uid)
    except User.DoesNotExist:
        return AnonymousUser()

async def _user_for_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        uid = payload.get("user_id") or payload.get("sub")
        return await _get_user(uid) if uid else AnonymousUser()
    except Exception:
        return AnonymousUser()

class QueryTokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        try:
            query = parse_qs(scope.get("query_string", b"").decode())
            token = (query.get("token") or [None])[0]
            scope["correlation_id"] = (query.get("cid") or [None])[0]
            scope["user"] = await _user_for_token(token) if token else AnonymousUser()
        except Exception:
            scope["user"] = AnonymousUser()
        return await super().__call__(scope, receive, send)
