# CaseCellShop - Part 1.B Implementation Plan with Turborepo Monorepo

## 1. Objective

Implement a small fullstack checkout flow for CaseCellShop, focused on phone case sales.

The goal from the challenge PDF is to let a user:

- view products;
- choose a quantity;
- try to finalize a purchase;
- receive clear responses for success, validation error, insufficient stock, duplicate attempt, and temporary processing failure;
- run and evaluate the project with a clear README, tests, and implementation notes.

This plan also includes the additional requirements defined for this implementation:

- API with **Node.js + TypeScript + Fastify**;
- **PostgreSQL** as database;
- Docker for API and database;
- simple authentication with login/password, required only to create an order;
- explicit error model with HTTP status codes and custom `errorCode` values;
- clear success messages;
- duplicate order prevention;
- atomic stock validation to handle concurrent order attempts;
- structured logging;
- endpoint to check order state;
- React + TypeScript frontend;
- **Turborepo** to orchestrate the monorepo;
- **shared package/directory** for API and frontend communication contracts;
- shared interfaces, DTOs, enums, error codes, Zod schemas, and response models used by both API and frontend;
- frontend error handling that does not freeze or break the screen;
- unit tests and snapshot UI tests;
- maintainability, scalability, and code quality as primary design constraints.

---

## 2. Proposed Scope

### In scope

- Product listing.
- Product detail lookup.
- Login with seeded user credentials.
- Order creation with authenticated request.
- Order state query.
- Atomic stock reservation.
- Duplicate order protection through idempotency keys.
- Simulated slow or unstable ERP processing.
- Structured logs for checkout steps.
- API unit tests with mocked dependencies.
- API integration/concurrency tests against PostgreSQL.
- Frontend product list, quantity selection, checkout action, status view, and error states.
- Frontend unit tests for handlers/classes.
- Frontend snapshot tests for relevant UI states.
- Docker Compose to run API, frontend, and PostgreSQL.

### Out of scope

- Real payment.
- Real ERP integration.
- Real production authentication/authorization.
- Real message broker.
- Cloud deployment.
- Full e-commerce catalog, cart, or customer profile module.

---

## 3. Main Technical Decision

Use the API as the source of truth for checkout. The frontend never decides if stock exists. It only sends the user intention to the API.

Use a **Turborepo monorepo** to keep the API, frontend, and shared communication contracts in one repository. The shared code must live in `packages/shared` and be consumed by both `apps/api` and `apps/web` through the workspace package `@casecellshop/shared`.

The shared package is not a place for business logic. It should contain only stable communication data and contracts: request DTOs, response DTOs, order statuses, error codes, API envelope types, Zod validation schemas that are safe to reuse on both sides, and small pure mappers where appropriate. Database models, repositories, Fastify plugins, React components, and service implementations stay inside their own apps.


The backend will use PostgreSQL transactions and conditional atomic updates to guarantee that only one order can reserve the last available unit.

For duplicate orders, the frontend sends an `Idempotency-Key` header when creating an order. The API stores this key with the authenticated user and request hash. Repeating the same request with the same key returns the original order result. Reusing the same key with a different payload returns a conflict.

For ERP slowness or instability, the mini-project will simulate ERP processing. The order can be created with a state such as `PENDING_ERP`, and the user can check the order state later through `GET /orders/:orderId`.

---

## 4. High-Level Architecture

```mermaid
flowchart LR
  U[User] --> W[apps/web: React Web App]
  W -->|uses DTOs, error codes, schemas| S[packages/shared]
  API[apps/api: Fastify API] -->|uses DTOs, error codes, schemas| S
  W -->|GET /products| API
  W -->|POST /auth/login| API
  W -->|POST /orders + Idempotency-Key| API
  W -->|GET /orders/:id| API
  API --> DB[(PostgreSQL)]
  API --> ERP[ERP Simulator]
  API --> LOG[Structured Logs / Pino]
  API --> WORKER[Order Processing Worker]
  WORKER --> DB
  WORKER --> ERP
```

### Runtime components

| Component | Responsibility |
|---|---|
| React App | Product listing, checkout form, order status, clear feedback messages. |
| Fastify API | HTTP contract, validation, authentication guard, logging, request correlation. |
| Order Use Cases | Business logic for creating orders, checking state, idempotency, and stock reservation. |
| Product Repository | Product read operations and atomic stock mutation. |
| Order Repository | Order creation, status transitions, idempotency lookup. |
| ERP Gateway | Interface for simulated ERP processing. Can be replaced by real ERP integration later. |
| PostgreSQL | Products, users, orders, order items, idempotency records, outbox/process records. |
| Worker | Processes pending orders and retries temporary ERP failures. For the mini-project it can run inside the API process. |

---

## 5. Repository Structure

Use one repository controlled by Turborepo and workspaces.

