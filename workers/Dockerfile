# Haul Command Workers — Fly.io Dockerfile
# Runs background agents, long-running jobs, and autonomous workers
# Separate from Vercel — this is the compute layer

FROM node:20-alpine AS base
RUN apk add --no-cache tini curl
WORKDIR /app

# ── Dependencies ──
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Build ──
FROM base AS build
COPY package.json package-lock.json tsconfig.json ./
COPY workers/ ./workers/
COPY lib/ ./lib/
COPY core/ ./core/
RUN npm ci --ignore-scripts
RUN npx tsc --project workers/tsconfig.json

# ── Production ──
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/workers/dist ./workers/dist
COPY --from=build /app/lib ./lib
COPY --from=build /app/core ./core
COPY package.json ./

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "workers/dist/index.js"]
