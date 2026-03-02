# ============================================================================
# SmartOps SaaS - Dockerfile
# Multi-stage build for production deployment
# Compatible with: Docker, Docker Compose, Vercel (via container)
# Database: PostgreSQL
# ============================================================================

# Stage 1: Build
FROM node:22-slim AS base

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# ============================================================================
# Stage 2: Production runner
# ============================================================================
FROM node:22-slim AS runner

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@10.4.1

# Copy built files and necessary configurations
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=base /app/server/seed.ts ./server/seed.ts
COPY --from=base /app/tsconfig.json ./tsconfig.json

# Install only production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/trpc/system.health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Start the application
CMD ["pnpm", "run", "start"]
