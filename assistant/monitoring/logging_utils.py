import json
import logging
import time


class JSONFormatter(logging.Formatter):
    """Minimal JSON log formatter with request/trace correlation fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Include extras if present
        for key in ("request_id", "thread_id", "trace_id", "conversation_id"):
            val = getattr(record, key, None)
            if val:
                payload[key] = val
        return json.dumps(payload, ensure_ascii=False)

