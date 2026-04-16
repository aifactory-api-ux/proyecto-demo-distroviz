# DistroViz - Distribution Visualization Dashboard

A full-stack application for monitoring and managing distribution of finished products in manufacturing operations.


## Overview

DistroViz provides an interactive dashboard for operations managers and logistics coordinators to:
- Monitor key dispatch metrics
- Visualize trends
- Manage distribution orders efficiently

## Technology Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Redis
- **Frontend**: React 18, TypeScript, Vite, Chart.js
- **Database**: SQLite
- **Cache**: Redis
- **Proxy**: Nginx
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Docker 26.x or higher
- Docker Compose 2.27.x or higher
- 4GB RAM minimum
- 10GB disk space

## Quick Start

### Option 1: Using the startup script (recommended)

```bash
./run.sh
```

The script will:
1. Create `.env` file from `.env.example` if not exists
2. Check Docker installation and daemon status
3. Build all service images
4. Start all services with healthchecks
5. Wait for services to be healthy
6. Display access URLs

### Option 2: Manual start

```bash
# Create .env file
cp .env.example .env

# Build and start services
docker compose up --build -d

# Check status
docker compose ps
```

## Services

| Service       | Port  | URL                            |
|---------------|-------|--------------------------------|
| Nginx Proxy   | 3080  | http://localhost:3080          |
| Backend API   | 8010  | http://localhost:8010          |
| Frontend      | (via nginx) | http://localhost:3080      |
| Redis         | 6380  | localhost:6380                 |

Note: Port 80 is commonly occupied. The Nginx proxy is exposed on port 3080 by default.
To use standard port 80, ensure the port is available and update `docker-compose.yml`.


## API Endpoints

### Health Check
- `GET /healthcheck` - Service health status

### Metrics
- `GET /api/metrics` - Get dashboard metrics

### Orders
- `GET /api/orders` - List orders (optional filters: from_date, to_date, status)
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order by ID
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Trends
- `GET /api/trends` - Get trend data (optional filters: from_date, to_date)

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:3080/docs
- ReDoc: http://localhost:3080/redoc

## Environment Variables

| Variable             | Description                           | Default Value                |
|----------------------|---------------------------------------|------------------------------|
| DATABASE_URL         | SQLite database connection string    | sqlite:///./distroviz.db     |
| REDIS_HOST           | Redis host                            | redis                        |
| REDIS_PORT           | Redis port                            | 6379                         |
| REDIS_DB             | Redis database number                 | 0                            |
| CACHE_TTL_METRICS    | Cache TTL for metrics (seconds)       | 300                          |
| CACHE_TTL_TRENDS     | Cache TTL for trends (seconds)        | 600                          |
| VITE_API_URL         | Frontend API URL                      | http://backend:8000         |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   ├── models.py      # Pydantic & SQLAlchemy models
│   │   ├── db.py          # Database configuration
│   │   ├── cache.py       # Redis caching
│   │   ├── crud.py        # Database operations
│   │   ├── dependencies.py # Dependency injection
│   │   └── main.py        # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # API clients
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Utility functions
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
├── nginx/
│   └── nginx.conf         # Nginx reverse proxy
├── docker-compose.yml
├── .env.example
├── run.sh
└── README.md
```

## Commands

### Start services
```bash
docker compose up -d
```

### Stop services
```bash
docker compose down
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild services
```bash
docker compose up --build -d
```

### Access container shell
```bash
docker compose exec backend sh
docker compose exec frontend sh
```

## Troubleshooting

### Services won't start
1. Check Docker daemon is running: `docker info`
2. Check ports are available: `netstat -tulpn | grep -E '3080|8010|6380'`
3. View logs: `docker compose logs`

### Backend healthcheck fails
1. Check database file permissions
2. Verify Redis connection: `docker compose exec redis redis-cli ping`
3. View backend logs: `docker compose logs backend`

### Frontend not loading
1. Check backend is healthy first
2. Verify nginx configuration: `docker compose exec nginx-proxy nginx -t`
3. Check frontend logs: `docker compose logs frontend`

### Reset everything
```bash
docker compose down -v
rm -f distroviz.db
docker compose up --build -d
```

## Development

### Backend development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend development
```bash
cd frontend
npm install
npm run dev
```

## License

MIT License

## Version

1.0.0 - March 2026
