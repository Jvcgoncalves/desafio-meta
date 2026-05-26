FROM node:22-alpine AS app

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=web

EXPOSE 5173
CMD ["pnpm", "--filter", "web", "dev"]
