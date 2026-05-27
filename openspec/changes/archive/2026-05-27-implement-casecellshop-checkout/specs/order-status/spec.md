## ADDED Requirements

### Requirement: Order status lookup
The system SHALL expose an order status endpoint that returns the current state of an order by ID.

#### Scenario: Order status is loaded
- **WHEN** a client requests `GET /orders/:orderId` for an existing order
- **THEN** the API responds with `200 OK`, message `Order status loaded successfully.`, the order ID, status, status message, `createdAt`, and `updatedAt`.

#### Scenario: Order is missing
- **WHEN** a client requests `GET /orders/:orderId` for an unknown order
- **THEN** the API responds with `404 Not Found` and error code `ORDER_NOT_FOUND`.

### Requirement: User-facing status messages
The system SHALL map each persisted order status to a clear user-facing status message.

#### Scenario: Pending status message
- **WHEN** an order is in `PENDING_ERP`
- **THEN** the status response explains that the order is reserved and waiting for processing confirmation.

#### Scenario: Confirmed status message
- **WHEN** an order is in `CONFIRMED`
- **THEN** the status response explains that the order was confirmed successfully.

#### Scenario: Failed temporary status message
- **WHEN** an order is in `FAILED_TEMPORARY`
- **THEN** the status response explains that processing is temporarily unavailable and the user can check again later.

#### Scenario: Expired or cancelled status message
- **WHEN** an order is in `EXPIRED` or `CANCELLED`
- **THEN** the status response explains that the reservation is no longer active.

### Requirement: Public status response safety
The system SHALL avoid returning sensitive user data from order status responses.

#### Scenario: Public order status omits private fields
- **WHEN** a client requests order status by ID
- **THEN** the response does not include password data, authentication tokens, or private customer profile fields.
