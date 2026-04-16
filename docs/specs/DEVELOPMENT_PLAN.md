# DEVELOPMENT PLAN: Proyecto Demo Distroviz

## 1. ARCHITECTURE OVERVIEW

**System Components:**
- **Backend (FastAPI, Python 3.11):**
  - Exposes REST API for metrics, orders, and trends.
  - Uses SQLite for persistent storage.
  - Uses Redis for caching metrics.
  - Modular structure: models, db, cache, CRUD, API routers, dependencies.
- **Frontend (React 18, TypeScript):**
  - Dashboard UI for metrics, trends, and order management.
  - Uses React Query for data fetching/caching.
  - Chart.js for visualizations.
  - Responsive, with light/dark theme support.
- **Infrastructure:**
  - Dockerized backend, frontend, and Redis.
  - Nginx as reverse proxy.
  - Docker Compose for orchestration.
  - Healthchecks, environment validation, and startup automation.

**Key Models & APIs:**
- **DistributionOrder, DistributionOrderCreate, DistributionOrderFilter, Metric, TrendPoint, TrendResponse** (see SPEC.md §2).
- **API Endpoints:** `/api/metrics`, `/api/orders`, `/api/orders/{id}`, `/api/trends` (see SPEC.md §3).

**Folder Structure:**
```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── db.py
│   │   ├── cache.py
│   │   ├── crud.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── orders.py
│   │   │   ├── metrics.py
│   │   │   ├── trends.py
│   │   └── dependencies.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   ├── orders.ts
│   │   │   ├── metrics.ts
│   │   │   ├── trends.ts
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   ├── useMetrics.ts
│   │   │   ├── useTrends.ts
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   ├── MetricCards.tsx
│   │   ├── types/
│   │   │   ├── index.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   ├── index.html
│   ├── public/
│   │   ├── favicon.ico
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── README.md
├── nginx/
│   ├── nginx.conf
├── docker-compose.yml
├── .env.example
├── .gitignore
├── run.sh
├── README.md
├── docs/
│   ├── architecture.md
```

## 2. ACCEPTANCE CRITERIA

1. **End-to-end dashboard:** User can view real-time metrics, trends, and order list with filters and pagination, all data loaded from FastAPI backend via REST endpoints.
2. **Order creation:** User can create a new distribution order via a validated form; on success, dashboard data updates and user receives confirmation; on error, user receives clear feedback.
3. **Infrastructure:** Running `./run.sh` brings up all services (backend, frontend, Redis, Nginx) with healthchecks, and the dashboard is accessible at the documented URL with all endpoints functional.

---

## TEAM SCOPE (MANDATORY — PARSED BY THE PIPELINE)

- **role-tl (technical_lead):** Item 1 (Foundation)
- **role-be (backend_developer):** Item 2 (Backend API)
- **role-fe (frontend_developer):** Item 3 (Frontend Dashboard)
- **role-devops (devops_support):** Item 4 (Infrastructure & Deployment)

---

## 3. EXECUTABLE ITEMS

---

### ITEM 1: Foundation — shared types, interfaces, DB schemas, config

**Goal:**  
Create all shared code and contracts for backend and frontend.  
- All Pydantic and SQLAlchemy models (DistributionOrder, etc.), enums, and DB schema.
- All TypeScript interfaces for frontend.
- Shared config and utility files for both backend and frontend.
- requirements.txt with all backend dependencies.

**Files to create:**
- backend/app/models.py — All Pydantic models and SQLAlchemy ORM models for DistributionOrder, DistributionOrderCreate, DistributionOrderFilter, Metric, TrendPoint, TrendResponse, plus Plant and DistributionCenter models (for DB schema completeness).
- backend/app/db.py — DB connection/session logic for SQLite, including Alembic integration.
- backend/app/cache.py — Redis cache logic (get_cache, cache_metrics, get_cached_metrics).
- backend/app/dependencies.py — Dependency injection for DB and cache.
- backend/requirements.txt — All Python dependencies (fastapi, pydantic, sqlalchemy, alembic, redis, uvicorn, etc.).
- backend/alembic/env.py — Alembic migration environment.
- backend/alembic/versions/<timestamp>_initial.py — Initial migration: creates all tables and indexes.
- frontend/src/types/index.ts — All TypeScript interfaces from SPEC.md §2.
- frontend/src/utils/date.ts — Date formatting helpers for frontend.
- frontend/src/api/config.ts — API base URL and Axios instance setup.
- frontend/src/api/errors.ts — API error handling utilities.

**Dependencies:** None

**Validation:**  
- `alembic upgrade head` creates all tables and indexes in SQLite DB.
- `pip install -r backend/requirements.txt` completes with no errors.
- TypeScript interfaces match backend models exactly.

**Role:** role-tl (technical_lead)

---

### ITEM 2: Backend API — FastAPI endpoints, business logic, caching