```text
casecellshop-checkout/
  apps/
    api/
      src/
        app.ts
        server.ts
        modules/
          auth/
            controllers/
              auth.controller.ts
            routes/
              auth.routes.ts
            services/
              auth.service.ts
            models/
              auth.repository.ts
              auth.types.ts
            utils/
              token.utils.ts
          products/
            controllers/
              products.controller.ts
            routes/
              products.routes.ts
            services/
              products.service.ts
            models/
              product.repository.ts
              product.types.ts
          orders/
            controllers/
              orders.controller.ts
            routes/
              orders.routes.ts
            services/
              create-order.service.ts
              get-order-status.service.ts
            models/
              order.repository.ts
              idempotency.repository.ts
              order.types.ts
            utils/
              request-hash.utils.ts
          erp/
            services/
              fake-erp.service.ts
            models/
              erp.types.ts
          common/
            errors/
              app-error.ts
              error-handler.ts
            logging/
              logger.ts
            plugins/
              auth.plugin.ts
              prisma.plugin.ts
              request-id.plugin.ts
            worker/
              pending-orders.worker.ts
        prisma/
          schema.prisma
          seed.ts
        tests/
          unit/
          integration/
          concurrency/
      package.json
      Dockerfile
      jest.config.ts
      tsconfig.json
    web/
      src/
        routes/
          index.tsx
          products.route.tsx
          login.route.tsx
          order-status.route.tsx
        features/
          auth/
            components/
              LoginForm.tsx
            hooks/
              useAuth.ts
          products/
            components/
              ProductCard.tsx
              ProductGrid.tsx
            hooks/
              useProducts.ts
          checkout/
            components/
              CheckoutPanel.tsx
              QuantitySelector.tsx
              FeedbackMessage.tsx
            hooks/
              useCheckout.ts
              useIdempotencyKey.ts
          order-status/
            components/
              OrderStatusView.tsx
              StatusBadge.tsx
            hooks/
              useOrderStatus.ts
        components/
          ui/
            Button.tsx
            Badge.tsx
            Input.tsx
            Card.tsx
            Spinner.tsx
        hooks/
          useAsync.ts
        services/
          http-client.ts
          products.service.ts
          orders.service.ts
          auth.service.ts
          error-mapper.ts
        utils/
          idempotency.utils.ts
        tests/
          unit/
          snapshots/
      package.json
      Dockerfile
      vite.config.ts
      tailwind.config.ts
      postcss.config.js
  packages/
    shared/
      src/
        index.ts
        api/
          api-response.ts
          pagination.ts
        auth/
          auth.dto.ts
          auth.schemas.ts
        products/
          product.dto.ts
          product.schemas.ts
        orders/
          order.dto.ts
          order-status.ts
          order-error-codes.ts
          order.schemas.ts
        errors/
          app-error-code.ts
          api-error-response.ts
          http-status-by-error-code.ts
      package.json
      tsconfig.json
    tsconfig/
      base.json
      node.json
      react.json
      package.json
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
  PROMPTS.md
```

### Turborepo package dependency graph

```mermaid
flowchart TD
  ROOT[root package.json + turbo.json] --> API[apps/api]
  ROOT --> WEB[apps/web]
  ROOT --> SHARED[packages/shared]
  ROOT --> TSCONFIG[packages/tsconfig]
  API --> SHARED
  WEB --> SHARED
  API --> TSCONFIG
  WEB --> TSCONFIG
  SHARED --> TSCONFIG
```

### Workspace rule

`apps/api` and `apps/web` may depend on `@casecellshop/shared`. `packages/shared` must not depend on either app. This avoids circular dependencies and keeps the communication contract reusable.

### Module directory convention

Each API module uses a consistent internal layout:

| Subfolder | Contents |
|---|---|
| `controllers/` | Route handler functions. Delegates to services immediately. No business logic. |
| `routes/` | Fastify route registration. Wires controllers and schema validation. |
| `services/` | Business logic and use cases. Knows nothing about HTTP or Fastify. |
| `models/` | Repository implementations and internal type definitions not exposed in `packages/shared`. |
| `utils/` | Module-scoped pure helper functions (hashing, formatting, mapping). |

The `common/` folder is reserved for cross-module API concerns: error classes, the global error handler, Fastify plugins, the Pino logger factory, and the pending-orders worker. Nothing in `common/` knows about individual modules.

### Dependency rule

Controllers should not contain business logic. Services should not know Fastify controllers.

Recommended direction:

```text
controller -> service -> repository (in models/) -> PostgreSQL
```

Testing strategy follows the same boundary:

- controller tests mock services;
- service tests mock repositories and the ERP gateway;
- repository/integration tests use PostgreSQL;
- frontend service tests mock the HTTP client.

---

## 5.1 Shared Communication Package

The shared directory must be implemented as the workspace package `packages/shared`, published internally as `@casecellshop/shared`.

### What belongs in `packages/shared`

| Shared item | Reason |
|---|---|
| Request DTOs | API and frontend agree on request body shape. |
| Response DTOs | Frontend consumes the same response model that the API returns. |
| Error codes | UI can map backend failures without string guessing. |
| Order statuses | UI status badges and API state transitions use the same enum/union. |
| Zod schemas | API validates requests and frontend can reuse schemas for client-side validation. |
| API envelope types | Every endpoint follows the same success/error response shape. |
| Small pure mappers | Useful only when they are deterministic and platform-independent. |

### What must not belong in `packages/shared`

- Prisma schema or database entities.
- Fastify controllers, plugins, decorators, or request objects.
- React components, hooks, routing, or browser-specific behavior.
- Repositories, gateways, services, use cases, or business processes.
- Secrets, environment variables, or infrastructure configuration.

### Shared package example

```ts
// packages/shared/src/orders/order-status.ts
export const ORDER_STATUSES = [
  'PENDING_ERP',
  'CONFIRMED',
  'FAILED_TEMPORARY',
  'EXPIRED',
  'REJECTED_STOCK',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
```

```ts
// packages/shared/src/errors/app-error-code.ts
export const APP_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  DUPLICATE_ORDER_CONFLICT: 'DUPLICATE_ORDER_CONFLICT',
  STOCK_INSUFFICIENT: 'STOCK_INSUFFICIENT',
  ERP_TEMPORARY_FAILURE: 'ERP_TEMPORARY_FAILURE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AppErrorCode = keyof typeof APP_ERROR_CODES;
```

```ts
// packages/shared/src/api/api-response.ts
import type { AppErrorCode } from '../errors/app-error-code';

export type ApiSuccessResponse<TData> = {
  message: string;
  data: TData;
};

export type ApiErrorResponse<TDetails = unknown> = {
  error: {
    code: AppErrorCode;
    message: string;
    details?: TDetails;
    traceId: string;
  };
};
```

```ts
// packages/shared/src/orders/order.schemas.ts
import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderRequestSchema = z.object({
  items: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
```

### Shared package import examples

API usage:

```ts
import {
  createOrderRequestSchema,
  APP_ERROR_CODES,
  type CreateOrderRequest,
  type ApiSuccessResponse,
} from '@casecellshop/shared';
```

Frontend usage:

```ts
import {
  APP_ERROR_CODES,
  type ApiErrorResponse,
  type OrderStatus,
  type ProductListItemDto,
} from '@casecellshop/shared';
```

