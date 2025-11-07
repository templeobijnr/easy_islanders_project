from .base import *

# Local development should always run in debug
DEBUG = True

# Use ALLOWED_HOSTS from base.py which includes 'web' for Docker Compose
# ALLOWED_HOSTS is already set in base.py with ['*', 'web', 'localhost', '127.0.0.1']

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

# Execute Celery tasks asynchronously in development to mirror production behaviour
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False
