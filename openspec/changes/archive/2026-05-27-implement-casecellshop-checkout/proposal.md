## Why

CaseCellShop needs a small but complete checkout flow that demonstrates product browsing, authenticated order creation, stock safety, duplicate submission protection, recoverable processing failures, and clear user feedback. This change turns the implementation plan into executable OpenSpec guidance so the project can be built and evaluated consistently.

## What Changes

- Add a Turborepo-orchestrated pnpm monorepo with `apps/api`, `apps/web`, `packages/shared`, and `packages/tsconfig` as workspace packages.
- Add a shared communication contract package `packages/shared` published internally as `@casecellshop/shared`, containing request DTOs, response DTOs, order status types, error codes, Zod schemas, and API envelope types consumed by both API and frontend.
- Add a Node.js, TypeScript, and Fastify API for authentication, product reads, order creation, and order status lookup.
- Add PostgreSQL persistence for users, products, orders, order items, and idempotency records.
- Add atomic stock reservation so concurrent checkout attempts cannot oversell the same product.
- Add idempotent order creation with `Idempotency-Key` handling for duplicate attempts and conflict detection.
- Add a fake ERP processing path that can confirm, delay, or temporarily fail orders.
- Add a React and TypeScript frontend for login, product browsing, quantity selection, checkout submission, status display, and resilient error handling.
- Add Docker Compose, setup documentation, structured logging, backend tests, frontend tests, and snapshot coverage for key UI states.
- Configure `turbo.json` to orchestrate build, typecheck, lint, test, and dev tasks in dependency order across all packages.

## Capabilities

### New Capabilities

- `product-catalog`: Public product listing and product detail lookup with stock and price data.
- `user-authentication`: Login with seeded credentials and JWT-based authentication for checkout creation.
- `checkout-orders`: Authenticated order creation with validation, idempotency, atomic stock reservation, and ERP processing outcomes.
- `order-status`: Order status lookup with user-facing status messages for pending, confirmed, failed, expired, and cancelled states.
- `storefront-ui`: React storefront experience for browsing products, selecting quantities, submitting checkout attempts, and recovering from API errors.
- `local-delivery`: Dockerized local runtime, seed data, documentation, structured logs, and automated test coverage required to evaluate the challenge.
- `shared-contracts`: Internal `@casecellshop/shared` workspace package providing stable communication contracts — DTOs, error codes, status types, Zod schemas, and API envelope types — shared between API and frontend without duplication.

### Modified Capabilities

- None.

## Impact

- Creates a Turborepo monorepo under `apps/api`, `apps/web`, `packages/shared`, and `packages/tsconfig` orchestrated by a root `turbo.json` and `pnpm-workspace.yaml`.
- Adds Fastify, Prisma, PostgreSQL, JWT, bcrypt, Zod, Pino, React, Vite, Turborepo, and test tooling.
- Adds HTTP contracts for `/auth/login`, `/products`, `/products/:productId`, `/orders`, and `/orders/:orderId`.
- Adds the `@casecellshop/shared` package so both `apps/api` and `apps/web` import DTOs, error codes, and Zod schemas from a single source.
- Adds database schema, migrations, seed data, Dockerfiles (built from the monorepo root context), `docker-compose.yml`, `README.md`, and `PROMPTS.md`.
- Adds backend unit, integration, and concurrency tests plus frontend unit and snapshot tests.
- Adds contract stability enforcement: any change to `packages/shared` must pass `pnpm turbo run typecheck` and `pnpm turbo run test` across all packages before merging.