### Contract stability rule

A change in `packages/shared` must be treated as an API contract change. The minimum validation before merging is:

1. `pnpm turbo run typecheck`
2. `pnpm turbo run test`
3. API contract tests
4. frontend error mapping tests
5. snapshot tests for user-visible states affected by the contract

### Shared contract flow

```mermaid
flowchart LR
  DTO[Shared DTOs and schemas] --> API_VALIDATION[API request validation]
  DTO --> API_RESPONSE[API response typing]
  DTO --> WEB_CLIENT[Frontend HTTP client typing]
  DTO --> WEB_UI[Frontend status/error mapping]
  API_VALIDATION --> ORDER_USE_CASE[Order use case]
  API_RESPONSE --> WEB_CLIENT
  WEB_CLIENT --> WEB_UI
```


## 6. Database Model

```mermaid
erDiagram
  USERS ||--o{ ORDERS : creates
  PRODUCTS ||--o{ ORDER_ITEMS : appears_in
  ORDERS ||--o{ ORDER_ITEMS : contains
  USERS ||--o{ IDEMPOTENCY_KEYS : owns
  ORDERS ||--o| IDEMPOTENCY_KEYS : linked_to

  USERS {
    uuid id PK
    string email UK
    string password_hash
    timestamp created_at
  }

  PRODUCTS {
    uuid id PK
    string name
    string model
    integer available_stock
    integer reserved_stock
    integer price_cents
    timestamp created_at
    timestamp updated_at
  }

  ORDERS {
    uuid id PK
    uuid user_id FK
    string status
    integer total_cents
    string failure_reason
    string erp_reference
    timestamp reservation_expires_at
    timestamp created_at
    timestamp updated_at
  }

  ORDER_ITEMS {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    integer quantity
    integer unit_price_cents
  }

  IDEMPOTENCY_KEYS {
    uuid id PK
    uuid user_id FK
    string idempotency_key
    string request_hash
    uuid order_id FK
    timestamp created_at
  }
```

### Order states

| State | Meaning | Stock behavior |
|---|---|---|
| `PENDING_ERP` | Order created and waiting for ERP confirmation. | Stock is reserved. |
| `CONFIRMED` | ERP accepted the order. | Reserved stock is consumed. |
| `FAILED_TEMPORARY` | ERP failed temporarily and the order may be retried. | Stock remains reserved until retry TTL or manual expiration. |
| `EXPIRED` | Reservation expired before ERP confirmation. | Reserved stock is released. |
| `REJECTED_STOCK` | Not enough stock at creation time. | No stock mutation. |
| `CANCELLED` | Order was cancelled. | Reserved stock is released when applicable. |

For the mini-project, `FAILED_TEMPORARY` can either keep reservation for a short TTL or immediately release stock. The better demonstration of checkout resilience is to keep the reservation temporarily and allow status checking/retry.

---

## 7. Atomic Stock Validation

The critical operation is stock reservation. It must be atomic and executed inside a database transaction.

Recommended SQL approach:

```sql
UPDATE products
SET
  available_stock = available_stock - $1,
  reserved_stock = reserved_stock + $1,
  updated_at = NOW()
WHERE id = $2
  AND available_stock >= $1
RETURNING id, available_stock, reserved_stock, price_cents;
```

If no row is returned, the API must return `STOCK_INSUFFICIENT`.

This handles the scenario where two customers try to buy the last available unit:

```mermaid
sequenceDiagram
  participant A as Client A
  participant B as Client B
  participant API as Fastify API
  participant DB as PostgreSQL

  A->>API: POST /orders qty=1
  B->>API: POST /orders qty=1
  API->>DB: UPDATE stock WHERE available_stock >= 1
  DB-->>API: row updated
  API-->>A: 201/202 order accepted
  API->>DB: UPDATE stock WHERE available_stock >= 1
  DB-->>API: 0 rows updated
  API-->>B: 422 STOCK_INSUFFICIENT
```

The database, not the application memory, enforces the stock rule. This remains valid if the API runs with multiple instances.

---

## 8. Duplicate Order Prevention

### Mechanism

The client generates a unique idempotency key for each checkout intention.

Example:

```http
POST /orders
Authorization: Bearer <token>
Idempotency-Key: 01JZ9P38W9SFE0Q5N0KZ6YV2YC
Content-Type: application/json
```

Request body:

```json
{
  "items": [
    {
      "productId": "d1c4c9e0-0c38-4e86-a6e7-3a4efdc5521a",
      "quantity": 1
    }
  ]
}
```

### Rules

1. If the same authenticated user sends the same `Idempotency-Key` with the same payload, return the already-created order.
2. If the same key is reused with a different payload, return `409 DUPLICATE_ORDER_CONFLICT`.
3. The unique database constraint should be:

```sql
UNIQUE (user_id, idempotency_key)
```

4. Store a normalized `request_hash` to compare repeated requests safely.

### Why this matters

This protects against:

- browser double click;
- frontend retry;
- network timeout followed by user retry;
- accidental repeated submission;
- slow ERP response where the user does not know whether the order was accepted.

---

## 9. API Contract

All request/response body types, error codes, and order status values in this contract should be exported from `packages/shared` and imported by both `apps/api` and `apps/web`. This prevents the frontend from duplicating backend response types manually.


### 9.1 Authentication

#### `POST /auth/login`

Request:

```json
{
  "email": "demo@casecellshop.local",
  "password": "demo123"
}
```

Success response - `200 OK`:

```json
{
  "message": "Login completed successfully.",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "user-id",
      "email": "demo@casecellshop.local"
    }
  }
}
```

Invalid credentials - `401 Unauthorized`:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "traceId": "req-123"
  }
}
```

---

### 9.2 List products

#### `GET /products`

Success response - `200 OK`:

```json
{
  "message": "Products loaded successfully.",
  "data": [
    {
      "id": "product-id",
      "name": "Black Silicone Case",
      "model": "iPhone 15",
      "availableStock": 3,
      "priceCents": 4990
    }
  ]
}
```

---

### 9.3 Get product by ID

#### `GET /products/:productId`

Success response - `200 OK`:

```json
{
  "message": "Product loaded successfully.",
  "data": {
    "id": "product-id",
    "name": "Black Silicone Case",
    "model": "iPhone 15",
    "availableStock": 3,
    "priceCents": 4990
  }
}
```

Not found - `404 Not Found`:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found.",
    "traceId": "req-123"
  }
}
```

