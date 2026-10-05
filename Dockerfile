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
# turbo prune isolates the api app and its transitive workspace deps,
# producing a minimal repo slice that layers cleanly in Docker cache.
# ---------------------------------------------------------------------------
FROM base AS prune
WORKDIR /app
RUN npm install -g turbo@^2 --silent
COPY . .
RUN turbo prune api --docker

# ---------------------------------------------------------------------------
# Stage 2 – Builder
# Install deps from pruned lockfile, compile TypeScript (ESM via NodeNext),
# then use pnpm deploy to produce a self-contained production directory.
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Install (layer-cached until lockfile / manifests change)
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build
COPY --from=prune /app/out/full/ .
RUN pnpm turbo run build --filter=api

# Self-contained production deployment (only prod node_modules)
RUN pnpm --filter=api --prod deploy /app/standalone

# Overlay compiled ESM output into standalone dir
RUN cp -r /app/apps/api/dist /app/standalone/dist

# ---------------------------------------------------------------------------
# Stage 3 – Runner
# Minimal image: compiled JS + production node_modules only.
# Non-root user for security hardening.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeuser \
 && chown -R nodeuser:nodejs /app

COPY --from=builder --chown=nodeuser:nodejs /app/standalone ./

USER nodeuser
EXPOSE 3000
CMD ["node", "dist/server.js"]

