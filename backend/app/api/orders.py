"""
API endpoints for distribution orders.

Provides CRUD operations for managing distribution orders including
listing, creating, retrieving, updating, and deleting orders.
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.crud import (
    create_order,
    delete_order,
    get_order_by_id,
    get_orders,
    update_order,
)
from backend.app.dependencies import get_db
from backend.app.models import (
    DistributionOrder,
    DistributionOrderCreate,
    SuccessResponse,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=List[DistributionOrder])
def list_orders(
    from_date: Optional[date] = Query(None, description="Filter orders from this date (ISO format)"),
    to_date: Optional[date] = Query(None, description="Filter orders until this date (ISO format)"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    db: Session = Depends(get_db)
):
    """
    List all distribution orders with optional filters.
    
    Retrieves orders filtered by shipping date range and/or status.
    Results are ordered by shipping date descending.
    
    Args:
        from_date: Start date for filtering.
        to_date: End date for filtering.
        status: Status to filter by.
        db: Database session dependency.
    
    Returns:
        List of DistributionOrder objects.
    """
    return get_orders(db, from_date=from_date, to_date=to_date, status=status)


@router.post("", response_model=DistributionOrder, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_data: DistributionOrderCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new distribution order.
    
    Creates a new order with the provided details. The order number
    must be unique in the system.
    
    Args:
        order_data: Order creation data.
        db: Database session dependency.
    
    Returns:
        DistributionOrder: The created order object.
    
    Raises:
        HTTPException: 400 if order number already exists.
    """
    try:
        return create_order(db, order_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id}", response_model=DistributionOrder)
def get_order(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Get a distribution order by ID.
    
    Retrieves a single order by its unique identifier.
    
    Args:
        id: The unique identifier of the order.
        db: Database session dependency.
    
    Returns:
        DistributionOrder: The requested order object.
    
    Raises:
        HTTPException: 404 if order not found.
    """
    order = get_order_by_id(db, id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {id} not found"
        )
    return order


@router.put("/{id}", response_model=DistributionOrder)
def update_existing_order(
    id: int,
    order_data: DistributionOrderCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing distribution order.
    
    Updates all fields of an existing order. The order number
    cannot be changed to one that already exists.
    
    Args:
        id: The unique identifier of the order to update.
        order_data: Updated order data.
        db: Database session dependency.
    
    Returns:
        DistributionOrder: The updated order object.
    
    Raises:
        HTTPException: 404 if order not found.
        HTTPException: 400 if order number already exists.
    """
    try:
        order = update_order(db, id, order_data)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with id {id} not found"
            )
        return order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}", response_model=dict)
def delete_existing_order(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a distribution order by ID.
    
    Args:
        id: The unique identifier of the order to delete.
        db: Database session dependency.
    
    Returns:
        dict: {"success": True} if deleted.
    
    Raises:
        HTTPException: 404 if order not found.
    """
    deleted = delete_order(db, id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {id} not found"
        )
    return {"success": True}
