# ============================================
# Stage 1: Builder - compile TypeScript + generate Prisma Client
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (including devDependencies for build)
RUN apk add --no-cache openssl && npm ci

# Copy source and prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client from schema
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# ============================================
# Stage 2: Production runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling + openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema + generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Install prisma CLI for running migrations (init container needs this)
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/liveness', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
