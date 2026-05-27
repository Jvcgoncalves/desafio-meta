## ADDED Requirements

### Requirement: Dockerized local runtime
The project SHALL provide Docker Compose services for PostgreSQL, the Fastify API, and the React web app.

#### Scenario: Compose starts required services
- **WHEN** a developer runs the documented Docker Compose command
- **THEN** PostgreSQL, API, and web services start with documented ports and environment variables.

### Requirement: Database schema and seed data
The API SHALL provide database migrations and seed data for demo credentials and sample phone case products.

#### Scenario: Seed data is installed
- **WHEN** migrations and seed are run against a local database
- **THEN** the demo user and product catalog are available for manual testing.

### Requirement: Documentation
The project SHALL include documentation for setup, architecture, environment variables, API endpoints, error model, stock consistency, idempotency, ERP simulation, testing, limitations, next steps, and AI usage.

#### Scenario: README guides local evaluation
- **WHEN** an evaluator opens `README.md`
- **THEN** they can find how to run the app with Docker, run migrations and seed, execute tests, and understand major design decisions.

#### Scenario: PROMPTS records AI usage
- **WHEN** an evaluator opens `PROMPTS.md`
- **THEN** they can see a concise record of AI-assisted prompts and human validation.

### Requirement: Backend automated tests
The API SHALL include Vitest unit tests for controllers and use cases, integration tests against PostgreSQL, and at least one concurrency test for atomic stock reservation. API test files SHALL live under `apps/api/tests/` rather than inside production module folders.

#### Scenario: Controller behavior is tested
- **WHEN** backend unit tests run
- **THEN** route behavior for auth, validation, stock, duplicate, and known errors is verified with mocked dependencies.

#### Scenario: Concurrency behavior is tested
- **WHEN** the concurrency test runs with one available product unit and two simultaneous checkout requests
- **THEN** exactly one request succeeds and exactly one request returns `STOCK_INSUFFICIENT`.

### Requirement: Frontend automated tests
The web app SHALL include unit tests for service functions, hooks, and utility functions, and snapshot tests for key UI states. All tests run through `pnpm turbo run test --filter=web`.

#### Scenario: Frontend services and hooks are tested
- **WHEN** frontend unit tests run
- **THEN** `error-mapper.ts` coverage of every `APP_ERROR_CODES` key, `idempotency.utils.ts` key generation and reuse, `StatusBadge` rendering for all `OrderStatus` values, and `QuantitySelector` validation are covered.

#### Scenario: UI snapshots are tested
- **WHEN** frontend snapshot tests run
- **THEN** `ProductCard` (available stock and zero stock), `CheckoutPanel` loading, `FeedbackMessage` confirmed success, insufficient stock feedback, pending processing feedback, and temporary failure feedback are covered.

### Requirement: Structured observability
The API SHALL use structured logs with request trace IDs for checkout and status operations.

#### Scenario: Logs include trace context
- **WHEN** API requests are handled
- **THEN** emitted logs include a request trace ID and relevant contextual fields such as user ID, order ID, idempotency key, step name, and result status when available.
