# Project Aware v2.0 - Multi-stage Dockerfile
# Optimized for development, staging, and production environments

# ================================
# BASE STAGE - Common dependencies
# ================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# ================================
# DEPENDENCIES STAGE
# ================================
FROM base AS deps

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ================================
# DEVELOPMENT STAGE
# ================================
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# ================================
# BUILD STAGE
# ================================
FROM base AS builder

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# ================================
# PRODUCTION STAGE
# ================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash \
    dumb-init

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy runtime dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p logs
RUN chown nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# ================================
# STAGING STAGE
# ================================
FROM production AS staging

# Switch back to root for additional tooling
USER root

# Install development tools for staging
RUN apk add --no-cache \
    htop \
    nano \
    netcat-openbsd

# Switch back to app user
USER nextjs

# Environment-specific settings
ENV NODE_ENV=staging