---

### 9.4 Create order

#### `POST /orders`

Authentication required.

Headers:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-checkout-intention-key>
```

Request:

```json
{
  "items": [
    {
      "productId": "product-id",
      "quantity": 1
    }
  ]
}
```

Confirmed response - `201 Created`:

```json
{
  "message": "Order created successfully.",
  "data": {
    "orderId": "order-id",
    "status": "CONFIRMED",
    "totalCents": 4990,
    "items": [
      {
        "productId": "product-id",
        "quantity": 1,
        "unitPriceCents": 4990
      }
    ]
  }
}
```

Accepted but still processing - `202 Accepted`:

```json
{
  "message": "Order was accepted and is still being processed. Check the order status later.",
  "data": {
    "orderId": "order-id",
    "status": "PENDING_ERP"
  }
}
```

Validation error - `400 Bad Request`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": [
      {
        "field": "items.0.quantity",
        "message": "Quantity must be greater than zero."
      }
    ],
    "traceId": "req-123"
  }
}
```

Missing authentication - `401 Unauthorized`:

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Login is required to create an order.",
    "traceId": "req-123"
  }
}
```

Missing idempotency key - `400 Bad Request`:

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REQUIRED",
    "message": "Idempotency-Key header is required to create an order.",
    "traceId": "req-123"
  }
}
```

Duplicate key with different payload - `409 Conflict`:

```json
{
  "error": {
    "code": "DUPLICATE_ORDER_CONFLICT",
    "message": "This checkout attempt was already used with different order data.",
    "traceId": "req-123"
  }
}
```

Insufficient stock - `422 Unprocessable Entity`:

```json
{
  "error": {
    "code": "STOCK_INSUFFICIENT",
    "message": "There is not enough stock available for this product.",
    "details": {
      "productId": "product-id",
      "requestedQuantity": 2
    },
    "traceId": "req-123"
  }
}
```

Temporary ERP failure - `503 Service Unavailable`:

```json
{
  "error": {
    "code": "ERP_TEMPORARY_FAILURE",
    "message": "The order processor is temporarily unavailable. Try again in a few moments.",
    "traceId": "req-123"
  }
}
```

Internal failure - `500 Internal Server Error`:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "traceId": "req-123"
  }
}
```

---

### 9.5 Get order state

#### `GET /orders/:orderId`

Success response - `200 OK`:

```json
{
  "message": "Order status loaded successfully.",
  "data": {
    "orderId": "order-id",
    "status": "PENDING_ERP",
    "statusMessage": "Seu pedido foi reservado e está esperando confirmação",
    "createdAt": "2026-05-24T12:00:00.000Z",
    "updatedAt": "2026-05-24T12:00:05.000Z"
  }
}
```

---

## 10. Backend Implementation Plan

### Step 1 - Turborepo project setup

Use `pnpm` workspaces with Turborepo. The workspace root owns orchestration. Each package owns its own scripts.

Create the base repository:

```bash
corepack enable
pnpm dlx create-turbo@latest casecellshop-checkout
cd casecellshop-checkout
```

Then normalize the structure to this challenge:

```bash
rm -rf apps/docs
mkdir -p apps/api apps/web packages/shared packages/tsconfig
```

Root `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Root `package.json` scripts:

```json
{
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:integration": "turbo run test:integration",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest"
  },
  "packageManager": "pnpm@latest"
}
```

Root `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Install API dependencies:

```bash
cd apps/api
pnpm init
pnpm add fastify @fastify/cors @fastify/jwt @fastify/swagger @fastify/swagger-ui zod prisma @prisma/client bcryptjs pino nanoid @casecellshop/shared
pnpm add -D typescript tsx jest ts-jest @types/jest @types/node @types/bcryptjs supertest
pnpm exec tsc --init
pnpm exec prisma init
```

Install frontend dependencies:

```bash
cd ../web
pnpm create vite . --template react-ts
pnpm add @casecellshop/shared
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create the shared package:

```bash
cd ../../packages/shared
pnpm init
pnpm add zod
pnpm add -D typescript
pnpm exec tsc --init
```

`packages/shared/package.json` should expose the compiled contract:

```json
{
  "name": "@casecellshop/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo \"No shared unit tests yet\""
  }
}
```

`apps/api/package.json` and `apps/web/package.json` should depend on the shared workspace package:

```json
{
  "dependencies": {
    "@casecellshop/shared": "workspace:*"
  }
}
```

### Step 2 - Fastify app composition

Create an app factory for testing:

```ts
export async function buildApp(dependencies: AppDependencies) {
  const app = Fastify({ logger: true });

  app.setErrorHandler(errorHandler);
  await app.register(corsPlugin);
  await app.register(jwtPlugin);
  await app.register(authRoutes, dependencies.auth);
  await app.register(productRoutes, dependencies.products);
  await app.register(orderRoutes, dependencies.orders);

  return app;
}
```

Do not start the server inside `app.ts`. Start it only in `server.ts`. This allows isolated controller tests with `fastify.inject()`.

### Step 3 - Validation

Use Zod schemas from `@casecellshop/shared` for request validation when the schema represents an external API contract.

Example:

```ts
import { createOrderRequestSchema } from '@casecellshop/shared';

const parsedBody = createOrderRequestSchema.safeParse(request.body);
```

Validation failures should be converted to the standard `VALIDATION_ERROR` format. Internal-only validation that is not part of the HTTP contract can stay inside the API package.

### Step 4 - Auth

Use seeded users in PostgreSQL.

For the mini-project:

- hash passwords with bcrypt;
- issue JWT on login;
- require JWT only for `POST /orders`;
- keep `GET /products` public;
- keep `GET /orders/:id` public or token-protected depending on the desired simplicity. For this implementation, public status by `orderId` is acceptable because no sensitive customer data is returned.

