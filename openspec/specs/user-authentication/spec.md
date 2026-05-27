## ADDED Requirements

### Requirement: Seeded user login
The system SHALL allow a seeded demo user to authenticate with email and password and receive a JWT access token.

#### Scenario: Login succeeds
- **WHEN** a client submits valid seeded credentials to `POST /auth/login`
- **THEN** the API responds with `200 OK`, message `Login completed successfully.`, an `accessToken`, and the authenticated user's `id` and `email`.

#### Scenario: Login fails
- **WHEN** a client submits an invalid email or password to `POST /auth/login`
- **THEN** the API responds with `401 Unauthorized` and error code `INVALID_CREDENTIALS`.

### Requirement: Checkout authentication guard
The system SHALL require a valid JWT bearer token for order creation.

#### Scenario: Order creation without token is rejected
- **WHEN** a client requests `POST /orders` without a valid bearer token
- **THEN** the API responds with `401 Unauthorized` and error code `AUTH_REQUIRED`.

#### Scenario: Order creation with token reaches checkout validation
- **WHEN** a client requests `POST /orders` with a valid bearer token
- **THEN** the request is authorized and evaluated by the checkout order rules.

### Requirement: Password storage
The system SHALL store seeded user passwords as hashes instead of plaintext.

#### Scenario: Seed creates hashed password
- **WHEN** the database seed creates the demo user
- **THEN** the stored password value is a bcrypt hash and not the raw demo password.
