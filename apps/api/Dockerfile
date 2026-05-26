FROM node:22-alpine AS app

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=api

EXPOSE 3000
CMD ["pnpm", "--filter", "api", "dev"]