### Step 5 - Create order use case

Use case responsibility:

1. Validate idempotency key presence.
2. Normalize and hash request body.
3. Check if the idempotency key already exists for the user.
4. If key exists with same hash, return original order.
5. If key exists with different hash, throw `DUPLICATE_ORDER_CONFLICT`.
6. Start database transaction.
7. Atomically reserve stock.
8. Create order and order items.
9. Store idempotency key linked to order.
10. Call fake ERP gateway or enqueue processing record.
11. Return `CONFIRMED`, `PENDING_ERP`, or explicit failure response.

Recommended transaction shape:

```ts
await db.$transaction(async (tx) => {
  const reservedProduct = await productRepository.reserveStock(tx, productId, quantity);

  if (!reservedProduct) {
    throw new StockInsufficientError(productId, quantity);
  }

  const order = await orderRepository.create(tx, {
    userId,
    status: 'PENDING_ERP',
    items,
    totalCents,
    reservationExpiresAt,
  });

  await idempotencyRepository.create(tx, {
    userId,
    key: idempotencyKey,
    requestHash,
    orderId: order.id,
  });

  return order;
});
```

### Step 6 - Fake ERP gateway

The ERP simulator must be deterministic enough for tests and configurable enough for manual testing.

Suggested behavior:

- product/order total ending with a specific value can trigger failure;
- query flag or environment variable can force delay;
- random failure can be disabled during tests.

Example outcomes:

```ts
type ErpProcessResult =
  | { type: 'CONFIRMED'; erpReference: string }
  | { type: 'TEMPORARY_FAILURE'; reason: string }
  | { type: 'TIMEOUT' };
```

### Step 7 - Worker for pending orders

For the mini-project, implement a local worker started with the API process:

```ts
setInterval(() => processPendingOrders(), 5000);
```

Worker responsibilities:

- fetch orders with `PENDING_ERP` or `FAILED_TEMPORARY` and non-expired reservation;
- call fake ERP gateway;
- if confirmed, set order as `CONFIRMED` and consume reserved stock;
- if temporary failure, keep or update `FAILED_TEMPORARY`;
- if reservation expired, set order as `EXPIRED` and release reserved stock.

This can later be replaced by BullMQ, SQS, RabbitMQ, or Kafka without changing controllers.

### Step 8 - Logging

Use Fastify/Pino structured logs.

Each log must include:

- `traceId` or `requestId`;
- `userId`, when authenticated;
- `orderId`, when available;
- `idempotencyKey`, when creating an order;
- checkout step name;
- result status.

Example process logs:

```json
{"level":"info","traceId":"req-1","step":"order.create.received","userId":"user-1"}
{"level":"info","traceId":"req-1","step":"stock.reserve.success","orderId":"order-1"}
{"level":"warn","traceId":"req-1","step":"erp.process.timeout","orderId":"order-1"}
{"level":"info","traceId":"req-1","step":"order.status.updated","status":"PENDING_ERP"}
```

### Step 9 - Error handling

Create a base `AppError`:

```ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
```

All known errors become explicit responses. Unknown errors become `INTERNAL_ERROR`.

---

## 11. Frontend Implementation Plan

### Stack

- React + TypeScript.
- Vite.
- React Testing Library.
- Vitest or Jest for unit tests. If the repository standardizes on Jest, use Jest with `jest-environment-jsdom`.
- **Tailwind CSS v3** for styling. Design tokens (colors, spacing, border radius) live in `tailwind.config.ts` under `theme.extend`. No separate CSS variable file. No heavy UI component libraries.

### Frontend folder convention

| Folder | Contents |
|---|---|
| `routes/` | Page-level React components registered with the router. |
| `features/<name>/components/` | Feature-scoped UI components used only by that feature. |
| `features/<name>/hooks/` | Feature-scoped React hooks containing data-fetching and state logic. |
| `components/ui/` | Primitive common components reused across features (Button, Badge, Input, Card, Spinner). |
| `hooks/` | Generic cross-feature hooks (useAsync). |
| `services/` | All API communication: HTTP client, per-resource service modules, and error mapper. |
| `utils/` | Pure cross-feature utilities (idempotency key generation, formatters). |

### Screens

| Screen | Route | Purpose |
|---|---|---|
| Login | `/login` | Obtain token for order creation. |
| Products | `/products` or `/` | List products and available stock. |
| Checkout Panel | same product page or `/checkout/:productId` | Select quantity and create order. |
| Order Status | `/orders/:orderId` | Show current order state. |

### Frontend flow

```mermaid
flowchart TD
  A[Open product list] --> B[Load products]
  B --> C{Products loaded?}
  C -- No --> D[Show retryable error]
  C -- Yes --> E[User selects product and quantity]
  E --> F{Is user logged in?}
  F -- No --> G[Redirect to login or show login modal]
  F -- Yes --> H[Generate Idempotency-Key]
  H --> I[Disable checkout button and show loading]
  I --> J[POST /orders]
  J --> K{Response type}
  K -- 201 --> L[Show success and link to status]
  K -- 202 --> M[Show processing state and link to status]
  K -- 400/422/409 --> N[Show clear recoverable message]
  K -- 503/500 --> O[Show retry option without freezing UI]
```

### Error handling rules

| API result | UI behavior |
|---|---|
| `VALIDATION_ERROR` | Highlight invalid quantity and show field-level message. |
| `AUTH_REQUIRED` | Redirect to login or show login panel. |
| `STOCK_INSUFFICIENT` | Show stock message and refresh product data. |
| `DUPLICATE_ORDER_CONFLICT` | Generate a new idempotency key only if the user intentionally starts a new checkout. |
| repeated same idempotency key success | Show existing order, do not create a new one. |
| `ERP_TEMPORARY_FAILURE` | Show retry/status message; keep the screen usable. |
| `INTERNAL_ERROR` | Show generic failure and allow retry. |

### Frontend shared-contract usage

