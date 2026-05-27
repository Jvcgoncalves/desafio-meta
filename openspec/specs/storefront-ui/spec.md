## ADDED Requirements

### Requirement: Styling with Tailwind CSS
The web app SHALL use Tailwind CSS v3 for all visual styling. Design tokens (colors, spacing, border radius) SHALL be declared in `tailwind.config.ts` under `theme.extend` and referenced through Tailwind utility classes in component markup.

#### Scenario: Components use Tailwind utility classes
- **WHEN** a UI component is implemented
- **THEN** all visual styles are applied through Tailwind utility classes with no separate per-component CSS file or inline style objects.

#### Scenario: Design tokens are co-located with Tailwind config
- **WHEN** the color palette is referenced
- **THEN** the canonical values are found in `tailwind.config.ts` under `theme.extend.colors` and not in a separate CSS custom property file.

### Requirement: Primitive common UI components
The web app SHALL provide primitive reusable components (`Button`, `Badge`, `Input`, `Card`, `Spinner`) in `src/components/ui/` styled with Tailwind and consumed across features without duplication.

#### Scenario: Common components are shared
- **WHEN** multiple features require the same visual element (e.g., a button or badge)
- **THEN** both features import it from `src/components/ui/` rather than redefining the element.

### Requirement: Feature-scoped hooks for async state
The web app SHALL place data-fetching and state logic in `hooks/` folders inside each feature (`features/<name>/hooks/`) backed by a shared `useAsync` hook in `src/hooks/`.

#### Scenario: Hooks isolate service calls
- **WHEN** a feature component needs to fetch data or submit a request
- **THEN** it calls a feature hook rather than calling `src/services/` directly from component code.

### Requirement: Services folder for API communication
The web app SHALL place all API communication in `src/services/` with one file per resource (`products.service.ts`, `orders.service.ts`, `auth.service.ts`) and a shared `http-client.ts` and `error-mapper.ts`.

#### Scenario: Components do not import fetch directly
- **WHEN** a hook needs to communicate with the API
- **THEN** it imports from `src/services/` and not from `fetch`, `axios`, or any other HTTP primitive directly.

### Requirement: Product browsing UI
The web app SHALL display products returned by the API in a responsive product grid with product name, model, available stock, price, and quantity controls.

#### Scenario: Products render successfully
- **WHEN** the products API request succeeds
- **THEN** the page displays product cards with stock and price data.

#### Scenario: Product loading fails
- **WHEN** the products API request fails
- **THEN** the page displays a recoverable error state and keeps the screen usable.

### Requirement: Login UI
The web app SHALL allow the demo user to log in and use the returned token for checkout requests.

#### Scenario: Login succeeds
- **WHEN** the user submits valid credentials
- **THEN** the UI stores the access token according to the implementation strategy and returns the user to checkout-capable state.

#### Scenario: Login fails
- **WHEN** the login API returns `INVALID_CREDENTIALS`
- **THEN** the UI shows a credential error without clearing unrelated product state.

### Requirement: Quantity selection
The web app SHALL prevent users from submitting invalid checkout quantities.

#### Scenario: Invalid quantity is blocked
- **WHEN** the user enters zero, a negative quantity, or a non-integer quantity
- **THEN** the UI prevents submission or shows a validation message before checkout.

#### Scenario: Quantity can be changed after failure
- **WHEN** a checkout attempt fails with a recoverable error
- **THEN** the user can adjust the quantity and submit again.

### Requirement: Checkout submission UI
The web app SHALL generate one idempotency key per checkout attempt and send it with authenticated order creation requests.

#### Scenario: Checkout request is submitted
- **WHEN** a logged-in user submits a valid checkout attempt
- **THEN** the UI disables the checkout button during the request and sends `Authorization` and `Idempotency-Key` headers.

#### Scenario: Same attempt is retried
- **WHEN** the same checkout attempt is retried after a network timeout or repeated click
- **THEN** the UI reuses the same idempotency key for that attempt.

#### Scenario: New attempt starts
- **WHEN** the user intentionally changes checkout data after a completed or conflicted attempt
- **THEN** the UI generates a new idempotency key.

### Requirement: Checkout feedback
The web app SHALL show clear feedback for success, processing, validation, authentication, stock, duplicate, temporary failure, and internal error responses.

#### Scenario: Confirmed order feedback
- **WHEN** the order API returns `201 Created` with `CONFIRMED`
- **THEN** the UI shows a success message and a link or action to view order status.

#### Scenario: Pending order feedback
- **WHEN** the order API returns `202 Accepted` with `PENDING_ERP`
- **THEN** the UI shows a processing message and a link or action to view order status.

#### Scenario: Stock error feedback
- **WHEN** the order API returns `STOCK_INSUFFICIENT`
- **THEN** the UI shows a stock-specific message and refreshes or offers to refresh product data.

#### Scenario: Duplicate conflict feedback
- **WHEN** the order API returns `DUPLICATE_ORDER_CONFLICT`
- **THEN** the UI explains that the checkout attempt key was reused with different data and requires a new intentional attempt.

#### Scenario: Temporary failure feedback
- **WHEN** the order API returns `ERP_TEMPORARY_FAILURE` or an order is temporarily failed
- **THEN** the UI shows a retry or status-check action without freezing the page.

### Requirement: Order status UI
The web app SHALL provide an order status view with visual badges for order states.

#### Scenario: Status page renders known status
- **WHEN** an order status response is loaded
- **THEN** the UI displays the status, status message, timestamps, and a status badge.

#### Scenario: Status page handles missing order
- **WHEN** the order status API returns `ORDER_NOT_FOUND`
- **THEN** the UI displays a not-found state without crashing.

### Requirement: Explicit frontend request states
The web app SHALL represent async operations with explicit `idle`, `loading`, `success`, and `error` states using the `useAsync` hook and `AsyncState<T>` discriminated union.

#### Scenario: Failed request remains renderable
- **WHEN** any API request fails
- **THEN** the corresponding component renders an error state using Tailwind-styled error UI and remains interactive where recovery is possible.
