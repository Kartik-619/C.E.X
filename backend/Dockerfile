# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# C.E.X backend — production image for Render
# Runs the Bun HTTP + WebSocket server defined in index.ts.
# PostgreSQL is managed by a third-party provider (DATABASE_URL) and is NOT
# part of this image.
# ---------------------------------------------------------------------------

# ---- Stage 1: install production dependencies only ----
FROM oven/bun:1-slim AS deps
WORKDIR /app

# Copy only manifests first so this layer is cached until deps change
COPY package.json bun.lock ./

# Install without devDependencies; lockfile is authoritative
RUN bun install --frozen-lockfile --production

# ---- Stage 2: minimal runtime ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3010

# Reuse the pre-built production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Application source (tests are included because server.ts imports the seeder)
COPY --chown=bun:bun . .

# Drop privileges — never run as root
USER bun

# Render routes external traffic to $PORT; 3010 is the local/dev default
EXPOSE 3010

# Long-running server process (no build step needed — Bun runs TS directly)
CMD ["bun", "run", "index.ts"]
