from functools import lru_cache
from typing import Literal, Sequence

from pydantic_settings import BaseSettings, SettingsConfigDict


class RegistrySettings(BaseSettings):
    """Configuration for the registry service."""

    model_config = SettingsConfigDict(env_prefix="REGISTRY_", env_file=".env", extra="ignore")

    app_name: str = "registry-service"
    debug: bool = False

    # Database
    database_url: str = "postgresql+psycopg2://apple_trnc@localhost:5432/easy_islanders"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 5

    # Embeddings
    embedding_provider: Literal["openai"] = "openai"
    embedding_model: str = "text-embedding-3-small"
    embedding_batch_size: int = 512
    embedding_max_retries: int = 3
    embedding_retry_base: float = 0.6  # seconds
    embedding_retry_jitter: float = 0.2

    openai_api_key: str | None = None

    # Cache tuning
    exact_cache_size: int = 512
    semantic_cache_size: int = 256
    cache_ttl_seconds: int = 3600  # 60 minutes

    # Security
    api_keys: Sequence[str] = ()


@lru_cache
def get_settings() -> RegistrySettings:
    return RegistrySettings()
