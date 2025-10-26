from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Iterable, List, Sequence

from openai import OpenAI, OpenAIError

from .config import get_settings


@dataclass
class EmbeddingResult:
    embeddings: List[List[float]]
    prompt_tokens: int = 0
    total_tokens: int = 0


class EmbeddingClient:
    """OpenAI embeddings wrapper with retry/backoff and chunking."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise RuntimeError("OpenAI API key is required for embeddings")
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._model = settings.embedding_model
        self._batch_size = settings.embedding_batch_size
        self._max_retries = settings.embedding_max_retries
        self._retry_base = settings.embedding_retry_base
        self._retry_jitter = settings.embedding_retry_jitter

    def embed_texts(self, texts: Iterable[str]) -> EmbeddingResult:
        texts_list = [text for text in texts if text and text.strip()]
        if not texts_list:
            return EmbeddingResult(embeddings=[])

        embeddings: List[List[float]] = []
        prompt_tokens = 0
        total_tokens = 0

        for offset in range(0, len(texts_list), self._batch_size):
            chunk = texts_list[offset : offset + self._batch_size]
            result = self._embed_chunk(chunk)
            embeddings.extend(result.embeddings)
            prompt_tokens += result.prompt_tokens
            total_tokens += result.total_tokens

        return EmbeddingResult(embeddings=embeddings, prompt_tokens=prompt_tokens, total_tokens=total_tokens)

    def _embed_chunk(self, chunk: Sequence[str]) -> EmbeddingResult:
        last_error: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            try:
                response = self._client.embeddings.create(model=self._model, input=list(chunk))
                usage = getattr(response, "usage", None)
                return EmbeddingResult(
                    embeddings=[data.embedding for data in response.data],
                    prompt_tokens=int(getattr(usage, "prompt_tokens", 0) if usage else 0),
                    total_tokens=int(getattr(usage, "total_tokens", 0) if usage else 0),
                )
            except OpenAIError as exc:  # pragma: no cover - network interaction
                last_error = exc
                if exc.http_status == 429 and attempt < self._max_retries:
                    self._sleep_with_backoff(attempt)
                    continue
                if exc.http_status and 500 <= exc.http_status < 600 and attempt < self._max_retries:
                    self._sleep_with_backoff(attempt)
                    continue
                raise RuntimeError(f"Embedding request failed: {exc}") from exc
        raise RuntimeError(f"Embedding request failed after {self._max_retries} attempts: {last_error}") from last_error

    def _sleep_with_backoff(self, attempt: int) -> None:
        sleep_for = (self._retry_base * (2 ** (attempt - 1))) + random.uniform(0, self._retry_jitter)
        time.sleep(sleep_for)
