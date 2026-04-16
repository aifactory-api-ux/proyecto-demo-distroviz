"""
API endpoints for trend data.

Provides endpoints for retrieving time-series trend data about
distribution orders, showing delivered and pending counts over time.
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.crud import get_trends
from backend.app.dependencies import get_db
from backend.app.models import TrendResponse

router = APIRouter(prefix="/api/trends", tags=["trends"])


@router.get("", response_model=TrendResponse)
def get_order_trends(
    from_date: Optional[date] = Query(None, description="Start date for trend data (ISO format)"),
    to_date: Optional[date] = Query(None, description="End date for trend data (ISO format)"),
    db: Session = Depends(get_db)
):
    """
    Get trend data for orders.
    
    Retrieves aggregated trend data showing the number of delivered
    and pending orders per day within the specified date range.
    
    Args:
        from_date: Start date for the trend period.
        to_date: End date for the trend period.
        db: Database session dependency.
    
    Returns:
        TrendResponse with list of TrendPoint objects.
    """
    trend_data = get_trends(db, from_date=from_date, to_date=to_date)
    return TrendResponse(trend=trend_data)
