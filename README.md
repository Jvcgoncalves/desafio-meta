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

## Docker

```bash
docker compose up --build
```

Docker images are built from the monorepo root so `apps/*` packages can access `packages/shared` during install and build.
