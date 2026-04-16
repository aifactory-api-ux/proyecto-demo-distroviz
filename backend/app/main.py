"""
FastAPI application entrypoint for DistroViz.

This module initializes the FastAPI app, configures CORS, registers
routers, sets up health checks, and seeds initial data on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import orders_router, metrics_router, trends_router
from app.crud import seed_initial_data
from app.db import SessionLocal, init_db
from app.models import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    
    Handles startup and shutdown events. On startup, initializes the
    database and seeds initial data. On shutdown, performs cleanup.
    
    Args:
        app: The FastAPI application instance.
    """
    # Startup event
    logger.info("Starting DistroViz API...")
    
    # Initialize database tables
    logger.info("Initializing database tables...")
    init_db()
    
    # Seed initial data
    logger.info("Seeding initial data...")
    db = SessionLocal()
    try:
        seed_initial_data(db)
        logger.info("Initial data seeding complete")
    finally:
        db.close()
    
    logger.info("DistroViz API started successfully")
    
    yield
    
    # Shutdown event
    logger.info("Shutting down DistroViz API...")


# Create FastAPI application
app = FastAPI(
    title="DistroViz API",
    description="API for distribution order management and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(orders_router)
app.include_router(metrics_router)
app.include_router(trends_router)


@app.get("/healthcheck", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    
    Returns the health status of the API service.
    
    Returns:
        HealthResponse with status, service name, and version.
    """
    return HealthResponse(
        status="healthy",
        service="distroviz-api",
        version="1.0.0"
    )


@app.get("/", tags=["root"])
def root():
    """
    Root endpoint.
    
    Returns a welcome message and links to documentation.
    
    Returns:
        Dictionary with welcome message and API information.
    """
    return {
        "message": "Welcome to DistroViz API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
