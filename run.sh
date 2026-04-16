#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env created from .env.example"
    else
        print_warning ".env.example not found, creating default .env"
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=sqlite:///./distroviz.db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Cache TTL Settings (in seconds)
CACHE_TTL_METRICS=300
CACHE_TTL_TRENDS=600

# Frontend Configuration
VITE_API_URL=http://backend:8000
EOF
        print_success ".env created with default values"
    fi
else
    print_status ".env already exists, skipping creation"
fi

# Check if Docker is installed
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker is installed"

# Check if Docker daemon is running
print_status "Checking Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker first."
    exit 1
fi

print_success "Docker daemon is running"

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Build and start services
print_status "Building and starting services..."
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true

$DOCKER_COMPOSE up --build -d

print_success "Services built and started"

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."

# Function to check service health
check_service_health() {
    local service=$1
    local max_attempts=$2
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if $DOCKER_COMPOSE ps --format json 2>/dev/null | grep -q "$service"; then
            local status=$($DOCKER_COMPOSE ps $service --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
            if [ "$status" == "running" ]; then
                return 0
            fi
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    return 1
}

# Wait for backend to be healthy
print_status "Waiting for backend to be healthy..."
backend_attempts=0
max_backend_attempts=30
while [ $backend_attempts -lt $max_backend_attempts ]; do
    if curl -s http://localhost:8000/healthcheck > /dev/null 2>&1; then
        print_success "Backend is healthy"
        break
    fi
    backend_attempts=$((backend_attempts + 1))
    sleep 2
done

if [ $backend_attempts -eq $max_backend_attempts ]; then
    print_error "Backend failed to become healthy"
    $DOCKER_COMPOSE logs backend
    exit 1
fi

# Wait for frontend to be healthy
print_status "Waiting for frontend to be healthy..."
frontend_attempts=0
max_frontend_attempts=30
while [ $frontend_attempts -lt $max_frontend_attempts ]; do
    if curl -s http://localhost > /dev/null 2>&1; then
        print_success "Frontend is healthy"
        break
    fi
    frontend_attempts=$((frontend_attempts + 1))
    sleep 2
done

if [ $frontend_attempts -eq $max_frontend_attempts ]; then
    print_warning "Frontend may not be fully ready yet, but continuing..."
fi

# Print access information
echo ""
echo "=========================================="
print_success "DistroViz is running!"
echo "=========================================="
echo ""
echo -e "${GREEN}Dashboard:${NC}       http://localhost"
echo -e "${GREEN}Backend API:${NC}     http://localhost/api"
echo -e "${GREEN}Backend Docs:${NC}    http://localhost/docs"
echo -e "${GREEN}Redis:${NC}           localhost:6379"
echo ""
echo "To stop the services, run: $DOCKER_COMPOSE down"
echo "To view logs, run: $DOCKER_COMPOSE logs -f"
echo ""
print_status "All services are up and running!"