The frontend API client should return typed responses from `@casecellshop/shared`. Avoid redefining API result shapes inside React components.

```ts
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  CreateOrderRequest,
  CreateOrderResponse,
} from '@casecellshop/shared';

export async function createOrder(
  payload: CreateOrderRequest,
  idempotencyKey: string,
): Promise<ApiSuccessResponse<CreateOrderResponse>> {
  // call POST /orders and normalize errors into ApiErrorResponse
}
```

The UI-specific mapper can translate shared error codes to user messages, but the source codes must come from `@casecellshop/shared`.

### Frontend state design

Use explicit request states instead of booleans scattered across components.

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; message: string }
  | { status: 'error'; errorCode: string; message: string; details?: unknown };
```

This prevents the screen from freezing after failures because every request path returns to a defined state.

---

## 12. Visual Style Guide

The challenge does not require a sophisticated layout, but the UI should not look like a generic AI-generated interface.

Recommended style direction: **small modern retail admin/storefront**, clean, restrained, with product cards and status badges.

Styling is implemented with **Tailwind CSS**. Design tokens are declared in `tailwind.config.ts` under `theme.extend.colors` and `theme.extend.fontFamily`. Components apply utility classes directly — no separate token file.

### Color tokens (in `tailwind.config.ts`)

| Token name | Hex | Usage |
|---|---:|---|
| `background` | `#F8FAFC` | App background. |
| `surface` | `#FFFFFF` | Cards and panels. |
| `primary` | `#0F766E` | Main action buttons. |
| `primary-dark` | `#115E59` | Button hover. |
| `accent` | `#F59E0B` | Processing/warning states. |
| `danger` | `#DC2626` | Errors. |
| `success` | `#16A34A` | Confirmed order status. |
| `text-base` | `#0F172A` | Main text. |
| `muted` | `#64748B` | Secondary text. |
| `border-base` | `#CBD5E1` | Borders. |

Example usage in components:
```tsx
<button className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2">
  Create Order
</button>
```

### Layout rules

- Max content width: `max-w-[1120px]`.
- Product grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Buttons: solid primary for checkout (`bg-primary`), outline secondary for status/retry (`border border-primary text-primary`).
- Status badges: small pill labels using Tailwind `inline-flex`, `rounded-full`, `px-2 py-0.5`, `text-xs` with semantic background colors.
- Avoid neon gradients, oversized hero sections, and generic chatbot-like layouts.

---

## 13. Testing Strategy

### API unit tests

Use Jest with mocks.

#### Controller tests

- Use `fastify.inject()`.
- Mock use cases.
- Assert HTTP status and response body.
- No database.
- No real ERP gateway.

Examples:

- `POST /orders` returns `401` without token.
- `POST /orders` returns `400` without `Idempotency-Key`.
- `POST /orders` maps `StockInsufficientError` to `422`.
- `POST /orders` maps duplicate key conflict to `409`.

#### Use case tests

- Mock product repository.
- Mock order repository.
- Mock idempotency repository.
- Mock ERP gateway.
- Assert business rules.

Examples:

- same idempotency key and same request hash returns existing order;
- same idempotency key and different hash throws conflict;
- insufficient stock throws `StockInsufficientError`;
- ERP timeout returns pending state;
- successful ERP confirmation updates order status.

### API integration tests

Use PostgreSQL test database through Docker.

Examples:

- product listing reads seeded products;
- order creation persists order and item;
- stock is reduced/reserved after order creation;
- order status endpoint returns current state.

### API concurrency test

Test the main race condition:

1. Seed one product with `available_stock = 1`.
2. Start two concurrent `POST /orders` requests for quantity `1`.
3. Assert exactly one request succeeds.
4. Assert exactly one request returns `STOCK_INSUFFICIENT`.
5. Assert final available stock is `0`.

### Shared package tests and contract checks

The shared package should be validated even if it contains mostly types. Useful checks:

- `tsc --noEmit` to ensure exported types compile;
- schema tests for request DTOs such as invalid quantity, empty items, and invalid UUID;
- error code mapping tests to ensure every backend error has a frontend message;
- a dependency check confirming `packages/shared` does not import from `apps/api` or `apps/web`.

### Frontend unit tests

Test handlers/classes independently:

- API error mapper converts backend errors to user-facing messages;
- idempotency key generator returns one stable key per checkout attempt;
- order status mapper returns correct badge label;
- quantity handler blocks negative/zero values.

### Frontend snapshot tests

Use React Testing Library and snapshots for:

- product card with available stock;
- product card with zero stock;
- checkout button loading state;
- success feedback;
- insufficient stock feedback;
- processing status feedback;
- temporary failure feedback.

### Not required now

- End-to-end tests.
- Browser automation.
- Real ERP contract tests.

Document these as next steps.

---

## 14. Docker and Local Installation

### Docker Compose services

The Docker build context should be the repository root, not only `apps/api` or `apps/web`, because both applications need access to `packages/shared` during install/build.

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: casecellshop
      POSTGRES_PASSWORD: casecellshop
      POSTGRES_DB: casecellshop
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://casecellshop:casecellshop@postgres:5432/casecellshop
      JWT_SECRET: local-dev-secret
      PORT: 3333
    ports:
      - "3333:3333"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    depends_on:
      - api
    environment:
      VITE_API_URL: http://localhost:3333
    ports:
      - "5173:5173"

volumes:
  postgres_data:
```

API Dockerfile should install from the root workspace and build dependencies first:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=@casecellshop/shared --filter=api

FROM base AS runner
COPY --from=build /app /app
WORKDIR /app/apps/api
CMD ["pnpm", "start"]
```

Frontend Dockerfile follows the same root-context rule:

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=@casecellshop/shared --filter=web

FROM base AS runner
COPY --from=build /app /app
WORKDIR /app/apps/web
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
```

### Run locally with Docker

```bash
git clone <repo-url>
cd casecellshop-checkout
corepack enable
pnpm install
docker compose up --build
```

### Run migrations and seed

Depending on how Docker startup is configured, run manually:

```bash
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
```

Seed credentials:

```text
email: demo@casecellshop.local
password: demo123
```

### Development mode without Docker for apps

```bash
# terminal 1: database only
docker compose up -d postgres

