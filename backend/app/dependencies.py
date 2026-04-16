"""
Dependency injection module for FastAPI application.

Provides database session and cache client dependencies that can be
injected into route handlers. Also validates required environment
variables on application startup.
"""

import os
from typing import Generator, Optional

import redis
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.cache import get_redis_client


# Required environment variables for the application (all optional with defaults)
REQUIRED_ENV_VARS = []

# Optional environment variables with defaults
OPTIONAL_ENV_VARS = {
    "REDIS_DB": "0",
    "REDIS_PASSWORD": None,
    "REDIS_TIMEOUT": "5",
    "CACHE_TTL_METRICS": "300",
    "CACHE_TTL_TRENDS": "600",
}


class Settings:
    """
    Application settings loaded from environment variables.
    
    Validates required variables on initialization and crashes
    if any required variables are missing.
    """
    
    def __init__(self) -> None:
        self._validate_environment()
        
        # Database configuration
        self.database_url = os.environ.get("DATABASE_URL", "sqlite:///./distroviz.db")
        
        # Redis configuration
        self.redis_host = os.environ.get("REDIS_HOST", "localhost")
        self.redis_port = int(os.environ.get("REDIS_PORT", "6379"))
        self.redis_db = int(os.environ.get("REDIS_DB", OPTIONAL_ENV_VARS["REDIS_DB"]))
        self.redis_password = os.environ.get("REDIS_PASSWORD") or OPTIONAL_ENV_VARS["REDIS_PASSWORD"]
        self.redis_timeout = int(os.environ.get("REDIS_TIMEOUT", OPTIONAL_ENV_VARS["REDIS_TIMEOUT"]))
        
        # Cache TTL settings (in seconds)
        self.cache_ttl_metrics = int(os.environ.get("CACHE_TTL_METRICS", OPTIONAL_ENV_VARS["CACHE_TTL_METRICS"]))
        self.cache_ttl_trends = int(os.environ.get("CACHE_TTL_TRENDS", OPTIONAL_ENV_VARS["CACHE_TTL_TRENDS"]))
    
    def _validate_environment(self) -> None:
        """
        Validate that all required environment variables are present.
        
        Raises:
            RuntimeError: If any required environment variable is missing.
        """
        missing_vars = []
        
        for var_name in REQUIRED_ENV_VARS:
            if var_name not in os.environ or not os.environ[var_name]:
                missing_vars.append(var_name)
        
        if missing_vars:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing_vars)}. "
                f"Please set these variables before starting the application."
            )
    
    def get_database_url(self) -> str:
        """Get the database connection URL."""
        return self.database_url
    
    def get_redis_config(self) -> dict:
        """Get Redis connection configuration as a dictionary."""
        config = {
            "host": self.redis_host,
            "port": self.redis_port,
            "db": self.redis_db,
            "socket_timeout": self.redis_timeout,
            "socket_connect_timeout": self.redis_timeout,
            "decode_responses": True,
        }
        if self.redis_password:
            config["password"] = self.redis_password
        return config


# Global settings instance
settings = Settings()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    
    Creates a new session for each request and ensures it is
    properly closed after the request is completed.
    
    Yields:
        Session: SQLAlchemy database session.
    
    Example:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_cache():
    """
    Dependency that provides a Redis client.
    
    Returns a Redis client for caching operations.
    
    Returns:
        Redis client instance.
    """
    return get_redis_client(
        host=settings.redis_host,
        port=settings.redis_port,
        db=settings.redis_db,
        password=settings.redis_password,
        timeout=settings.redis_timeout
    )


def get_cache_ttl_metrics() -> int:
    """Get the TTL (time-to-live) for cached metrics in seconds."""
    return settings.cache_ttl_metrics


def get_cache_ttl_trends() -> int:
    """Get the TTL (time-to-live) for cached trends in seconds."""
    return settings.cache_ttl_trends
