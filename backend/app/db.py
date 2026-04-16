"""
Database connection and session management for DistroViz.

This module provides SQLite database setup, session creation,
and table initialization using SQLAlchemy ORM.
"""

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.models import Base

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./distroviz.db"
)

# Create engine with appropriate settings for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def init_db() -> None:
    """
    Initialize database tables.
    
    Creates all tables defined in the ORM models if they don't exist.
    This function should be called on application startup.
    """
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    
    Creates a new session for each request and ensures it is
    properly closed after the request is completed.
    
    Yields:
        Session: SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