# terminal 2: all workspace dev tasks
pnpm dev

# or run only one app
pnpm --filter api dev
pnpm --filter web dev
```

PostgreSQL can still run through Docker:

```bash
docker compose up -d postgres
```

### Tests

```bash
# All package tests through Turborepo
pnpm test

# Typecheck API, web, and shared contracts
pnpm typecheck

# API only
pnpm --filter api test
pnpm --filter api test:integration

# Web only
pnpm --filter web test

# Shared package only
pnpm --filter @casecellshop/shared typecheck
```

---

## 15. Implementation Phases

### Phase 1 - Foundation

- Create Turborepo monorepo structure with `apps/api`, `apps/web`, and `packages/shared`.
- Configure `pnpm-workspace.yaml`, root `package.json`, and `turbo.json`.
- Add Docker Compose with PostgreSQL.
- Configure shared TypeScript base config package.
- Configure Fastify app factory.
- Configure Prisma schema.
- Add seed script.
- Add React/Vite app.

### Phase 2 - Products

- Create product DTOs and product schemas in `packages/shared`.
- Create products table and seed data.
- Implement `GET /products`.
- Implement `GET /products/:productId`.
- Build product grid in frontend.
- Add product loading/error states.

### Phase 3 - Auth

- Create auth DTOs and login schema in `packages/shared`.
- Create users table.
- Seed demo user.
- Implement `POST /auth/login`.
- Store JWT in frontend memory or local storage for the challenge.
- Protect `POST /orders`.

### Phase 4 - Orders and stock consistency

- Create order DTOs, order status union, and order error codes in `packages/shared`.
- Create orders, order items, and idempotency tables.
- Implement atomic stock reservation.
- Implement `POST /orders`.
- Implement idempotency behavior.
- Implement `GET /orders/:orderId`.
- Add concurrency test.

### Phase 5 - ERP simulation and order state

- Add fake ERP gateway.
- Add pending order processing behavior.
- Add temporary failure simulation.
- Add status badges and status page.
- Ensure failures do not freeze UI.

### Phase 6 - Logging, docs, and final validation

- Add structured logs.
- Add README with installation, decisions, limitations, and next steps.
- Add PROMPTS.md.
- Add tests and run full Turborepo test/typecheck suite.
- Confirm shared package exports compile and are consumed by both apps.
- Confirm acceptance checklist.

---

## 16. Monorepo Build and Test Flow

```mermaid
flowchart TD
  A[Developer changes shared DTO/schema] --> B[pnpm turbo run typecheck]
  B --> C[Build packages/shared]
  C --> D[Typecheck apps/api]
  C --> E[Typecheck apps/web]
  D --> F[API unit/integration tests]
  E --> G[Frontend unit/snapshot tests]
  F --> H[Safe contract change]
  G --> H
```

---

## 16. User Action Diagram

```mermaid
flowchart TD
  Start([User opens app]) --> Products[View product list]
  Products --> Select[Select phone case]
  Select --> Qty[Choose quantity]
  Qty --> Login{Logged in?}
  Login -- No --> LoginPage[Login]
  LoginPage --> Qty
  Login -- Yes --> Submit[Click create order]
  Submit --> Loading[Button disabled and loading shown]
  Loading --> Result{API response}
  Result -- Success --> Success[Show confirmed order]
  Result -- Processing --> Processing[Show processing message]
  Result -- Validation error --> FixInput[Show field message]
  Result -- Stock missing --> Refresh[Show stock error and reload products]
  Result -- Duplicate --> Existing[Show existing order or conflict message]
  Result -- Temporary failure --> Retry[Show retry/status action]
  Processing --> Status[Check order status]
  Success --> Status
  Retry --> Status
```

---

## 17. Checkout Flowchart

```mermaid
flowchart TD
  A[POST /orders] --> B{Authenticated?}
  B -- No --> B1[401 AUTH_REQUIRED]
  B -- Yes --> C{Idempotency-Key present?}
  C -- No --> C1[400 IDEMPOTENCY_KEY_REQUIRED]
  C -- Yes --> D[Hash normalized request]
  D --> E{Existing idempotency key?}
  E -- Same hash --> E1[Return existing order]
  E -- Different hash --> E2[409 DUPLICATE_ORDER_CONFLICT]
  E -- No --> F[Start DB transaction]
  F --> G[Atomic stock reservation]
  G -- No stock --> G1[422 STOCK_INSUFFICIENT]
  G -- Reserved --> H[Create order + order items]
  H --> I[Persist idempotency key]
  I --> J[Commit transaction]
  J --> K[Process with ERP simulator]
  K -- Confirmed --> L[201 CONFIRMED]
  K -- Slow --> M[202 PENDING_ERP]
  K -- Temporary failure --> N[503 or status FAILED_TEMPORARY]
```

---

## 18. UML-Style Class Diagram

```mermaid
classDiagram
  class OrdersController {
    +createOrder(request, reply)
    +getOrderStatus(request, reply)
  }

  class CreateOrderUseCase {
    +execute(command) CreateOrderResult
  }

  class GetOrderStatusUseCase {
    +execute(orderId) OrderStatusResult
  }

  class OrderRepositoryPort {
    <<interface>>
    +findById(orderId)
    +createOrder(data)
    +updateStatus(orderId, status)
  }

  class ProductRepositoryPort {
    <<interface>>
    +findMany()
    +findById(productId)
    +reserveStock(productId, quantity)
    +releaseReservedStock(productId, quantity)
    +consumeReservedStock(productId, quantity)
  }

  class IdempotencyRepositoryPort {
    <<interface>>
    +findByUserAndKey(userId, key)
    +create(userId, key, requestHash, orderId)
  }

  class ErpGatewayPort {
    <<interface>>
    +processOrder(order) ErpProcessResult
  }

  class PrismaOrderRepository
  class PrismaProductRepository
  class FakeErpGateway

  OrdersController --> CreateOrderUseCase
  OrdersController --> GetOrderStatusUseCase
  CreateOrderUseCase --> OrderRepositoryPort
  CreateOrderUseCase --> ProductRepositoryPort
  CreateOrderUseCase --> IdempotencyRepositoryPort
  CreateOrderUseCase --> ErpGatewayPort
  GetOrderStatusUseCase --> OrderRepositoryPort
  PrismaOrderRepository ..|> OrderRepositoryPort
  PrismaProductRepository ..|> ProductRepositoryPort
  FakeErpGateway ..|> ErpGatewayPort
