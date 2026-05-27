## ADDED Requirements

### Requirement: Create order request validation
The system SHALL validate authenticated order creation requests before reserving stock or creating orders.

#### Scenario: Empty or invalid items are rejected
- **WHEN** a client submits `POST /orders` with an empty `items` array, an invalid `productId`, or a non-positive `quantity`
- **THEN** the API responds with `400 Bad Request` and error code `VALIDATION_ERROR`.

#### Scenario: Missing idempotency key is rejected
- **WHEN** a client submits `POST /orders` without the `Idempotency-Key` header
- **THEN** the API responds with `400 Bad Request` and error code `IDEMPOTENCY_KEY_REQUIRED`.

### Requirement: Idempotent order creation
The system SHALL use the authenticated user ID, `Idempotency-Key`, and normalized request hash to prevent duplicate order creation.

#### Scenario: Same key and same payload returns existing order
- **WHEN** the same authenticated user repeats `POST /orders` with the same `Idempotency-Key` and equivalent request payload
- **THEN** the API returns the original order result without creating a duplicate order or reserving stock again.

#### Scenario: Same key and different payload is rejected
- **WHEN** the same authenticated user repeats `POST /orders` with the same `Idempotency-Key` and a different request payload
- **THEN** the API responds with `409 Conflict` and error code `DUPLICATE_ORDER_CONFLICT`.

### Requirement: Atomic stock reservation
The system SHALL reserve product stock atomically in PostgreSQL inside the order creation transaction.

#### Scenario: Stock is available
- **WHEN** an authenticated order requests a quantity less than or equal to persisted available stock
- **THEN** the API reserves the requested quantity, creates the order, creates order items, and stores the idempotency record.

#### Scenario: Stock is insufficient
- **WHEN** an authenticated order requests a quantity greater than persisted available stock
- **THEN** the API responds with `422 Unprocessable Entity` and error code `STOCK_INSUFFICIENT` without creating an order.

#### Scenario: Concurrent requests cannot oversell
- **WHEN** two concurrent authenticated checkout requests attempt to buy the last available unit of a product
- **THEN** exactly one request reserves stock successfully and the other receives `STOCK_INSUFFICIENT`.

### Requirement: Order totals and items
The system SHALL calculate order totals from persisted product prices at reservation time and persist order item unit prices.

#### Scenario: Order total is calculated
- **WHEN** an order is created for one or more items
- **THEN** the persisted order `totalCents` equals the sum of each reserved item quantity multiplied by its persisted `priceCents`.

### Requirement: ERP processing outcomes
The system SHALL process accepted orders through a fake ERP gateway that can produce confirmed, pending, and temporary failure outcomes.

#### Scenario: ERP confirms immediately
- **WHEN** the fake ERP gateway confirms an accepted order during checkout
- **THEN** the API responds with `201 Created`, status `CONFIRMED`, and the order total and items.

#### Scenario: ERP processing is delayed
- **WHEN** the fake ERP gateway cannot complete processing immediately but the order has been accepted
- **THEN** the API responds with `202 Accepted`, status `PENDING_ERP`, and an order ID that can be checked later.

#### Scenario: Checkout processor unavailable before acceptance
- **WHEN** checkout processing cannot accept the order because the processor is temporarily unavailable
- **THEN** the API responds with `503 Service Unavailable` and error code `ERP_TEMPORARY_FAILURE`.

### Requirement: Order state transitions
The system SHALL support order states `PENDING_ERP`, `CONFIRMED`, `FAILED_TEMPORARY`, `EXPIRED`, `REJECTED_STOCK`, and `CANCELLED`.

#### Scenario: Pending order is confirmed
- **WHEN** the pending-order worker successfully processes a `PENDING_ERP` order
- **THEN** the order status becomes `CONFIRMED` and reserved stock is consumed.

#### Scenario: Pending order temporarily fails
- **WHEN** the pending-order worker receives a temporary ERP failure
- **THEN** the order status becomes or remains `FAILED_TEMPORARY` and the reservation remains available for retry until expiration.

#### Scenario: Reservation expires
- **WHEN** a pending or temporarily failed order passes its reservation expiration
- **THEN** the order status becomes `EXPIRED` and reserved stock is released.

### Requirement: Structured checkout logs
The system SHALL emit structured logs for major checkout steps with a request trace ID and relevant order context.

#### Scenario: Checkout logs are emitted
- **WHEN** an order creation request is processed
- **THEN** logs include step names for request receipt, stock reservation result, idempotency handling, ERP processing, and status update when applicable.
