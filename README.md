# CaseCellShop

CaseCellShop is a small fullstack checkout project for phone cases. It demonstrates public product browsing, seeded-user login, authenticated checkout, atomic stock reservation, idempotent order creation, fake ERP processing, order status lookup, shared API/frontend contracts, Dockerized local delivery, and automated tests.

## Stack

- Monorepo: pnpm workspaces and Turborepo
- API: Node.js, TypeScript, Fastify, Prisma, PostgreSQL, JWT, bcrypt, Zod, Pino
- Web: React, TypeScript, Vite, Tailwind CSS v3, Vitest, Testing Library
- Shared contracts: `@casecellshop/shared` workspace package

## Monorepo Structure

```text
apps/
  api/       Fastify API, Prisma schema, backend tests
  web/       React storefront, frontend tests
packages/
  shared/    DTOs, API envelopes, error codes, Zod schemas, order status types
  tsconfig/  shared TypeScript configs
```

`packages/shared` is the only source for API/frontend communication contracts. The API and web app import DTOs, schemas, error codes, and status types from this package instead of duplicating them.

## Setup

Requirements:

- Node.js 22+
- Corepack
- Docker and Docker Compose for the local PostgreSQL/runtime path

Install dependencies:

```bash
corepack enable pnpm
pnpm install
```

Copy environment examples when running apps outside Docker:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Seeded demo credentials:

```text
Email: demo@casecellshop.local
Password: demo123
```

## Local Commands

```bash
pnpm turbo run build
pnpm turbo run typecheck
pnpm turbo run lint
pnpm turbo run test
pnpm turbo run test:integration
pnpm turbo run dev
```

Package-scoped examples:

```bash
pnpm --filter api dev
pnpm --filter web dev
pnpm turbo run test typecheck lint --filter=web
```

## Database

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run migrations and seed data from the host:

```bash
pnpm --filter api prisma:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

The seed creates the demo user with a bcrypt password hash and three sample phone case products.

## Docker

Build and start the runtime:

```bash
docker compose up --build
```

Services:

- PostgreSQL: `localhost:5432`
- API: `http://localhost:3000`
- API docs: `http://localhost:3000/docs`
- Web: `http://localhost:5173`

Docker images are built from the monorepo root so `apps/api` and `apps/web` can access `packages/shared` during install and build.

Migration and seed are intentionally explicit. After the services are up, run:

```bash
docker compose exec api pnpm --filter api db:migrate
docker compose exec api pnpm --filter api db:seed
```

If `5173` was occupied during `docker compose up --build`, stop the local process using that port and recreate the web service:

```bash
docker compose up -d --force-recreate web
```

## Environment Variables

API:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://casecellshop:casecellshop@localhost:5432/casecellshop?schema=public
JWT_SECRET=local-development-secret
PENDING_ORDERS_WORKER_INTERVAL_MS=10000
```

Web:

```text
VITE_API_URL=http://localhost:3000
```

For a stronger local JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/login` | No | Login with seeded credentials |
| `GET` | `/products` | No | List products |
| `GET` | `/products/:productId` | No | Load product detail |
| `POST` | `/orders` | Bearer JWT | Create order with `Idempotency-Key` |
| `GET` | `/orders/:orderId` | No | Load public order status |

All successful responses use:

```ts
ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  traceId?: string;
}
```

All known errors use:

```ts
ApiErrorResponse = {
  success: false;
  message: string;
  error: { code: AppErrorCode; details?: unknown };
  traceId: string;
}
```

Error codes:

- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `PRODUCT_NOT_FOUND`
- `ORDER_NOT_FOUND`
- `IDEMPOTENCY_KEY_REQUIRED`
- `DUPLICATE_ORDER_CONFLICT`
- `STOCK_INSUFFICIENT`
- `ERP_TEMPORARY_FAILURE`
- `INTERNAL_ERROR`

## Checkout Behavior

Checkout is submitted as intent only. The backend validates the request, checks authentication, compares idempotency hashes, reserves stock in PostgreSQL, persists order items, and dispatches the fake ERP workflow.

Stock safety:

- `available_stock` and `reserved_stock` live in PostgreSQL.
- Reservation is a conditional database update inside the order transaction.
- If no row can be updated, the API returns `STOCK_INSUFFICIENT`.
- Confirmed orders consume reserved stock.
- Expired reservations release reserved stock.

Idempotency:

- The unique key is `(user_id, idempotency_key)`.
- The service hashes a normalized request payload.
- Same key and same payload returns the existing order result.
- Same key and different payload returns `DUPLICATE_ORDER_CONFLICT`.

ERP simulation:

- Confirmed orders return `201` and `CONFIRMED`.
- Delayed processing returns `202` and `PENDING_ERP`; status can be checked later.
- Temporary processor failure returns `503` and `ERP_TEMPORARY_FAILURE` before accepting the order.
- The pending-order worker can transition pending orders to `CONFIRMED`, `FAILED_TEMPORARY`, or `EXPIRED`.

