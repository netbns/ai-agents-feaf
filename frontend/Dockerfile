# ============================================
# Stage 1: Builder - compile React + Vite application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY tailwind.config.cjs ./
COPY postcss.config.cjs ./

# Install dependencies
RUN npm ci

# Copy source code and HTML entry point
COPY src ./src
COPY index.html ./

# Build with API URL pointing to Nginx reverse proxy path
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# ============================================
# Stage 2: Nginx production server with reverse proxy
# ============================================
FROM nginx:1.25-alpine

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
