# =============================================================================
# Backend Dockerfile - Python/FastAPI
# =============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for SQLite and Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/app ./app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///./data/distroviz.db
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Expose port
EXPOSE 8000

# Run FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
