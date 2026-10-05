# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base – Node 22 Alpine with corepack / pnpm
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---------------------------------------------------------------------------
# Stage 1 – Prune
# ---------------------------------------------------------------------------
FROM base AS prune
WORKDIR /app
RUN npm install -g turbo@^2 --silent
COPY . .
RUN turbo prune web --docker

# ---------------------------------------------------------------------------
# Stage 2 – Builder
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=prune /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=web

# ---------------------------------------------------------------------------
# Stage 3 – Runner
# Next.js standalone output is a self-contained Node server.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && chown -R nextjs:nodejs /app

# standalone/ mirrors the monorepo directory structure
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public            ./apps/web/public

USER nextjs
EXPOSE 3001
# Next.js standalone entry point (monorepo path inside standalone/)
CMD ["node", "apps/web/server.js"]
