"""
API Package for DistroViz.

This package contains the API route handlers organized by domain:
- orders: Distribution order CRUD operations
- metrics: Dashboard metrics calculations
- trends: Trend data aggregation
"""

from app.api.orders import router as orders_router
from app.api.metrics import router as metrics_router
from app.api.trends import router as trends_router

__all__ = ["orders_router", "metrics_router", "trends_router"]
