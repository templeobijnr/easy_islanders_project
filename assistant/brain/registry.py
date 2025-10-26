from functools import lru_cache
import logging
import os

from .registry_client import RegistryClient

logger = logging.getLogger(__name__)


@lru_cache
def get_registry_client() -> RegistryClient:
    """
    Construct a shared RegistryClient instance.

    The client pulls configuration from environment variables:
        REGISTRY_BASE_URL – service endpoint for live lookups
        REGISTRY_API_KEY  – optional auth token

    If no base URL is configured we still return a client, but only the embedded
    seed data is available.  We log that scenario once so debugging outages is
    easier.
    """
    base_url = os.getenv("REGISTRY_BASE_URL")
    api_key = os.getenv("REGISTRY_API_KEY")
    if not base_url:
        logger.info("REGISTRY_BASE_URL not set; registry client will rely on seed data")
    return RegistryClient(base_url=base_url, api_key=api_key)
