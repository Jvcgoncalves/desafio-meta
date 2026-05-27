## 1. Turborepo Monorepo Setup

- [x] 1.1 Scaffold the root Turborepo project: create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`, root `package.json` with `turbo`, `typescript`, and `packageManager: pnpm@latest`, and root `turbo.json` with tasks for `build`, `typecheck`, `lint`, `test`, `test:integration`, and `dev`.
- [x] 1.2 Create `packages/tsconfig` with `base.json`, `node.json`, and `react.json` TypeScript base configs and a minimal `package.json` exposing them as `@casecellshop/tsconfig`.
- [x] 1.3 Initialize `packages/shared` with a `package.json` named `@casecellshop/shared`, a `tsconfig.json` extending `@casecellshop/tsconfig/base.json`, and build/typecheck scripts that compile `src/index.ts` to `dist/`.
- [x] 1.4 Initialize `apps/api` with its `package.json` (name `api`) depending on `@casecellshop/shared: workspace:*` and `@casecellshop/tsconfig: workspace:*`.
- [x] 1.5 Initialize `apps/web` with its `package.json` (name `web`) depending on `@casecellshop/shared: workspace:*` and `@casecellshop/tsconfig: workspace:*`.
- [x] 1.6 Run `pnpm install` from the root and verify `pnpm turbo run typecheck` resolves without errors on an empty workspace.
- [x] 1.7 Add Docker Compose services for PostgreSQL, API, and web with Dockerfiles that use the monorepo root as build context so `packages/shared` is available during image build.
- [x] 1.8 Add `.gitignore`, environment variable examples, and baseline documentation for monorepo entry commands.

## 2. Shared Communication Package

- [x] 2.1 Create `packages/shared/src/errors/app-error-code.ts` with the `APP_ERROR_CODES` constant object and `AppErrorCode` type covering all backend error codes: `VALIDATION_ERROR`, `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `IDEMPOTENCY_KEY_REQUIRED`, `DUPLICATE_ORDER_CONFLICT`, `STOCK_INSUFFICIENT`, `ERP_TEMPORARY_FAILURE`, and `INTERNAL_ERROR`.
- [x] 2.2 Create `packages/shared/src/api/api-response.ts` with `ApiSuccessResponse<TData>` and `ApiErrorResponse<TDetails>` envelope types that both API and frontend use for typed responses.
- [x] 2.3 Create `packages/shared/src/orders/order-status.ts` with the `ORDER_STATUSES` const array and `OrderStatus` union type covering all valid states.
- [x] 2.4 Create `packages/shared/src/auth/auth.dto.ts` and `auth.schemas.ts` with the login request DTO and Zod login schema.
- [x] 2.5 Create `packages/shared/src/products/product.dto.ts` and `product.schemas.ts` with product list item DTO and product detail DTO.
- [x] 2.6 Create `packages/shared/src/orders/order.dto.ts`, `order.schemas.ts` with `createOrderItemSchema`, `createOrderRequestSchema`, `CreateOrderRequest` type, `CreateOrderResponse` type, and order status response DTO.
- [x] 2.7 Export all public types and schemas from `packages/shared/src/index.ts`.
- [x] 2.8 Build `packages/shared` with `pnpm turbo run build --filter=@casecellshop/shared` and verify `dist/index.js` and `dist/index.d.ts` are generated.
- [x] 2.9 Add a schema validation test for `createOrderRequestSchema` covering invalid quantity, empty items array, and invalid UUID to confirm the shared package is testable independently.
- [x] 2.10 Verify `packages/shared` has no imports from `apps/api` or `apps/web` to prevent circular dependencies.

## 3. API Foundation

- [x] 3.1 Install Fastify API dependencies: `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/swagger`, `@fastify/swagger-ui`, `zod`, `prisma`, `@prisma/client`, `bcryptjs`, `pino`, `nanoid`, and `@casecellshop/shared`.
- [x] 3.2 Configure API `tsconfig.json` extending `@casecellshop/tsconfig/node.json`, Vitest config, scripts, dedicated `tests/` layout, and the source directory layout following the `<module>/controllers`, `<module>/routes`, `<module>/services`, `<module>/models`, `<module>/utils` convention.
- [x] 3.3 Implement `buildApp(dependencies)` in `app.ts` and keep network startup isolated in `server.ts`.
- [x] 3.4 Add common success and error response types by importing `ApiSuccessResponse`, `ApiErrorResponse`, and `AppErrorCode` from `@casecellshop/shared` — do not duplicate these types locally.
- [x] 3.5 Add `common/errors/app-error.ts` with the base `AppError` class and `common/errors/error-handler.ts` with the global Fastify error handler that maps validation and known domain errors to the standard error envelope with `traceId`.
- [x] 3.6 Add Fastify plugins under `common/plugins/`: request-ID, Pino logger, JWT auth guard, and Prisma client.
- [x] 3.7 Add `common/logging/logger.ts` as a Pino factory shared by all modules.
- [x] 3.8 Register route modules for auth, products, and orders through the app factory without embedding business logic in controllers.

