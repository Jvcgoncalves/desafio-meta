## ADDED Requirements

### Requirement: Product listing
The system SHALL expose a public product listing endpoint that returns all seeded phone case products with `id`, `name`, `model`, `availableStock`, and `priceCents`.

#### Scenario: Products are loaded
- **WHEN** a client requests `GET /products`
- **THEN** the API responds with `200 OK`, message `Products loaded successfully.`, and an array of product summaries.

#### Scenario: Product list is public
- **WHEN** a client requests `GET /products` without authentication
- **THEN** the API still returns the product list response.

### Requirement: Product detail lookup
The system SHALL expose a public product detail endpoint that returns one product by ID with `id`, `name`, `model`, `availableStock`, and `priceCents`.

#### Scenario: Product is found
- **WHEN** a client requests `GET /products/:productId` for an existing product
- **THEN** the API responds with `200 OK`, message `Product loaded successfully.`, and the product details.

#### Scenario: Product is missing
- **WHEN** a client requests `GET /products/:productId` for an unknown product
- **THEN** the API responds with `404 Not Found` and error code `PRODUCT_NOT_FOUND`.

### Requirement: Product stock source of truth
The system SHALL treat persisted PostgreSQL product stock fields as the source of truth for product availability.

#### Scenario: Product stock changes after reservation
- **WHEN** stock has been reserved by a successful checkout
- **THEN** subsequent product reads reflect the updated `availableStock`.
