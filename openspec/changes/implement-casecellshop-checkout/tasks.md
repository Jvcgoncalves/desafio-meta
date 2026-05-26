## 1. Turborepo Monorepo Setup

- [ ] 1.1 Scaffold the root Turborepo project: create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`, root `package.json` with `turbo`, `typescript`, and `packageManager: pnpm@latest`, and root `turbo.json` with tasks for `build`, `typecheck`, `lint`, `test`, `test:integration`, and `dev`.
- [ ] 1.2 Create `packages/tsconfig` with `base.json`, `node.json`, and `react.json` TypeScript base configs and a minimal `package.json` exposing them as `@casecellshop/tsconfig`.
- [ ] 1.3 Initialize `packages/shared` with a `package.json` named `@casecellshop/shared`, a `tsconfig.json` extending `@casecellshop/tsconfig/base.json`, and build/typecheck scripts that compile `src/index.ts` to `dist/`.
- [ ] 1.4 Initialize `apps/api` with its `package.json` (name `api`) depending on `@casecellshop/shared: workspace:*` and `@casecellshop/tsconfig: workspace:*`.
- [ ] 1.5 Initialize `apps/web` with its `package.json` (name `web`) depending on `@casecellshop/shared: workspace:*` and `@casecellshop/tsconfig: workspace:*`.
- [ ] 1.6 Run `pnpm install` from the root and verify `pnpm turbo run typecheck` resolves without errors on an empty workspace.
- [ ] 1.7 Add Docker Compose services for PostgreSQL, API, and web with Dockerfiles that use the monorepo root as build context so `packages/shared` is available during image build.
- [ ] 1.8 Add `.gitignore`, environment variable examples, and baseline documentation for monorepo entry commands.

## 2. Shared Communication Package

- [ ] 2.1 Create `packages/shared/src/errors/app-error-code.ts` with the `APP_ERROR_CODES` constant object and `AppErrorCode` type covering all backend error codes: `VALIDATION_ERROR`, `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `IDEMPOTENCY_KEY_REQUIRED`, `DUPLICATE_ORDER_CONFLICT`, `STOCK_INSUFFICIENT`, `ERP_TEMPORARY_FAILURE`, and `INTERNAL_ERROR`.
- [ ] 2.2 Create `packages/shared/src/api/api-response.ts` with `ApiSuccessResponse<TData>` and `ApiErrorResponse<TDetails>` envelope types that both API and frontend use for typed responses.
- [ ] 2.3 Create `packages/shared/src/orders/order-status.ts` with the `ORDER_STATUSES` const array and `OrderStatus` union type covering all valid states.
- [ ] 2.4 Create `packages/shared/src/auth/auth.dto.ts` and `auth.schemas.ts` with the login request DTO and Zod login schema.
- [ ] 2.5 Create `packages/shared/src/products/product.dto.ts` and `product.schemas.ts` with product list item DTO and product detail DTO.
- [ ] 2.6 Create `packages/shared/src/orders/order.dto.ts`, `order.schemas.ts` with `createOrderItemSchema`, `createOrderRequestSchema`, `CreateOrderRequest` type, `CreateOrderResponse` type, and order status response DTO.
- [ ] 2.7 Export all public types and schemas from `packages/shared/src/index.ts`.
- [ ] 2.8 Build `packages/shared` with `pnpm turbo run build --filter=@casecellshop/shared` and verify `dist/index.js` and `dist/index.d.ts` are generated.
- [ ] 2.9 Add a schema validation test for `createOrderRequestSchema` covering invalid quantity, empty items array, and invalid UUID to confirm the shared package is testable independently.
- [ ] 2.10 Verify `packages/shared` has no imports from `apps/api` or `apps/web` to prevent circular dependencies.

## 3. API Foundation