## 4. Database and Seed Data

- [x] 4.1 Define Prisma models for users, products, orders, order items, and idempotency keys.
- [x] 4.2 Add constraints for unique user email and unique `(user_id, idempotency_key)`.
- [x] 4.3 Add order status enum or equivalent status validation for `PENDING_ERP`, `CONFIRMED`, `FAILED_TEMPORARY`, `EXPIRED`, `REJECTED_STOCK`, and `CANCELLED` — use the same status values defined in `@casecellshop/shared`.
- [x] 4.4 Create and verify the initial database migration.
- [x] 4.5 Implement seed data for demo user `demo@casecellshop.local` with bcrypt password hash and sample phone case products.
- [x] 4.6 Document migration and seed commands for local and Docker-based use.

## 5. Product Catalog API

- [x] 5.1 Create `modules/products/models/product.repository.ts` with repository methods for list, detail lookup, and persisted stock reads.
- [x] 5.2 Create `modules/products/models/product.types.ts` for internal product types not exported from `@casecellshop/shared`.
- [x] 5.3 Create `modules/products/services/products.service.ts` that wraps the repository and returns `ProductListItemDto` and `ProductDetailDto` from `@casecellshop/shared`.
- [x] 5.4 Create `modules/products/controllers/products.controller.ts` that delegates to the service and writes the standard success envelope.
- [x] 5.5 Create `modules/products/routes/products.routes.ts` that registers `GET /products` and `GET /products/:productId` with public access.
- [x] 5.6 Return `PRODUCT_NOT_FOUND` (using the code from `@casecellshop/shared`) for missing product detail requests.
- [x] 5.7 Add product controller tests that mock the service and assert HTTP status and response body.

## 6. Authentication API

- [x] 6.1 Create `modules/auth/models/auth.repository.ts` with a method to look up a user by email.
- [x] 6.2 Create `modules/auth/models/auth.types.ts` for internal auth/user types.
- [x] 6.3 Create `modules/auth/utils/token.utils.ts` for JWT sign/verify helpers.
- [x] 6.4 Create `modules/auth/services/auth.service.ts` that verifies passwords with bcrypt and issues JWTs using token utils.
- [x] 6.5 Create `modules/auth/controllers/auth.controller.ts` that calls the service and returns the standard success envelope using `loginRequestSchema` from `@casecellshop/shared`.
- [x] 6.6 Create `modules/auth/routes/auth.routes.ts` that registers `POST /auth/login`.
- [x] 6.7 Return `INVALID_CREDENTIALS` (code from `@casecellshop/shared`) for failed login attempts.
- [x] 6.8 Implement auth guard behavior via `common/plugins/auth.plugin.ts` that returns `AUTH_REQUIRED` for unauthenticated `POST /orders` requests.
- [x] 6.9 Add auth controller and service tests for success, invalid credentials, and protected route access.

## 7. Checkout Orders API