```

---

## 19. Backend Error Code Catalog

| HTTP | Code | Meaning | Frontend action |
|---:|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body, params, or query. | Show field/message and keep form editable. |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | Missing idempotency key. | Generate/send key and retry only after code fix. |
| 401 | `AUTH_REQUIRED` | User must login to create order. | Redirect/show login. |
| 401 | `INVALID_CREDENTIALS` | Login failed. | Show credential error. |
| 404 | `PRODUCT_NOT_FOUND` | Product does not exist. | Show not found and return to list. |
| 404 | `ORDER_NOT_FOUND` | Order does not exist. | Show not found state. |
| 409 | `DUPLICATE_ORDER_CONFLICT` | Same key used with different payload. | Ask user to start a new checkout attempt. |
| 422 | `STOCK_INSUFFICIENT` | Not enough stock. | Show stock message and refresh products. |
| 503 | `ERP_TEMPORARY_FAILURE` | Processing unavailable or unstable. | Show retry/status option. |
| 500 | `INTERNAL_ERROR` | Unknown server error. | Show generic error and keep UI usable. |

---

## 20. Acceptance Checklist

### Backend

- [ ] API lists products.
- [ ] API gets product by ID.
- [ ] API logs in a seeded user.
- [ ] API creates order only with authentication.
- [ ] API validates invalid payloads.
- [ ] API returns explicit validation, stock, duplicate, temporary failure, and internal errors.
- [ ] API prevents selling more units than available.
- [ ] API uses idempotency to avoid duplicate orders.
- [ ] API simulates slow or unstable ERP processing.
- [ ] API exposes order status endpoint.
- [ ] API emits structured logs.
- [ ] API imports external DTOs, schemas, and error codes from `@casecellshop/shared`.
- [ ] API has unit tests with mocked dependencies.
- [ ] API has at least one concurrency test.

### Frontend

- [ ] User can view products.
- [ ] User can login.
- [ ] User can choose quantity.
- [ ] User can create order.
- [ ] UI disables checkout button while request is pending.
- [ ] UI shows clear success messages.
- [ ] UI shows clear validation, stock, duplicate, and temporary failure messages.
- [ ] UI remains coherent after error or retry.
- [ ] User can check order status.
- [ ] Frontend imports external DTOs, schemas, and error codes from `@casecellshop/shared`.
- [ ] Handlers/classes have unit tests.
- [ ] Key UI states have snapshot tests.

### Delivery

- [ ] Turborepo runs build, test, lint, and typecheck across API, web, and shared packages.
- [ ] Docker Compose runs PostgreSQL, API, and frontend.
- [ ] README explains setup and decisions.
- [ ] PROMPTS.md records AI usage.
- [ ] Diagrams are included.
- [ ] Limitations and next steps are documented.

---

## 21. Limitations and Next Steps

### Current limitations

- Fake ERP gateway is not a real integration.
- Local worker is not a production-grade queue.
- Auth is intentionally simple.
- Order status lookup may be public by ID for simplicity.
- No real payment or invoicing.

### Next steps for a production evolution

- Replace local worker with a real queue system.
- Add outbox pattern for reliable event publication.
- Add real ERP connector with retry policy and circuit breaker.
- Add observability with metrics and distributed tracing.
- Add rate limiting to checkout endpoint.
- Add refresh tokens and stronger auth.
- Add contract tests generated from OpenAPI.
- Add e2e tests after the mini-project scope is stable.

---

## 22. Suggested README Structure

```text
# CaseCellShop Checkout

## Goal
## Stack
## Monorepo structure with Turborepo
## Shared contracts package
## Architecture
## How to run with Docker
## How to run locally
## Environment variables
## Database migrations and seed
## API endpoints
## Error model
## Stock consistency and concurrency strategy
## Idempotency strategy
## ERP simulation
## Testing
## Diagrams
## Limitations
## Next steps
## AI usage / PROMPTS.md
```

---

## 23. Suggested PROMPTS.md Content

```markdown
# PROMPTS.md

## Prompt 1 - Architecture plan
I asked for an implementation plan for CaseCellShop Part 1.B using Node.js, TypeScript, Fastify, PostgreSQL, React, Docker, Turborepo, shared API/frontend contracts, idempotency, atomic stock validation, explicit errors, and tests.

## Prompt 2 - Concurrency validation
I asked how to prevent two users from buying the last available unit and how to test this with PostgreSQL transactions.

## Prompt 3 - Error contract
I asked for an explicit API error model with HTTP status codes, custom error codes, and frontend reactions.

## Human validation
All generated suggestions were reviewed against the challenge PDF requirements and adjusted to keep the project executable and small enough for evaluation.
```


---

## 24. Monorepo-Specific Notes

### Why Turborepo here

Turborepo is used as the repository orchestrator, not as business architecture. Its role is to run package-level tasks in dependency order and avoid duplicated local workflows.

In this implementation:

- `packages/shared` builds before `apps/api` and `apps/web`;
- API and frontend contract changes are validated in one command;
- CI can run `pnpm turbo run build test typecheck` from the root;
- future packages such as `packages/ui`, `packages/eslint-config`, or `packages/db` can be added without splitting repositories.

### Guardrails

- Keep all cross-system communication types in `packages/shared`.
- Do not import backend infrastructure from the frontend.
- Do not import frontend components from the backend.
- Do not let `packages/shared` import anything from `apps/*`.
- Keep endpoint implementations in the API and UI behavior in the frontend.
- Treat shared contracts as stable public API inside the monorepo.