**Goal:**  
Implement all backend API endpoints and business logic as per SPEC.md §3:
- `/api/metrics` (GET): Returns Metric.
- `/api/orders` (GET, POST): List and create DistributionOrder.
- `/api/orders/{id}` (GET, PUT, DELETE): Retrieve, update, delete DistributionOrder.
- `/api/trends` (GET): Returns TrendResponse.
- Healthcheck endpoint.
- Implements caching for metrics with Redis.
- Loads seed data for plants, distribution centers, and orders if DB is empty.

**Files to create:**
- backend/app/main.py — FastAPI app entrypoint, includes all routers, CORS, healthcheck, startup events for seed data.
- backend/app/api/__init__.py — API package init.
- backend/app/api/orders.py — Orders endpoints (GET, POST, GET by id, PUT, DELETE).
- backend/app/api/metrics.py — Metrics endpoint (GET).
- backend/app/api/trends.py — Trends endpoint (GET).
- backend/app/seed.py — Seed data loader for plants, centers, and orders.
- backend/Dockerfile — Multi-stage build, non-root user, EXPOSE 8000, CMD: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- backend/app/logger.py — Structured JSON logging for all requests and errors.

**Dependencies:** Item 1

**Validation:**  
- `docker build . -t distroviz-backend` in backend/ succeeds.
- `uvicorn app.main:app` starts API, `/api/metrics` returns valid Metric.
- On first run, DB is seeded with plants, centers, and 30 orders.
- All endpoints respond as per SPEC.md, with correct validation and error handling.

**Role:** role-be (backend_developer)

---

### ITEM 3: Frontend Dashboard — React app, UI, hooks, API clients

**Goal:**  
Implement the complete dashboard UI and frontend logic:
- Dashboard view with 4 KPI metric cards, loading indicators.
- Trend line chart (last 6 months), bar chart by plant.
- Orders table with filters (plant, status), paginated (10 rows), colored badges, alternating row colors.
- Order creation form with dynamic selectors (plant, center), local validation, error feedback, and success notification.
- Responsive layout, light/dark theme toggle.
- API clients for all endpoints, React Query for data fetching/caching.
- Error handling: API down banner, POST errors as toast, form validation feedback.

**Files to create:**
- frontend/src/main.tsx — React entrypoint.
- frontend/src/App.tsx — Root component, theme provider, routing.
- frontend/src/components/Dashboard.tsx — Main dashboard view.
- frontend/src/components/MetricCards.tsx — KPI cards.
- frontend/src/components/TrendChart.tsx — Trend line chart.
- frontend/src/components/OrderList.tsx — Orders table with filters, pagination, badges.
- frontend/src/components/OrderForm.tsx — Order creation form with dynamic selectors, validation, notifications.
- frontend/src/api/orders.ts — Orders API client (GET, POST, etc.).
- frontend/src/api/metrics.ts — Metrics API client.
- frontend/src/api/trends.ts — Trends API client.
- frontend/src/hooks/useOrders.ts — Orders state hook (fetch, filter, pagination).
- frontend/src/hooks/useMetrics.ts — Metrics state hook.
- frontend/src/hooks/useTrends.ts — Trends state hook.
- frontend/Dockerfile — Multi-stage build, non-root user, EXPOSE 5173, CMD: `npm run preview`.
- frontend/vite.config.ts — Vite config with API proxy.
- frontend/tsconfig.json — TypeScript config (strict mode).
- frontend/package.json — All dependencies and scripts.

**Dependencies:** Item 1

**Validation:**  
- `docker build . -t distroviz-frontend` in frontend/ succeeds.
- App loads at `/`, displays metrics, charts, and orders from backend.
- Creating an order updates dashboard and shows notification.
- All UI elements are responsive and theme toggle works.

**Role:** role-fe (frontend_developer)

---

### ITEM 4: Infrastructure & Deployment

**Goal:**  
Provide complete orchestration and deployment for local development:
- Docker Compose for backend, frontend, Redis, and Nginx.
- Healthchecks for all services.
- Environment variable templates and documentation.
- Startup script for zero-manual setup.
- Project-level README and architecture docs.

**Files to create:**
- docker-compose.yml — Orchestrates backend (8000), frontend (5173), redis (6379), nginx (80); healthchecks and depends_on with service_healthy.
- nginx/nginx.conf — Reverse proxy config for frontend and backend APIs.
- .env.example — All required environment variables with descriptions and example values.
- .gitignore — Exclude node_modules, dist, .env, __pycache__, *.pyc, etc.
- .dockerignore — Exclude node_modules, .git, *.log, dist, etc.
- run.sh — Checks Docker, builds images, starts services, waits for healthy, prints access URL.
- README.md — Prerequisites, setup, run instructions, endpoints, troubleshooting.
- docs/architecture.md — System diagram and component descriptions.

**Dependencies:** Items 1, 2, 3

**Validation:**  
- `./run.sh` completes with no errors.
- All containers are healthy (`docker ps`).
- Dashboard accessible at `http://localhost` (Nginx proxy).
- All endpoints functional and data flows end-to-end.

**Role:** role-devops (devops_support)

---