- [x] 7.1 Create `modules/orders/models/order.types.ts` with internal order types — import `OrderStatus`, `CreateOrderRequest`, `CreateOrderResponse`, and `APP_ERROR_CODES` from `@casecellshop/shared` instead of redeclaring them.
- [x] 7.2 Create `modules/orders/models/order.repository.ts` with methods to create orders/items, find by ID, fetch idempotent order results, and update statuses.
- [x] 7.3 Create `modules/orders/models/idempotency.repository.ts` with methods to find and create idempotency records by authenticated user and key.
- [x] 7.4 Create `modules/orders/utils/request-hash.utils.ts` for deterministic request normalization and hashing used by idempotency comparisons.
- [x] 7.5 Validate create order body using `createOrderRequestSchema` from `@casecellshop/shared` in `modules/orders/routes/orders.routes.ts`; validate the required `Idempotency-Key` header separately in the controller.
- [x] 7.6 Create `modules/products/models/product.repository.ts` stock mutation methods: atomic reservation, release, and consumption inside PostgreSQL transactions.
- [x] 7.7 Create `modules/orders/services/create-order.service.ts` implementing: auth context, idempotency lookup, stock reservation transaction, order/item persistence, idempotency record creation, and ERP dispatch.
- [x] 7.8 Return existing order data when the same user repeats the same idempotency key and equivalent payload.
- [x] 7.9 Return `DUPLICATE_ORDER_CONFLICT` when the same user reuses an idempotency key with different payload data.
- [x] 7.10 Return `STOCK_INSUFFICIENT` without creating an order when atomic reservation returns no row.
- [x] 7.11 Create `modules/erp/services/fake-erp.service.ts` with confirmed, delayed, and temporary failure outcomes controlled by deterministic test flags.
- [x] 7.12 Create `common/worker/pending-orders.worker.ts` with an interval-based processor that confirms, temporarily fails, expires, or releases stock for pending orders.
- [x] 7.13 Create `modules/orders/controllers/orders.controller.ts` that delegates to `create-order.service.ts` and maps results to `201 CONFIRMED`, `202 PENDING_ERP`, or known error responses.
- [x] 7.14 Create `modules/orders/routes/orders.routes.ts` that registers `POST /orders` with the JWT auth guard.
- [x] 7.15 Emit structured checkout logs from the service layer for receipt, idempotency result, stock reservation, ERP processing, and status updates.

## 8. Order Status API

- [x] 8.1 Create `modules/orders/services/get-order-status.service.ts` that looks up an order by ID and returns status, status message, and timestamps without sensitive user data; use `OrderStatus` from `@casecellshop/shared` for the status field type.
- [x] 8.2 Implement status message mapping inside the service for pending, confirmed, failed temporary, expired, cancelled, and rejected stock states.
- [x] 8.3 Create `modules/orders/controllers/order-status.controller.ts` (or extend the existing controller) for `GET /orders/:orderId`.
- [x] 8.4 Register the route in `modules/orders/routes/orders.routes.ts` with message `Order status loaded successfully.`.
- [x] 8.5 Return `ORDER_NOT_FOUND` for unknown order IDs.
- [x] 8.6 Add order status controller and service tests for known statuses and missing orders.

## 9. Backend Integration and Concurrency Tests

- [x] 9.1 Add test database configuration and helpers for migrations, seed reset, and app injection.
- [x] 9.2 Add integration tests for product listing and product detail reads from PostgreSQL.
- [x] 9.3 Add integration tests for login with seeded credentials.
- [x] 9.4 Add integration tests for successful order creation, persisted order items, and stock reservation.
- [x] 9.5 Add idempotency integration tests for same payload replay and different payload conflict.
- [x] 9.6 Add a concurrency test where two simultaneous requests compete for one available product unit and only one succeeds.
- [x] 9.7 Add tests for ERP delayed and temporary failure behavior.
- [x] 9.8 Run `pnpm turbo run test typecheck lint --filter=api` and confirm all pass.

## 10. Web Foundation

- [x] 10.1 Initialize the React and TypeScript Vite app with test tooling and snapshot support.
- [x] 10.2 Configure web scripts, TypeScript config extending `@casecellshop/tsconfig/react.json`, Vite config, and the test environment.
- [x] 10.3 Install and configure **Tailwind CSS v3**: add `tailwindcss`, `postcss`, and `autoprefixer`; create `tailwind.config.ts` with the `theme.extend.colors` map for `background`, `surface`, `primary`, `primary-dark`, `accent`, `danger`, `success`, `text-base`, `muted`, and `border-base`; add `@tailwind` directives to `src/index.css`.
- [x] 10.4 Create `src/services/http-client.ts` with the base fetch wrapper and typed `ApiSuccessResponse`/`ApiErrorResponse` from `@casecellshop/shared`.
- [x] 10.5 Create `src/services/products.service.ts`, `src/services/orders.service.ts`, and `src/services/auth.service.ts` as API communication modules typed with DTOs from `@casecellshop/shared`.
- [x] 10.6 Create `src/services/error-mapper.ts` that translates `APP_ERROR_CODES` from `@casecellshop/shared` into user-facing messages.
- [x] 10.7 Create `src/hooks/useAsync.ts` with the shared `AsyncState<T>` discriminated union type and hook.
- [x] 10.8 Create `src/utils/idempotency.utils.ts` for idempotency key generation and retry-reuse logic.
- [x] 10.9 Create `src/components/ui/Button.tsx`, `Badge.tsx`, `Input.tsx`, `Card.tsx`, and `Spinner.tsx` as primitive common components styled with Tailwind utility classes.

