"""
API endpoints for dashboard metrics.

Provides endpoints for retrieving aggregated metrics about distribution
orders including totals, quantities, and status breakdowns.
Includes Redis caching for improved performance.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import get_metrics
from app.dependencies import get_db, get_cache, get_cache_ttl_metrics
from app.cache import METRICS_CACHE_PREFIX, get_cached_metrics, cache_metrics
from app.models import Metric

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("", response_model=Metric)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    cache = Depends(get_cache),
    cache_ttl: int = Depends(get_cache_ttl_metrics)
):
    """
    Get dashboard metrics.

    Calculates and returns aggregated metrics for all distribution orders,
    including total order count, total quantity, delivered orders count,
    and pending orders count.
    
    Results are cached in Redis for improved performance. Cache is
    invalidated automatically based on TTL.

    Args:
        db: Database session dependency.
        cache: Redis cache client dependency.
        cache_ttl: Cache TTL in seconds.

    Returns:
        Metric object with aggregated values.
    """
    cache_key = f"{METRICS_CACHE_PREFIX}all"
    
    try:
        cached_data = get_cached_metrics(cache, cache_key)
        if cached_data is not None:
            return Metric(**cached_data)
    except Exception:
        pass
    
    metrics = get_metrics(db)
    
    try:
        cache_metrics(cache, cache_key, metrics.model_dump(), cache_ttl)
    except Exception:
        pass
    
    return metrics
