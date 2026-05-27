## Context

The repository currently has OpenSpec configuration and a detailed Turborepo implementation plan for CaseCellShop Part 1.B, but no application code. The target is a small fullstack checkout project organized as a pnpm Turborepo monorepo with `apps/api`, `apps/web`, `packages/shared`, and `packages/tsconfig` workspace packages.

The implementation must keep the API as the source of truth for stock and order state. The frontend sends checkout intent only; stock validation, duplicate prevention, and status transitions are enforced by the backend and PostgreSQL.

The shared communication contract between API and frontend lives exclusively in `packages/shared`, published internally as `@casecellshop/shared`. This package holds only stable, platform-independent types and schemas: request DTOs, response DTOs, order status types, error codes, Zod validation schemas, and API envelope types. Database models, repositories, Fastify plugins, React components, and service implementations stay inside their own apps.

## Goals / Non-Goals

**Goals:**

- Build a fullstack TypeScript project with a Fastify API, React frontend, PostgreSQL database, and Dockerized local runtime.
- Provide public product browsing and product detail lookup.
- Provide seeded-user login and require authentication for order creation.
- Create orders with explicit validation, idempotency, atomic stock reservation, and deterministic ERP simulation.
- Expose order status so delayed or temporarily failed processing can be observed after checkout.
- Keep UI request states explicit so errors never freeze the screen.
- Include structured logs, setup documentation, backend unit/integration/concurrency tests, frontend unit tests, and snapshot tests.

**Non-Goals:**

- Real payments, invoicing, production authentication, production authorization, cloud deployment, and real ERP integration.
- A full cart, customer profile, catalog management, or admin back office.
- A production-grade distributed worker or message broker.

## Decisions

1. Use Turborepo with pnpm workspaces to orchestrate the monorepo containing `apps/api`, `apps/web`, `packages/shared`, and `packages/tsconfig`.
   - Rationale: Turborepo runs package-level tasks (build, typecheck, lint, test, dev) in dependency order, caches outputs, and ensures `packages/shared` always builds before the apps that consume it. This enforces contract stability and simplifies CI.
   - Alternative considered: A flat monorepo with manual script ordering. Rejected because there is no dependency-aware task graph, making it easy to run apps against stale shared contract builds.

2. Extract all API/frontend communication contracts into `packages/shared` published internally as `@casecellshop/shared`.
   - Rationale: Both `apps/api` and `apps/web` import DTOs, error codes, Zod schemas, and status types from one source. A breaking change in the shared contract propagates to both apps during a single `pnpm turbo run typecheck`, preventing drift between what the API sends and what the frontend expects.
   - Alternative considered: Duplicate types in each app. Rejected because type drift between API responses and frontend expectations is a common source of silent bugs.
   - Contract stability rule: any change to `packages/shared` must pass `pnpm turbo run typecheck` and `pnpm turbo run test` before merging.

3. Use Fastify with an app factory and route modules, with each module following a `controllers/routes/services/models/utils` internal layout.
   - Rationale: `buildApp(dependencies)` supports isolated HTTP tests through `fastify.inject()` and keeps startup concerns in `server.ts`. The sub-folder layout makes responsibility boundaries visible by file path: controllers never contain business logic, services never import Fastify types, repositories live in `models/`, and module-scoped pure helpers live in `utils/`. The `common/` folder holds cross-module API concerns (error handler, plugins, logger, worker) that are not owned by any single module. API tests live in `apps/api/tests` and run with Vitest so production module folders stay focused on implementation code.
   - Alternative considered: Start the server directly from the app module and keep all module files flat. Rejected because flat layout obscures responsibility boundaries as the module grows.

4. Use PostgreSQL and Prisma for persistence, with raw/transactional SQL where atomic stock updates need database guarantees.
   - Rationale: Prisma gives maintainable schema and repository code, while the stock reservation operation must use an atomic conditional update inside a transaction.
   - Alternative considered: Validate stock in application memory before update. Rejected because it cannot prevent overselling under concurrent API instances.

5. Model checkout idempotency as `UNIQUE (user_id, idempotency_key)` plus a normalized request hash.
   - Rationale: This handles browser double-clicks, retries after timeouts, and accidental resubmissions without creating duplicate orders.
   - Alternative considered: Disable the frontend button only. Rejected because UI-only protection does not handle network retries or parallel requests.

6. Keep ERP processing behind an `ErpGatewayPort` and use a fake deterministic implementation.
   - Rationale: The API can demonstrate confirmed, pending, and temporary failure states without depending on an external service.
   - Alternative considered: Random-only ERP failures. Rejected because tests and manual evaluation need predictable triggers.

7. Run a simple pending-order worker inside the API process.
   - Rationale: It is enough for the mini-project and preserves the same domain boundaries that would later support BullMQ, SQS, RabbitMQ, or Kafka.
   - Alternative considered: Add a real queue immediately. Rejected as unnecessary operational complexity for the challenge scope.