## 11. Web Product, Auth, and Checkout UI

- [x] 11.1 Create `src/features/products/hooks/useProducts.ts` using `useAsync` to load and expose product list state.
- [x] 11.2 Create `src/features/products/components/ProductCard.tsx` and `ProductGrid.tsx` styled with Tailwind, using `ProductListItemDto` from `@casecellshop/shared` as prop types.
- [x] 11.3 Create `src/routes/products.route.tsx` as the product list page that composes `ProductGrid` with loading and recoverable error states.
- [x] 11.4 Create `src/features/checkout/hooks/useIdempotencyKey.ts` that generates one stable key per checkout attempt and reuses it on retry.
- [x] 11.5 Create `src/features/checkout/hooks/useCheckout.ts` that manages checkout async state using `useAsync` and calls `orders.service.ts`.
- [x] 11.6 Create `src/features/checkout/components/QuantitySelector.tsx` that blocks zero, negative, and non-integer quantities.
- [x] 11.7 Create `src/features/checkout/components/CheckoutPanel.tsx` that renders the quantity selector, checkout `Button`, and loading state during submission.
- [x] 11.8 Create `src/features/checkout/components/FeedbackMessage.tsx` that renders recoverable messages for confirmed, pending, validation, auth, stock, duplicate, temporary failure, and internal error states using error codes from `APP_ERROR_CODES`.
- [x] 11.9 Create `src/features/auth/hooks/useAuth.ts` for login state and token storage.
- [x] 11.10 Create `src/features/auth/components/LoginForm.tsx` styled with Tailwind.
- [x] 11.11 Create `src/routes/login.route.tsx` as the login page.
- [x] 11.12 Refresh or offer to refresh product stock after stock-related checkout failures.

## 12. Web Order Status UI

- [x] 12.1 Create `src/features/order-status/hooks/useOrderStatus.ts` using `useAsync` to load order status by ID.
- [x] 12.2 Create `src/features/order-status/components/StatusBadge.tsx` using Tailwind utility classes for `PENDING_ERP`, `CONFIRMED`, `FAILED_TEMPORARY`, `EXPIRED`, `REJECTED_STOCK`, and `CANCELLED` — typed with `OrderStatus` from `@casecellshop/shared`.
- [x] 12.3 Create `src/features/order-status/components/OrderStatusView.tsx` that renders status, status message, timestamps, and the `StatusBadge`.
- [x] 12.4 Create `src/routes/order-status.route.tsx` as the order status page with not-found and generic error states.
- [x] 12.5 Verify failed web requests remain renderable and interactive where recovery is possible.

## 13. Frontend Tests

- [x] 13.1 Add unit tests for `src/services/error-mapper.ts` verifying the mapper covers every key in `APP_ERROR_CODES` from `@casecellshop/shared`.
- [x] 13.2 Add unit tests for `src/utils/idempotency.utils.ts` for key generation and retry-reuse behavior.
- [x] 13.3 Add unit tests for `src/features/order-status/components/StatusBadge.tsx` badge rendering for each `OrderStatus` value from `@casecellshop/shared`.
- [x] 13.4 Add unit tests for `src/features/checkout/components/QuantitySelector.tsx` quantity validation and submit blocking.
- [x] 13.5 Add snapshot tests for `ProductCard` with available stock and zero stock.
- [x] 13.6 Add snapshot tests for `CheckoutPanel` loading, `FeedbackMessage` confirmed success, insufficient stock, pending processing, and temporary failure states.
- [x] 13.7 Run `pnpm turbo run test typecheck lint --filter=web` and confirm all pass.

## 14. Documentation and Final Verification

- [x] 14.1 Write `README.md` with goal, stack, Turborepo monorepo structure, shared contracts package, architecture, setup, Docker, local commands, environment variables, migrations, seed, endpoints, errors, stock strategy, idempotency, ERP simulation, testing, diagrams, limitations, and next steps.
- [x] 14.2 Write `PROMPTS.md` with concise AI usage and human validation notes.
- [x] 14.3 Add architecture, checkout flow, user action, database, and class/port diagrams where appropriate.
- [x] 14.4 Run `pnpm turbo run build test typecheck` from the monorepo root and confirm all packages pass.
- [x] 14.5 Run Docker Compose build/start verification and document any required manual migration or seed step.
- [x] 14.6 Review acceptance checklist against product catalog, authentication, checkout, order status, shared contract consumption, UI resilience, delivery, and documentation specs.
