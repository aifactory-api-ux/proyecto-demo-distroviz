# SPEC.md

## 1. TECHNOLOGY STACK

- **Backend**
  - Python 3.11
  - FastAPI 0.110.0
  - Pydantic 2.6.4
  - Uvicorn 0.29.0
  - SQLite 3 (bundled with Python)
  - Redis 7 (for caching, via `redis-py` 5.0.3)
- **Frontend**
  - React 18.2.0
  - TypeScript 5.4.x
  - Vite 5.2.x
  - Axios 1.6.x
  - React Query 5.0.x
  - Chart.js 4.4.x
  - date-fns 3.6.x
- **Infrastructure**
  - Docker 26.x
  - Docker Compose 2.27.x
  - Nginx 1.26.x (reverse proxy)
- **Testing**
  - Pytest 8.2.x (backend)
  - React Testing Library 14.x (frontend)
  - Jest 29.x (frontend)

---

## 2. DATA CONTRACTS

### Python (Pydantic Models)

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class DistributionOrder(BaseModel):
    id: int
    order_number: str
    product_name: str
    quantity: int
    destination: str
    status: str
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]

class DistributionOrderCreate(BaseModel):
    order_number: str
    product_name: str
    quantity: int
    destination: str
    status: str
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]

class DistributionOrderFilter(BaseModel):
    from_date: Optional[date]
    to_date: Optional[date]
    status: Optional[str]

class Metric(BaseModel):
    total_orders: int
    total_quantity: int
    delivered_orders: int
    pending_orders: int

class TrendPoint(BaseModel):
    date: date
    delivered: int
    pending: int

class TrendResponse(BaseModel):
    trend: List[TrendPoint]
```

### TypeScript (Frontend Interfaces)

```typescript
export interface DistributionOrder {
  id: number;
  order_number: string;
  product_name: string;
  quantity: number;
  destination: string;
  status: string;
  shipped_at?: string | null; // ISO datetime
  delivered_at?: string | null; // ISO datetime
}