## Testing

Backend tests live under `apps/api/tests/` and include unit, integration, and concurrency coverage.

Frontend tests live next to the React modules under `apps/web/src/` and cover:

- `error-mapper.ts` coverage for every shared error code
- idempotency key generation and retry reuse
- status badge rendering for every shared order status
- quantity validation and blocked decrement behavior
- snapshots for product cards, checkout loading, and feedback states

Run all package tests:

```bash
pnpm turbo run test
```

Run the main final verification:

```bash
pnpm turbo run build test typecheck
```

This command expects PostgreSQL on `localhost:5432` when API integration tests are enabled through `apps/api/vitest.config.ts`.

## Architecture

```mermaid
flowchart LR
  Browser[React web app] -->|typed service calls| API[Fastify API]
  API --> Shared[@casecellshop/shared contracts]
  Browser --> Shared
  API --> Prisma[Prisma client]
  Prisma --> Postgres[(PostgreSQL)]
  API --> ERP[Fake ERP service]
  Worker[Pending order worker] --> ERP
  Worker --> Prisma
```

## Checkout Flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web
  participant A as API
  participant DB as PostgreSQL
  participant E as Fake ERP

  U->>W: Select product and quantity
  W->>A: POST /orders with JWT and Idempotency-Key
  A->>A: Validate body and auth
  A->>DB: Check idempotency key and request hash
  A->>DB: Reserve stock atomically
  A->>DB: Persist order, items, idempotency record
  A->>E: Dispatch ERP processing
  E-->>A: Confirmed, delayed, or temporary failure
  A-->>W: 201 CONFIRMED, 202 PENDING_ERP, or known error
  W-->>U: Render feedback and status link
```

## User Action Flow

```mermaid
flowchart TD
  Browse[Browse products] --> Login{Logged in?}
  Login -- No --> Auth[Login with demo user]
  Auth --> Quantity[Choose quantity]
  Login -- Yes --> Quantity
  Quantity --> Valid{Valid positive integer?}
  Valid -- No --> Fix[Show validation and keep controls enabled]
  Fix --> Quantity
  Valid -- Yes --> Submit[Submit checkout]
  Submit --> Result{API result}
  Result -- Confirmed --> Confirmed[Show success and status link]
  Result -- Pending --> Pending[Show processing and status link]
  Result -- Stock error --> Refresh[Offer product stock refresh]
  Result -- Recoverable error --> Retry[Allow retry or new attempt]
```

## Database Model

```mermaid
erDiagram
  users ||--o{ orders : creates
  users ||--o{ idempotency_keys : owns
  orders ||--o{ order_items : contains
  products ||--o{ order_items : reserved_as
  orders ||--o{ idempotency_keys : result

  users {
    uuid id PK
    string email UK
    string password_hash
  }

  products {
    uuid id PK
    string name
    string model
    int available_stock
    int reserved_stock
    int price_cents
  }

  orders {
    uuid id PK
    uuid user_id FK
    enum status
    int total_cents
    datetime reservation_expires_at
  }

  order_items {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int quantity
    int unit_price_cents
    int line_total_cents
  }

  idempotency_keys {
    uuid id PK
    uuid user_id FK
    string idempotency_key
    string request_hash
    uuid order_id FK
  }
```

## API Ports and Classes

```mermaid
classDiagram
  class OrdersController {
    +create()
    +status()
  }
  class CreateOrderService {
    +createOrder()
  }
  class GetOrderStatusService {
    +getOrderStatus()
  }
  class OrderRepository
  class IdempotencyRepository
  class ProductRepository
  class FakeErpService
  class PendingOrdersWorker

  OrdersController --> CreateOrderService
  OrdersController --> GetOrderStatusService
  CreateOrderService --> OrderRepository
  CreateOrderService --> IdempotencyRepository
  CreateOrderService --> ProductRepository
  CreateOrderService --> FakeErpService
  GetOrderStatusService --> OrderRepository
  PendingOrdersWorker --> OrderRepository
  PendingOrdersWorker --> ProductRepository
  PendingOrdersWorker --> FakeErpService
```

## Observability

Checkout processing emits structured logs with request trace IDs and contextual fields such as user ID, order ID, idempotency key, step name, and result status. API errors also return `traceId` in the standard envelope.

## Limitations

- JWT storage uses local storage for challenge simplicity.
- `GET /orders/:orderId` is public by ID and returns no sensitive user data.
- The pending-order worker runs in the API process and is not horizontally scalable.
- Payment, invoicing, customer profiles, admin catalog management, and real ERP integration are out of scope.
- Docker startup does not automatically run migrations or seed; those commands are documented explicitly.

## Next Steps

- Replace the in-process worker with a real queue for multi-instance deployments.
- Add refresh-token based authentication and safer browser token storage.
- Add an admin product stock management surface.
- Add end-to-end browser tests against the Docker runtime.
