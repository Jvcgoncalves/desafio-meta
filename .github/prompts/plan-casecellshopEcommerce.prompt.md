## Plan: E-commerce Transformation (CaseCellShop)

Transform the React SPA into a proper e-commerce experience: react-router-dom routing, localStorage cart, PT-BR UI, toast notifications on login, enlarged typography, and more seeded products. The API already supports multi-item orders (`items: [{ productId, quantity }][]`), so the cart checkout maps cleanly to existing endpoints.

### Phase 1: Router Migration *(foundational — everything below depends on this)*

1. Add `react-router-dom` + `@types/react-router-dom` to `apps/web/package.json`
2. Wrap app in `<BrowserRouter>` in `apps/web/src/main.tsx`
3. Rewrite `apps/web/src/App.tsx` — replace manual `window.location.pathname` matching with `<Routes>` + `<Route>` for `/`, `/login`, `/pedidos/:orderId`
4. Update `routes/products.route.tsx` — replace `window.location.href = "/login"` with `useNavigate()`
5. Update `routes/order-status.route.tsx` — replace manual regex capture with `useParams()`

### Phase 2: Toast System *(parallel with Phase 1)*

6. Create `apps/web/src/components/ui/Toast.tsx` — fixed bottom-right, auto-dismiss 3s, success/error variants
7. Create `apps/web/src/hooks/useToast.ts` — `ToastContext` + `useToast()` hook (`showToast`, `dismiss`)
8. Add `<ToastProvider>` wrapping children in `App.tsx`

### Phase 3: Post-Login UX *(depends on Phase 1 + 2)*

9. Update `features/auth/components/LoginForm.tsx` — on `auth.login()` success: call `showToast("Login realizado com sucesso!")` + `navigate("/")`. Fix the broken `.finally().catch()` chain while at it.

### Phase 4: Cart Infrastructure *(parallel with Phase 3)*

10. Create `features/cart/types.ts` — `CartItem { productId, name, model, priceCents, availableStock, quantity }`
11. Create `features/cart/hooks/useCart.ts` — localStorage key `casecellshop.cart`; actions: `addItem(product, qty)`, `removeItem(productId)`, `updateQuantity(productId, qty)`, `clearCart()`
12. Create `features/cart/context/CartContext.tsx` — React context wrapping the hook; `CartProvider` added to `App.tsx`

### Phase 5: Cart UI *(depends on Phase 4)*

13. Create `features/cart/components/CartItem.tsx` — item row: name + model, price, quantity stepper (reuse `QuantitySelector`), remove button
14. Create `features/cart/components/CartDrawer.tsx` — slide-in from right, lists items, subtotal, "Fechar Pedido" CTA; closes on ESC/backdrop click
15. Add cart icon button + item count badge to `ProductsRoute` header

### Phase 6: Multi-item Checkout from Cart *(depends on Phase 4 + 5)*

16. Adapt `features/checkout/hooks/useCheckout.ts` — accept `items[]` array; fingerprint = stable JSON sort of all `{ productId, quantity }` pairs for idempotency
17. Wire CartDrawer "Fechar Pedido" → `checkout.submit({ items, token })` → on success: `clearCart()`, navigate to `/pedidos/:orderId`, show toast "Pedido realizado!"
18. Show inline error in CartDrawer on failure (reuse `error-mapper.ts`)

### Phase 7: ProductCard Redesign *(depends on Phase 4)*

19. Remove `<CheckoutPanel>` from `ProductCard.tsx`; replace with quantity selector + "Adicionar ao Carrinho" / "Atualizar carrinho" button (reflects cart state)
20. Delete `CheckoutPanel.tsx` and `FeedbackMessage.tsx` — cart checkout is now the sole purchase path
21. `QuantitySelector.tsx` stays (reused by ProductCard and CartItem)

### Phase 8: Portuguese Translations *(can run in parallel after Phase 5-7 are done)*

22. Sweep all files for user-visible strings:

| English | Português |
|---|---|
| Log in / Log out | Entrar / Sair |
| Checkout | Finalizar Pedido |
| Refresh / Retry | Atualizar / Tentar novamente |
| X in stock / Out | X em estoque / Esgotado |
| Stock is currently unavailable | Estoque indisponível |
| Login failed… | Falha no login… |
| Products could not be loaded | Produtos indisponíveis |
| Cart (empty state) | Carrinho vazio |
| Order status labels | Translated in `StatusBadge.tsx` |

### Phase 9: Typography Scale *(parallel with Phase 8)*

23. Audit every component for `text-sm`; upgrade to `text-base` for all body/label/button text. Keep `text-sm` **only** for: stock badges, timestamps, muted footnotes, helper text under inputs.

### Phase 10: More Seed Products

24. Add 8 more products to `apps/api/prisma/seed.ts` (currently only 3): various models (iPhone 14, Galaxy S24+, A54, Pixel 8/8 Pro, Motorola Edge 50) and case types (Leather Folio, Carbon Fiber, Wallet, Bumper, Rugged, Biodegradable) with varied prices and stock levels.

**Relevant files**

- `apps/web/package.json` — add `react-router-dom` dependency
- `apps/web/src/main.tsx` — `<BrowserRouter>` wrapper
- `apps/web/src/App.tsx` — `<Routes>`, `CartProvider`, `ToastProvider`
- `apps/web/src/routes/products.route.tsx` — cart button, `useNavigate`, PT-BR
- `apps/web/src/routes/login.route.tsx` — PT-BR
- `apps/web/src/routes/order-status.route.tsx` — `useParams()`
- `apps/web/src/features/auth/components/LoginForm.tsx` — post-login toast + navigate, PT-BR
- `apps/web/src/features/products/components/ProductCard.tsx` — add-to-cart UX
- `apps/web/src/features/checkout/hooks/useCheckout.ts` — multi-item input
- `apps/api/prisma/seed.ts` — expanded product list
- **New:** `components/ui/Toast.tsx`, `hooks/useToast.ts`
- **New:** `features/cart/types.ts`, `hooks/useCart.ts`, `context/CartContext.tsx`, `components/CartDrawer.tsx`, `components/CartItem.tsx`

**Verification**

1. `pnpm install` succeeds after adding react-router-dom
2. `/login` renders form; success → toast + redirect to `/`
3. `/` renders product grid; cart icon shows item count
4. Adding to cart persists in localStorage after page reload
5. CartDrawer opens; "Fechar Pedido" calls the API and redirects to `/pedidos/:id`
6. `/pedidos/:orderId` renders order status correctly (via `useParams`)
7. All visible text is in Portuguese
8. No `text-sm` on body/label text; only on permitted detail elements
9. `pnpm typecheck` in `apps/web` passes with no errors
10. Re-seeding the DB gives ≥11 products

**Decisions**

- Cart stored in localStorage — no backend state needed, simpler implementation
- Cart as a **drawer overlay** (not a new route) — keeps the product browsing context visible
- **Remove** per-product `CheckoutPanel` entirely — cart is the only purchase path
- Currency formatted as **BRL (R$)** to match PT-BR UI; existing `priceCents` values stay as-is (api-side reseeding not needed for prices)
- Internal route names stay `/orders/:id` (API contract); UI labels use "pedidos"