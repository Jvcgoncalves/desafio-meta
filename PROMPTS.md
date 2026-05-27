# AI Usage Notes

This project was implemented with AI assistance using the OpenSpec change `implement-casecellshop-checkout` as the source of truth.

## Prompt Themes

- Scaffold a pnpm Turborepo with `apps/api`, `apps/web`, `packages/shared`, and `packages/tsconfig`.
- Implement shared API/frontend contracts for DTOs, Zod schemas, error codes, API envelopes, and order statuses.
- Build the Fastify API with Prisma persistence, seeded login, product reads, checkout creation, idempotency, stock reservation, fake ERP processing, order status lookup, structured logs, and tests.
- Build the React/Vite/Tailwind storefront with product browsing, login, quantity selection, checkout feedback, order status UI, recoverable errors, and frontend tests.
- Complete final delivery documentation, architecture diagrams, verification commands, and Docker Compose notes.

## Human Validation

- Reviewed OpenSpec proposal, design, specs, and tasks before implementation.
- Kept shared contracts in `packages/shared` and avoided duplicating API response types in apps.
- Verified frontend task completion with `pnpm turbo run test typecheck lint --filter=web`.
- Verified final package graph with root build, test, and typecheck commands.
- Documented the explicit Docker migration and seed step because Compose starts services but does not apply database setup automatically.
