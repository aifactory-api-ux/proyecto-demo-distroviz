"""
CRUD operations for distribution orders.

This module provides all database operations for creating, reading,
updating, and deleting distribution orders, as well as computing
metrics and trend data.
"""

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    DistributionOrderDB,
    DistributionOrder,
    DistributionOrderCreate,
    Metric,
    TrendPoint,
)


def get_orders(
    db: Session,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    status: Optional[str] = None
) -> List[DistributionOrder]:
    """
    Retrieve distribution orders with optional filters.
    
    Args:
        db: Database session.
        from_date: Filter orders shipped on or after this date.
        to_date: Filter orders shipped on or before this date.
        status: Filter by order status.
    
    Returns:
        List of DistributionOrder objects matching the filters.
    """
    query = db.query(DistributionOrderDB)
    
    if from_date:
        query = query.filter(DistributionOrderDB.shipped_at >= datetime.combine(from_date, datetime.min.time()))
    
    if to_date:
        query = query.filter(DistributionOrderDB.shipped_at <= datetime.combine(to_date, datetime.max.time()))
    
    if status:
        query = query.filter(DistributionOrderDB.status == status)
    
    orders = query.order_by(DistributionOrderDB.shipped_at.desc()).all()
    return [order.to_pydantic() for order in orders]


def get_order_by_id(db: Session, order_id: int) -> Optional[DistributionOrder]:
    """
    Retrieve a single distribution order by ID.
    
    Args:
        db: Database session.
        order_id: The ID of the order to retrieve.
    
    Returns:
        DistributionOrder if found, None otherwise.
    """
    order = db.query(DistributionOrderDB).filter(DistributionOrderDB.id == order_id).first()
    if order:
        return order.to_pydantic()
    return None


