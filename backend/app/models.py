"""
Pydantic models and SQLAlchemy ORM models for DistroViz.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class DistributionOrder(BaseModel):
    """Pydantic model for distribution order response."""
    id: int
    order_number: str
    product_name: str
    quantity: int
    destination: str
    status: str
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class DistributionOrderCreate(BaseModel):
    """Pydantic model for creating a distribution order."""
    order_number: str
    product_name: str
    quantity: int
    destination: str
    status: str
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class DistributionOrderFilter(BaseModel):
    """Pydantic model for filtering distribution orders."""
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    status: Optional[str] = None


class Metric(BaseModel):
    """Pydantic model for dashboard metrics."""
    total_orders: int
    total_quantity: int
    delivered_orders: int
    pending_orders: int


class TrendPoint(BaseModel):
    """Pydantic model for a single trend data point."""
    date: date
    delivered: int
    pending: int


class TrendResponse(BaseModel):
    """Pydantic model for trend response."""
    trend: List[TrendPoint]


# SQLAlchemy ORM Models


class DistributionOrderDB(Base):
    """SQLAlchemy ORM model for distribution orders table."""
    __tablename__ = "distribution_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    destination = Column(String(200), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_pydantic(self) -> DistributionOrder:
        """Convert ORM model to Pydantic response model."""
        return DistributionOrder(
            id=self.id,
            order_number=self.order_number,
            product_name=self.product_name,
            quantity=self.quantity,
            destination=self.destination,
            status=self.status,
            shipped_at=self.shipped_at,
            delivered_at=self.delivered_at,
        )


class Plant(Base):
    """SQLAlchemy ORM model for plants (manufacturing locations)."""
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    location = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DistributionCenter(Base):
    """SQLAlchemy ORM model for distribution centers."""
    __tablename__ = "distribution_centers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False)
    location = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    capacity = Column(Integer, nullable=True)
    region = Column(String(100), nullable=True, index=True)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Health check response model


class HealthResponse(BaseModel):
    """Pydantic model for health check response."""
    status: str
    service: str
    version: str


class SuccessResponse(BaseModel):
    """Pydantic model for success responses."""
    success: bool = True
