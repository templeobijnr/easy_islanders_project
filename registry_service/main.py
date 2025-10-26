from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

from .config import get_settings
from .routers import terms

# Optional: reuse Django observability helpers when available
# Import is deferred to avoid Django settings dependency at module level


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0", debug=settings.debug)

    # Lazy import to avoid Django settings dependency
    try:
        from assistant.monitoring.otel_instrumentation import (
            setup_otel_instrumentation,
            instrument_fastapi_app,
        )
        if setup_otel_instrumentation(instrument_django=False):
            instrument_fastapi_app(app)
    except ImportError:
        # Registry-only deployment without Django monitoring
        pass

    @app.get("/v1/healthz")
    def healthz():
        return {"ok": True}

    @app.get("/metrics", response_class=PlainTextResponse)
    def metrics():
        """Prometheus metrics endpoint"""
        try:
            from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
            return generate_latest()
        except ImportError:
            return "# Prometheus client not available\n"

    app.include_router(terms.router)
    return app


app = create_app()
