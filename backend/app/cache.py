"""
Redis caching utilities for DistroViz.

This module provides functions and constants for caching metrics and other
frequently accessed data in Redis.
"""

import os
import json
from typing import Any, Optional

import redis

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Cache key prefixes
METRICS_CACHE_PREFIX = "metrics:"

# Redis client singleton
_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


def get_cached_metrics(cache, cache_key: str) -> Optional[dict]:
    """
    Retrieve cached metrics from Redis.
    Args:
        cache: Redis client.
        cache_key: Key to retrieve.
    Returns:
        Cached metrics as dict, or None if not found.
    """
    data = cache.get(cache_key)
    if data is not None:
        try:
            return json.loads(data)
        except Exception:
            return None
    return None


def cache_metrics(cache, cache_key: str, metrics: dict, ttl: int) -> None:
    """
    Store metrics in Redis cache.
    Args:
        cache: Redis client.
        cache_key: Key to store.
        metrics: Metrics dict to store.
        ttl: Time-to-live in seconds.
    """
    cache.setex(cache_key, ttl, json.dumps(metrics))