8. Standardize API success and error envelopes.
   - Rationale: The frontend can map `message`, `data`, `error.code`, `error.details`, and `traceId` consistently across all states.
   - Alternative considered: Return ad hoc errors per route. Rejected because it weakens testability and UI resilience.

9. Build Docker images from the monorepo root context, not from individual app directories.
   - Rationale: Both `apps/api` and `apps/web` need access to `packages/shared` source and `pnpm-lock.yaml` during install and build. Building from the app subdirectory would exclude the shared package.
   - Alternative considered: Copy shared package into each app directory. Rejected because it creates duplication and breaks the single-source contract guarantee.

10. Use Tailwind CSS v3 for frontend styling with design tokens declared in `tailwind.config.ts`.
    - Rationale: Tailwind provides consistent utility classes without a separate design token file. All color, spacing, and border-radius tokens live in `theme.extend` inside `tailwind.config.ts`, making the design system co-located with the build config and instantly discoverable. Components apply classes directly, keeping styles close to markup without a separate CSS file per component.
    - Alternative considered: Plain CSS variables in a `tokens.css` file. Rejected because it requires maintaining a second source of truth for design decisions and does not give the responsive-utility classes needed for the product grid layout.

11. Use explicit frontend async state objects.
   - Rationale: A discriminated state model (`idle`, `loading`, `success`, `error`) avoids scattered booleans and guarantees every failed request returns to a renderable state.
   - Alternative considered: Component-local `isLoading` and `error` booleans everywhere. Rejected because complex flows become easier to freeze or desynchronize.

12. Use Vitest as the test runner for the API package.
   - Rationale: The monorepo already uses Vitest for shared package tests, and Vitest gives fast ESM-friendly TypeScript tests with less configuration than Jest in this setup.
   - Alternative considered: Jest with `ts-jest`. Rejected because it duplicates test tooling and adds configuration friction for ESM TypeScript modules.

## Risks / Trade-offs

- Atomic stock behavior could be weakened by repository abstractions → Keep the reservation operation as a single database update inside the order transaction and cover it with a concurrency test.
- Idempotency behavior can be ambiguous when payload order or JSON formatting differs → Normalize the request payload before hashing and compare hashes, not raw JSON strings.
- Returning `202 PENDING_ERP` versus `503 ERP_TEMPORARY_FAILURE` can confuse users if not documented → Use `202` when the order is accepted and retryable through status polling; use `503` only when the checkout processor is unavailable before accepting the order.
- Local in-process worker is not horizontally scalable → Keep worker logic behind service boundaries and document replacement with a real queue as a next step.
- Public order status by ID is simple but less private → Return no sensitive customer data and document this as a challenge-only simplification.
- Docker startup can race migrations, seed, and API readiness → Provide explicit migration/seed commands and document the expected local run sequence.
- Shared package changes break both apps simultaneously → This is intentional and desirable; cover shared schema changes with type checks and schema tests before updating apps.
- `packages/shared` must never import from `apps/api` or `apps/web` → Enforce this with a dependency check in tests and document it as a monorepo guardrail.
- Sub-folder module layout increases the number of files per module → This is intentional; more files with narrow responsibilities are easier to test and extend than fewer large files with mixed concerns.

## Migration Plan

1. Bootstrap the Turborepo monorepo with `pnpm-workspace.yaml`, root `package.json`, `turbo.json`, and `packages/tsconfig` base TypeScript configs.
2. Create `packages/shared` with the initial `@casecellshop/shared` package: error codes, order status types, API envelope types, and base Zod schemas.
3. Create `apps/api` and `apps/web` with workspace references to `@casecellshop/shared`; run `pnpm turbo run typecheck` to verify the dependency graph.
4. Add Docker Compose services (PostgreSQL, API, web) with Dockerfiles that build from the monorepo root context.
5. Add API dependencies, TypeScript config, Fastify app factory, plugins, error handling, logging, and route scaffolding importing contracts from `@casecellshop/shared`.
6. Add Prisma schema, migrations, and seed data for demo user and products.
7. Implement product and authentication capabilities first because checkout depends on them.
8. Expand `packages/shared` with order DTOs and order-specific schemas; implement order repositories, idempotency records, atomic stock reservation, fake ERP gateway, and status transitions.
9. Implement React UI flows and API clients importing typed contracts from `@casecellshop/shared`.
10. Add backend unit tests, integration tests, concurrency tests, frontend unit tests, and snapshots.
11. Run `pnpm turbo run build test typecheck` from the root to verify all packages pass together.
12. Run Docker Compose build/start verification and document any required manual migration or seed step.

Rollback is not required for a greenfield challenge project. If a step fails locally, revert only the affected package/module changes and keep the OpenSpec artifacts as the source of truth for reimplementation.

## Open Questions

- Whether `GET /orders/:orderId` should remain public for simplicity or require authentication. The default for this change is public by ID with no sensitive data returned.
- Whether the web app stores JWT in memory or local storage. The default for this change is the simplest viable approach with the security limitation documented.