def create_order(db: Session, order_data: DistributionOrderCreate) -> DistributionOrder:
    """
    Create a new distribution order.
    
    Args:
        db: Database session.
        order_data: Order creation data.
    
    Returns:
        DistributionOrder: The created order object.
    
    Raises:
        ValueError: If order number already exists.
    """
    # Check if order number already exists
    existing = db.query(DistributionOrderDB).filter(
        DistributionOrderDB.order_number == order_data.order_number
    ).first()
    
    if existing:
        raise ValueError(f"Order number '{order_data.order_number}' already exists")
    
    # Create new order
    db_order = DistributionOrderDB(
        order_number=order_data.order_number,
        product_name=order_data.product_name,
        quantity=order_data.quantity,
        destination=order_data.destination,
        status=order_data.status,
        shipped_at=order_data.shipped_at,
        delivered_at=order_data.delivered_at,
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return db_order.to_pydantic()


def update_order(db: Session, order_id: int, order_data: DistributionOrderCreate) -> Optional[DistributionOrder]:
    """
    Update an existing distribution order.
    
    Args:
        db: Database session.
        order_id: The ID of the order to update.
        order_data: Updated order data.
    
    Returns:
        DistributionOrder: The updated order object, or None if not found.
    
    Raises:
        ValueError: If new order number already exists on another order.
    """
    order = db.query(DistributionOrderDB).filter(DistributionOrderDB.id == order_id).first()
    
    if not order:
        return None
    
    # Check if order number already exists on another order
    if order_data.order_number != order.order_number:
        existing = db.query(DistributionOrderDB).filter(
            DistributionOrderDB.order_number == order_data.order_number,
            DistributionOrderDB.id != order_id
        ).first()
        
        if existing:
            raise ValueError(f"Order number '{order_data.order_number}' already exists")
    
    # Update fields
    order.order_number = order_data.order_number
    order.product_name = order_data.product_name
    order.quantity = order_data.quantity
    order.destination = order_data.destination
    order.status = order_data.status
    order.shipped_at = order_data.shipped_at
    order.delivered_at = order_data.delivered_at
    order.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order.to_pydantic()


def delete_order(db: Session, order_id: int) -> bool:
    """
    Delete a distribution order.
    
    Args:
        db: Database session.
        order_id: The ID of the order to delete.
    
    Returns:
        bool: True if deleted, False if not found.
    """
    order = db.query(DistributionOrderDB).filter(DistributionOrderDB.id == order_id).first()
    
    if not order:
        return False
    
    db.delete(order)
    db.commit()
    
    return True


def get_metrics(db: Session) -> Metric:
    """
    Calculate dashboard metrics.
    
    Args:
        db: Database session.
    
    Returns:
        Metric: Aggregated metrics for all orders.
    """
    # Total orders
    total_orders = db.query(DistributionOrderDB).count()
    
    # Total quantity
    total_quantity = db.query(func.sum(DistributionOrderDB.quantity)).scalar() or 0
    
    # Delivered orders
    delivered_orders = db.query(DistributionOrderDB).filter(
        DistributionOrderDB.status == "delivered"
    ).count()
    
    # Pending orders
    pending_orders = db.query(DistributionOrderDB).filter(
        DistributionOrderDB.status == "pending"
    ).count()
    
    return Metric(
        total_orders=total_orders,
        total_quantity=total_quantity,
        delivered_orders=delivered_orders,
        pending_orders=pending_orders
    )


def get_trends(
    db: Session,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None
) -> List[TrendPoint]:
    """
    Calculate trend data for orders.
    
    Args:
        db: Database session.
        from_date: Start date for trend period.
        to_date: End date for trend period.
    
    Returns:
        List of TrendPoint objects with daily aggregated data.
    """
    today = date.today()
    if not from_date:
        from_date = date(today.year, 1, 1)
    if not to_date:
        to_date = today
    
    # Query orders within date range
    query = db.query(DistributionOrderDB).filter(
        DistributionOrderDB.shipped_at >= datetime.combine(from_date, datetime.min.time()),
        DistributionOrderDB.shipped_at <= datetime.combine(to_date, datetime.max.time())
    )
    
    orders = query.all()
    
    # Group by date
    trend_dict = {}
    for order in orders:
        if order.shipped_at:
            order_date = order.shipped_at.date()
            if order_date not in trend_dict:
                trend_dict[order_date] = {"delivered": 0, "pending": 0}
            
            if order.status == "delivered":
                trend_dict[order_date]["delivered"] += 1
            elif order.status == "pending":
                trend_dict[order_date]["pending"] += 1
    
    # Convert to list of TrendPoint
    trend_points = []
    for d, counts in sorted(trend_dict.items()):
        trend_points.append(TrendPoint(
            date=d,
            delivered=counts["delivered"],
            pending=counts["pending"]
        ))
    
    return trend_points


def seed_initial_data(db: Session) -> None:
    """
    Seed initial data for development and testing.
    
    Args:
        db: Database session.
    """
    # Check if data already exists
    existing_count = db.query(DistributionOrderDB).count()
    if existing_count > 0:
        return
    
    # Sample orders
    sample_orders = [
        DistributionOrderDB(
            order_number="ORD-20240401-001",
            product_name="Producto A",
            quantity=100,
            destination="CDMX",
            status="delivered",
            shipped_at=datetime(2024, 4, 1, 10, 0, 0),
            delivered_at=datetime(2024, 4, 2, 15, 0, 0)
        ),
        DistributionOrderDB(
            order_number="ORD-20240401-002",
            product_name="Producto B",
            quantity=200,
            destination="Monterrey",
            status="pending",
            shipped_at=None,
            delivered_at=None
        ),
        DistributionOrderDB(
            order_number="ORD-20240402-001",
            product_name="Producto C",
            quantity=150,
            destination="Guadalajara",
            status="delivered",
            shipped_at=datetime(2024, 4, 2, 9, 0, 0),
            delivered_at=datetime(2024, 4, 3, 14, 0, 0)
        ),
        DistributionOrderDB(
            order_number="ORD-20240403-001",
            product_name="Producto A",
            quantity=75,
            destination="CDMX",
            status="delivered",
            shipped_at=datetime(2024, 4, 3, 11, 0, 0),
            delivered_at=datetime(2024, 4, 4, 16, 0, 0)
        ),
        DistributionOrderDB(
            order_number="ORD-20240404-001",
            product_name="Producto D",
            quantity=300,
            destination="Tijuana",
            status="pending",
            shipped_at=None,
            delivered_at=None
        ),
    ]
    
    for order in sample_orders:
        db.add(order)
    
    db.commit()