- [ ] 3.1 Install Fastify API dependencies: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/swagger`, `@fastify/swagger-ui`, `zod`, `prisma`, `@prisma/client`, `bcryptjs`, `pino`, `nanoid`, and `@casecellshop/shared`.
- [ ] 3.2 Configure API `tsconfig.json` extending `@casecellshop/tsconfig/node.json`, Jest config, scripts, and source/test directory layout.
- [ ] 3.3 Implement `buildApp(dependencies)` in `app.ts` and keep network startup isolated in `server.ts`.
- [ ] 3.4 Add common success and error response types by importing `ApiSuccessResponse`, `ApiErrorResponse`, and `AppErrorCode` from `@casecellshop/shared` — do not duplicate these types locally.
- [ ] 3.5 Add a global Fastify error handler that maps validation and known domain errors to the standard error envelope with `traceId`.
- [ ] 3.6 Add request ID, logger, JWT auth, and Prisma Fastify plugins.
- [ ] 3.7 Add route registration modules for auth, products, and orders without embedding business logic in controllers.

## 4. Database and Seed Data

- [ ] 4.1 Define Prisma models for users, products, orders, order items, and idempotency keys.
- [ ] 4.2 Add constraints for unique user email and unique `(user_id, idempotency_key)`.
- [ ] 4.3 Add order status enum or equivalent status validation for `PENDING_ERP`, `CONFIRMED`, `FAILED_TEMPORARY`, `EXPIRED`, `REJECTED_STOCK`, and `CANCELLED` — use the same status values defined in `@casecellshop/shared`.
- [ ] 4.4 Create and verify the initial database migration.
- [ ] 4.5 Implement seed data for demo user `demo@casecellshop.local` with bcrypt password hash and sample phone case products.
- [ ] 4.6 Document migration and seed commands for local and Docker-based use.

## 5. Product Catalog API

- [ ] 5.1 Implement product repository methods for list, detail lookup, and persisted stock reads.
- [ ] 5.2 Use `ProductListItemDto` and `ProductDetailDto` from `@casecellshop/shared` as response DTO types; import `createProductDetailSchema` or equivalent schemas from the shared package for param validation.
- [ ] 5.3 Implement `GET /products` with public access and message `Products loaded successfully.`.
- [ ] 5.4 Implement `GET /products/:productId` with public access and message `Product loaded successfully.`.
- [ ] 5.5 Return `PRODUCT_NOT_FOUND` (using the code from `@casecellshop/shared`) for missing product detail requests.
- [ ] 5.6 Add product controller tests with mocked repository/use case dependencies.

## 6. Authentication API

- [ ] 6.1 Implement auth repository or service lookup for users by email.
- [ ] 6.2 Implement password verification with bcrypt and JWT issuance.
- [ ] 6.3 Implement `POST /auth/login` using `loginRequestSchema` from `@casecellshop/shared` for body validation and `LoginResponseDto` for the typed success response.
- [ ] 6.4 Return `INVALID_CREDENTIALS` (code from `@casecellshop/shared`) for failed login attempts.
- [ ] 6.5 Implement auth guard behavior that returns `AUTH_REQUIRED` for unauthenticated `POST /orders` requests.
- [ ] 6.6 Add auth controller and service tests for success, invalid credentials, and protected route access.

## 7. Checkout Orders API

- [ ] 7.1 Define order domain types, status types, DTOs, and checkout-specific domain errors — import `OrderStatus`, `CreateOrderRequest`, `CreateOrderResponse`, and `APP_ERROR_CODES` from `@casecellshop/shared` instead of redeclaring them locally.
- [ ] 7.2 Validate create order body using `createOrderRequestSchema` from `@casecellshop/shared`; validate the required `Idempotency-Key` header separately in the controller.
- [ ] 7.3 Implement deterministic request normalization and hashing for idempotency comparisons.
- [ ] 7.4 Implement idempotency repository methods to find and create records by authenticated user and key.
- [ ] 7.5 Implement product stock reservation with a single atomic PostgreSQL update inside the order transaction.
- [ ] 7.6 Implement stock release and reserved-stock consumption repository operations.
- [ ] 7.7 Implement order repository methods to create orders/items, find by ID, fetch idempotent order results, and update statuses.
- [ ] 7.8 Implement `CreateOrderUseCase` for auth context, validation, idempotency, stock reservation, order persistence, and result mapping.
- [ ] 7.9 Return existing order data when the same user repeats the same idempotency key and equivalent payload.
- [ ] 7.10 Return `DUPLICATE_ORDER_CONFLICT` when the same user reuses an idempotency key with different payload data.
- [ ] 7.11 Return `STOCK_INSUFFICIENT` without creating an order when atomic reservation returns no row.
- [ ] 7.12 Implement fake ERP gateway outcomes for confirmed, delayed, and temporary failure cases with deterministic test controls.
- [ ] 7.13 Implement in-process pending-order worker for confirmation, temporary failure retry state, expiration, stock consumption, and stock release.
- [ ] 7.14 Implement `POST /orders` route with `201 CONFIRMED`, `202 PENDING_ERP`, and known error responses.
- [ ] 7.15 Emit structured checkout logs for receipt, idempotency result, stock reservation, ERP processing, and status updates.

## 8. Order Status API

- [ ] 8.1 Implement `GetOrderStatusUseCase` that returns status, status message, and timestamps without sensitive user data; use `OrderStatus` from `@casecellshop/shared` for the status field type.
- [ ] 8.2 Implement status message mapping for pending, confirmed, failed temporary, expired, cancelled, and rejected stock states.
- [ ] 8.3 Implement `GET /orders/:orderId` with message `Order status loaded successfully.`.
- [ ] 8.4 Return `ORDER_NOT_FOUND` for unknown order IDs.
- [ ] 8.5 Add order status controller and use case tests for known statuses and missing orders.

## 9. Backend Integration and Concurrency Tests

- [ ] 9.1 Add test database configuration and helpers for migrations, seed reset, and app injection.
- [ ] 9.2 Add integration tests for product listing and product detail reads from PostgreSQL.
- [ ] 9.3 Add integration tests for login with seeded credentials.
- [ ] 9.4 Add integration tests for successful order creation, persisted order items, and stock reservation.
- [ ] 9.5 Add idempotency integration tests for same payload replay and different payload conflict.
- [ ] 9.6 Add a concurrency test where two simultaneous requests compete for one available product unit and only one succeeds.
- [ ] 9.7 Add tests for ERP delayed and temporary failure behavior.
- [ ] 9.8 Run `pnpm turbo run test typecheck lint --filter=api` and confirm all pass.

## 10. Web Foundation

- [ ] 10.1 Initialize the React and TypeScript Vite app with test tooling and snapshot support.
- [ ] 10.2 Configure web scripts, TypeScript config extending `@casecellshop/tsconfig/react.json`, Vite config, and test environment.
- [ ] 10.3 Implement API client helpers for standard success and error envelopes using `ApiSuccessResponse` and `ApiErrorResponse` from `@casecellshop/shared`.
- [ ] 10.4 Implement product, auth, order creation, and order status API client modules typed with DTOs from `@casecellshop/shared`.
- [ ] 10.5 Implement shared async state types for `idle`, `loading`, `success`, and `error`.
- [ ] 10.6 Add CSS variables and layout styles matching the small modern storefront visual direction.

## 11. Web Product, Auth, and Checkout UI

- [ ] 11.1 Implement product list loading, recoverable product loading errors, and responsive product cards.
- [ ] 11.2 Implement quantity selector behavior that blocks zero, negative, and non-integer quantities.
- [ ] 11.3 Implement login form and token handling for checkout requests.
- [ ] 11.4 Implement idempotency key lifecycle with one key per checkout attempt and reuse for retries of the same attempt.
- [ ] 11.5 Implement checkout button loading state and authenticated `POST /orders` submission.
- [ ] 11.6 Implement feedback for confirmed orders with status link or action.
- [ ] 11.7 Implement feedback for pending ERP orders with status link or action.
- [ ] 11.8 Implement recoverable feedback for validation, auth, stock, duplicate, temporary failure, and internal errors using `APP_ERROR_CODES` from `@casecellshop/shared` as the mapping source.
- [ ] 11.9 Refresh or offer to refresh product stock after stock-related checkout failures.

## 12. Web Order Status UI

- [ ] 12.1 Implement order status view or route that loads `GET /orders/:orderId`.
- [ ] 12.2 Implement status badges for `PENDING_ERP`, `CONFIRMED`, `FAILED_TEMPORARY`, `EXPIRED`, `REJECTED_STOCK`, and `CANCELLED` using `OrderStatus` from `@casecellshop/shared` as the type source.
- [ ] 12.3 Implement not-found and generic error states for order status lookup.
- [ ] 12.4 Verify failed web requests remain renderable and interactive where recovery is possible.

## 13. Frontend Tests

- [ ] 13.1 Add unit tests for API error mapping to user-facing messages; verify the mapper covers every key in `APP_ERROR_CODES` from `@casecellshop/shared`.
- [ ] 13.2 Add unit tests for idempotency key generation and retry reuse behavior.
- [ ] 13.3 Add unit tests for order status badge/message mapping using `OrderStatus` values from `@casecellshop/shared`.
- [ ] 13.4 Add unit tests for quantity validation and submit blocking.
- [ ] 13.5 Add snapshot tests for product card with available stock and zero stock.
- [ ] 13.6 Add snapshot tests for checkout loading, confirmed success, insufficient stock, pending processing, and temporary failure states.
- [ ] 13.7 Run `pnpm turbo run test typecheck lint --filter=web` and confirm all pass.

## 14. Documentation and Final Verification

- [ ] 14.1 Write `README.md` with goal, stack, Turborepo monorepo structure, shared contracts package, architecture, setup, Docker, local commands, environment variables, migrations, seed, endpoints, errors, stock strategy, idempotency, ERP simulation, testing, diagrams, limitations, and next steps.
- [ ] 14.2 Write `PROMPTS.md` with concise AI usage and human validation notes.
- [ ] 14.3 Add architecture, checkout flow, user action, database, and class/port diagrams where appropriate.
- [ ] 14.4 Run `pnpm turbo run build test typecheck` from the monorepo root and confirm all packages pass.
- [ ] 14.5 Run Docker Compose build/start verification and document any required manual migration or seed step.
- [ ] 14.6 Review acceptance checklist against product catalog, authentication, checkout, order status, shared contract consumption, UI resilience, delivery, and documentation specs.