export interface DistributionOrderCreate {
  order_number: string;
  product_name: string;
  quantity: number;
  destination: string;
  status: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface DistributionOrderFilter {
  from_date?: string; // ISO date
  to_date?: string;   // ISO date
  status?: string;
}

export interface Metric {
  total_orders: number;
  total_quantity: number;
  delivered_orders: number;
  pending_orders: number;
}

export interface TrendPoint {
  date: string; // ISO date
  delivered: number;
  pending: number;
}

export interface TrendResponse {
  trend: TrendPoint[];
}
```

---

## 3. API ENDPOINTS

### 1. Get Dashboard Metrics

- **GET** `/api/metrics`
- **Request:** None
- **Response:** `Metric`
  ```json
  {
    "total_orders": 120,
    "total_quantity": 3500,
    "delivered_orders": 90,
    "pending_orders": 30
  }
  ```

### 2. List Distribution Orders (with optional filters)

- **GET** `/api/orders`
- **Query Params:** `from_date` (ISO date), `to_date` (ISO date), `status` (string)
- **Response:** `List[DistributionOrder]`
  ```json
  [
    {
      "id": 1,
      "order_number": "ORD-20240401-001",
      "product_name": "Producto A",
      "quantity": 100,
      "destination": "CDMX",
      "status": "delivered",
      "shipped_at": "2024-04-01T10:00:00Z",
      "delivered_at": "2024-04-02T15:00:00Z"
    }
  ]
  ```

### 3. Create Distribution Order

- **POST** `/api/orders`
- **Request:** `DistributionOrderCreate`
  ```json
  {
    "order_number": "ORD-20240401-002",
    "product_name": "Producto B",
    "quantity": 200,
    "destination": "Monterrey",
    "status": "pending",
    "shipped_at": null,
    "delivered_at": null
  }
  ```
- **Response:** `DistributionOrder` (created object)

### 4. Get Distribution Order by ID

- **GET** `/api/orders/{id}`
- **Response:** `DistributionOrder`

### 5. Update Distribution Order

- **PUT** `/api/orders/{id}`
- **Request:** `DistributionOrderCreate`
- **Response:** `DistributionOrder` (updated object)

### 6. Delete Distribution Order

- **DELETE** `/api/orders/{id}`
- **Response:** `{ "success": true }`

### 7. Get Trend Data

- **GET** `/api/trends`
- **Query Params:** `from_date` (ISO date), `to_date` (ISO date)
- **Response:** `TrendResponse`
  ```json
  {
    "trend": [
      { "date": "2024-04-01", "delivered": 10, "pending": 5 },
      { "date": "2024-04-02", "delivered": 15, "pending": 3 }
    ]
  }
  ```

---

## 4. FILE STRUCTURE

### PORT TABLE

| Service         | Listening Port | Path                      |
|-----------------|---------------|---------------------------|
| backend         | 8000          | backend/                  |
| redis           | 6379          | (Docker image)            |
| nginx-proxy     | 80            | nginx/                    |

### FILE TREE

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py                # App package init
│   │   ├── main.py                    # FastAPI entrypoint
│   │   ├── models.py                  # Pydantic models and ORM models
│   │   ├── db.py                      # SQLite DB connection and session
│   │   ├── cache.py                   # Redis cache logic
│   │   ├── crud.py                    # CRUD operations for orders
│   │   ├── api/
│   │   │   ├── __init__.py            # API package init
│   │   │   ├── orders.py              # Orders endpoints
│   │   │   ├── metrics.py             # Metrics endpoints
│   │   │   ├── trends.py              # Trends endpoints
│   │   └── dependencies.py            # Dependency injection (DB, cache)
│   ├── tests/
│   │   ├── __init__.py                # Tests package init
│   │   ├── test_orders.py             # Orders API tests
│   │   ├── test_metrics.py            # Metrics API tests
│   │   ├── test_trends.py             # Trends API tests
│   ├── Dockerfile                     # Backend Dockerfile
│   ├── requirements.txt               # Python dependencies
│   └── alembic/                       # (Optional) DB migrations
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # React entrypoint
│   │   ├── App.tsx                    # Root component
│   │   ├── api/
│   │   │   ├── orders.ts              # Orders API client
│   │   │   ├── metrics.ts             # Metrics API client
│   │   │   ├── trends.ts              # Trends API client
│   │   ├── hooks/
│   │   │   ├── useOrders.ts           # Orders state hook
│   │   │   ├── useMetrics.ts          # Metrics state hook
│   │   │   ├── useTrends.ts           # Trends state hook
│   │   ├── components/
│   │   │   ├── Dashboard.tsx          # Dashboard main view
│   │   │   ├── OrderList.tsx          # Orders table
│   │   │   ├── OrderForm.tsx          # Create/edit order form
│   │   │   ├── TrendChart.tsx         # Trend chart component
│   │   │   ├── MetricCards.tsx        # Metric summary cards
│   │   ├── types/
│   │   │   ├── index.ts               # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── date.ts                # Date formatting helpers
│   │   ├── index.html                 # HTML entrypoint
│   ├── public/
│   │   ├── favicon.ico                # Favicon
│   ├── Dockerfile                     # Frontend Dockerfile
│   ├── vite.config.ts                 # Vite config
│   ├── tsconfig.json                  # TypeScript config
│   ├── package.json                   # NPM dependencies
│   ├── README.md                      # Frontend README
├── nginx/
│   ├── nginx.conf                     # Nginx reverse proxy config
├── docker-compose.yml                 # Multi-service orchestration
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
├── README.md                          # Project overview and setup
├── run.sh                             # Startup script (root)
```

---

## 5. ENVIRONMENT VARIABLES

| Name                | Type   | Description                                         | Example Value                |
|---------------------|--------|-----------------------------------------------------|------------------------------|
| BACKEND_HOST        | string | Host for backend service                            | backend                      |
| BACKEND_PORT        | int    | Backend listening port                              | 8000                         |
| FRONTEND_PORT       | int    | Frontend dev server port                            | 5173                         |
| REDIS_HOST          | string | Redis hostname                                      | redis                        |
| REDIS_PORT          | int    | Redis port                                          | 6379                         |
| SQLITE_DB_PATH      | string | SQLite DB file path                                 | /data/distroviz.db           |
| ALLOWED_ORIGINS     | string | CORS allowed origins (comma-separated)              | http://localhost:5173        |
| SECRET_KEY          | string | Secret key for session/cookie signing               | supersecretkey               |
| TZ                  | string | Timezone for backend                                | America/Mexico_City          |
| VITE_API_URL        | string | API base URL for frontend (Vite env var)            | http://localhost/api         |

---

## 6. IMPORT CONTRACTS

### Backend

- `from app.models import DistributionOrder, DistributionOrderCreate, DistributionOrderFilter, Metric, TrendPoint, TrendResponse`
- `from app.crud import get_orders, create_order, update_order, delete_order, get_order_by_id, get_metrics, get_trends`
- `from app.db import get_db_session`
- `from app.cache import get_cache, cache_metrics, get_cached_metrics`
- `from app.api.orders import router as orders_router`
- `from app.api.metrics import router as metrics_router`
- `from app.api.trends import router as trends_router`
- `from app.dependencies import get_current_user` (if auth added)

### Frontend

- `import { DistributionOrder, DistributionOrderCreate, DistributionOrderFilter, Metric, TrendPoint, TrendResponse } from '../types'`
- `import { useOrders } from '../hooks/useOrders'`
- `import { useMetrics } from '../hooks/useMetrics'`
- `import { useTrends } from '../hooks/useTrends'`
- `import { getOrders, createOrder, updateOrder, deleteOrder, getOrderById } from '../api/orders'`
- `import { getMetrics } from '../api/metrics'`
- `import { getTrends } from '../api/trends'`
- `import OrderList from '../components/OrderList'`
- `import OrderForm from '../components/OrderForm'`
- `import Dashboard from '../components/Dashboard'`
- `import TrendChart from '../components/TrendChart'`
- `import MetricCards from '../components/MetricCards'`

---

## 7. FRONTEND STATE & COMPONENT CONTRACTS

### React Hooks

- `useOrders() → { orders, loading, error, createOrder, updateOrder, deleteOrder, fetchOrders, selectedOrder, setSelectedOrder, filter, setFilter }`
- `useMetrics() → { metrics, loading, error, refetch }`
- `useTrends() → { trend, loading, error, fetchTrend, filter, setFilter }`

### Components

- `Dashboard` props: `{ }` (renders dashboard layout, no props)
- `OrderList` props: `{ orders: DistributionOrder[], onEdit: (order: DistributionOrder) => void, onDelete: (id: number) => void, loading: boolean, deletingId: number | null }`
- `OrderForm` props: `{ order?: DistributionOrder, onSubmit: (data: DistributionOrderCreate) => void, onCancel: () => void, loading: boolean }`
- `TrendChart` props: `{ trend: TrendPoint[], loading: boolean }`
- `MetricCards` props: `{ metrics: Metric | null, loading: boolean }`

---

## 8. FILE EXTENSION CONVENTION

- **Frontend files:** `.tsx` (TypeScript React)
- **Project language:** TypeScript (frontend), Python (backend)
- **Entry point:** `/src/main.tsx` (as referenced in `index.html`)
- **All frontend source files use `.tsx` or `.ts` extensions exclusively.**
- **No `.jsx` or `.js` files are used in the frontend.**

---