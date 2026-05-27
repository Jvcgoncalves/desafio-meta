# CaseCellShop

CaseCellShop is a pnpm Turborepo workspace for a small checkout flow with a Fastify API, React web app, PostgreSQL, and shared TypeScript contracts.

## Workspace

- `apps/api`: backend API package.
- `apps/web`: frontend package.
- `packages/shared`: API/frontend communication contracts.
- `packages/tsconfig`: shared TypeScript configuration.

## Commands

```bash
pnpm install
pnpm turbo run typecheck
pnpm turbo run build
pnpm turbo run test
pnpm turbo run test:integration
pnpm turbo run dev
```

API tests use Vitest and live in `apps/api/tests/` so production source folders remain focused on implementation code.

## Database

The API uses Prisma with PostgreSQL. Local database commands:

```bash
pnpm --filter api prisma:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

For Docker-based local use, start PostgreSQL first and then run migration and seed commands against the exposed database:

```bash
docker compose up -d postgres
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

Seed credentials:

- Email: `demo@casecellshop.local`
- Password: `demo123`

## Docker

```bash
docker compose up --build
```

Docker images are built from the monorepo root so `apps/*` packages can access `packages/shared` during install and build.
