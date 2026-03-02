# Use Node.js 22 as the base image
FROM node:22-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm

# Copy built files and necessary configurations
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/drizzle.config.ts ./drizzle.config.ts

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]
