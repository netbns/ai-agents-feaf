# FEAF-Aligned AI Agents - Backend

A production-ready NestJS backend for the FEAF-aligned AI Agents platform, featuring multi-reference model support (PRM, BRM, DRM, ARM, IRM, SRM), Dapr integration, and JWT authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

✅ **Multi-Reference Model Architecture**
- Support for all 6 FEAF models (PRM, BRM, DRM, ARM, IRM, SRM)
- Flexible component types per model
- Cross-board linking with semantic validation

✅ **Core Entities**
- **Boards**: Canvas for each FEAF reference model
- **Components**: Flexible entities with type validation per board
- **Relationships**: 5 types (DEPENDS_ON, COMMUNICATES_WITH, CONTAINS, SUPPORTS, IMPLEMENTS)
- **Cross-Board Links**: Semantic transitions between models
- **Audit Logs**: Complete change tracking

✅ **Authentication & Authorization**
- JWT-based authentication (HS256)
- Bcrypt password hashing
- User isolation (board ownership validation)

✅ **Dapr Integration**
- Service invocation support
- State management (Redis backing)
- gRPC protocol support
- Graceful degradation

✅ **Data Persistence**
- PostgreSQL with Prisma ORM
- Type-safe database queries
- Automatic migrations

✅ **API Documentation**
- Swagger/OpenAPI integration
- Bearer token authentication in docs
- Complete endpoint documentation

✅ **Kubernetes Ready**
- Health check endpoints (liveness/readiness)
- Structured logging
- Environment-based configuration
- Docker support with multi-stage builds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+ LTS |
| **Framework** | NestJS 10.2.10 |
| **Language** | TypeScript 5.3.3 |
| **Database** | PostgreSQL 16 + Prisma 5.7.0 |
| **Authentication** | JWT + Passport.js |
| **Service Mesh** | Dapr 1.11.2 |
| **API Docs** | Swagger 7.1.10 |
| **Validation** | class-validator + class-transformer |
| **Configuration** | @nestjs/config + Joi 17.11.0 |
| **Health Checks** | @nestjs/terminus |
| **Password Security** | bcrypt 5.1.1 |
| **Container** | Docker + docker-compose |

## Project Structure

```
backend/
├── src/
│   ├── domain/                          # Domain-driven structure
│   │   ├── auth/                        # JWT & Passport strategy
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── boards/                      # Board CRUD
│   │   │   ├── dto/
│   │   │   ├── boards.controller.ts
│   │   │   ├── boards.service.ts
│   │   │   └── boards.module.ts
│   │   ├── components/                  # Component management
│   │   │   ├── dto/
│   │   │   ├── components.controller.ts
│   │   │   ├── components.service.ts
│   │   │   └── components.module.ts
│   │   ├── relationships/               # Component relationships
│   │   │   ├── dto/
│   │   │   ├── relationships.controller.ts
│   │   │   ├── relationships.service.ts
│   │   │   └── relationships.module.ts
│   │   ├── cross-board-links/           # Cross-model linking
│   │   │   ├── dto/
│   │   │   ├── cross-board-links.controller.ts
│   │   │   ├── cross-board-links.service.ts
│   │   │   └── cross-board-links.module.ts
│   │   ├── ref-models/                  # FEAF model metadata
│   │   │   ├── ref-models.constants.ts
│   │   │   ├── ref-models.controller.ts
│   │   │   ├── ref-models.service.ts
│   │   │   └── ref-models.module.ts
│   │   ├── dapr/                        # Dapr integration
│   │   │   ├── dapr-client.service.ts
│   │   │   ├── dapr-state.service.ts
│   │   │   └── dapr.module.ts
│   │   ├── health/                      # K8s health checks
│   │   │   ├── health.controller.ts
│   │   │   ├── health.service.ts
│   │   │   └── health.module.ts
│   ├── prisma/                          # Database layer
│   │   └── prisma.service.ts
│   ├── config/                          # Configuration
│   │   ├── config.ts
│   │   └── config.module.ts
│   ├── app.module.ts                    # Root module
│   └── main.ts                          # Bootstrap
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── migrations/                      # Auto-generated migrations
│   └── seed.ts                          # Optional seeding
├── test/                                # Test setup
│   ├── jest-e2e.json
│   └── e2e/
├── .env.example                         # ENV template
├── docker-compose.yml                   # Dev environment
├── docker-compose.prod.yml              # Production environment
├── Dockerfile                           # Multi-stage build
├── nest-cli.json                        # NestJS CLI config
├── tsconfig.json                        # TypeScript config
├── .eslintrc.json                       # ESLint config
├── .prettierrc                          # Prettier config
└── package.json                         # Dependencies
```

## Quick Start

### Prerequisites

- Node.js 20+ or Docker
- PostgreSQL 15+ (or use docker-compose)
- Dapr CLI (for local development)

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# KEY VALUES:
# - DATABASE_URL: postgresql://feaf_user:feaf_password@localhost:5432/feaf_db
# - JWT_SECRET: (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - DAPR_HTTP_PORT: 3500
# - DAPR_GRPC_PORT: 50001
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Optional: Seed database
npm run db:seed
```

### 4. Development

```bash
# Start development server with hot reload
npm run start:dev

# Server runs on http://localhost:3000
# API docs available at http://localhost:3000/api/docs
```

### 5. Docker Development (Recommended)

```bash
# Start entire stack (PostgreSQL, Redis, Dapr, Backend)
docker-compose up

# Backend available at http://localhost:3000
# Database admin at http://localhost:8080
```

## API Documentation

### Interactive API Docs

- **Swagger UI**: http://localhost:3000/api/docs
- **ReDoc**: http://localhost:3000/api/redoc
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

### Authentication

All endpoints (except `/auth/*` and `/health/*`) require JWT token in header:

```bash
Authorization: Bearer <token>
```

### Core Endpoints

#### Authentication
```
POST /auth/register      # Create user account
POST /auth/login         # Get JWT token
```

#### Boards
```
GET    /boards                    # List user's boards
POST   /boards                    # Create board
GET    /boards/:id                # Get board details
PATCH  /boards/:id                # Update board
DELETE /boards/:id                # Delete board
GET    /boards/:id/export         # Export board (JSON/CSV)
```

#### Components
```
GET    /boards/:boardId/components                # List components
POST   /boards/:boardId/components                # Create component
GET    /boards/:boardId/components/:componentId   # Get component
PATCH  /boards/:boardId/components/:componentId   # Update component
DELETE /boards/:boardId/components/:componentId   # Delete component
PATCH  /boards/:boardId/positions                 # Bulk update positions
```

#### Relationships
```
GET    /boards/:boardId/relationships                # List relationships
POST   /boards/:boardId/relationships                # Create relationship
GET    /boards/:boardId/relationships/:relationshipId # Get relationship
PATCH  /boards/:boardId/relationships/:relationshipId # Update relationship
DELETE /boards/:boardId/relationships/:relationshipId # Delete relationship
GET    /boards/:boardId/component/:componentId      # Get component relationships
```

#### Cross-Board Links
```
GET    /cross-board-links                    # List all user's links
POST   /cross-board-links                    # Create link
GET    /cross-board-links/:linkId            # Get link
PATCH  /cross-board-links/:linkId            # Update link
DELETE /cross-board-links/:linkId            # Delete link
GET    /cross-board-links/component/:componentId  # Get component links
GET    /cross-board-links/valid-transitions  # Get allowed model transitions
```

#### Reference Models
```
GET /reference-models           # Get all models with metadata
GET /reference-models/:id       # Get specific model details
```

#### Health
```
GET /health/liveness           # Readiness for K8s liveness probe
GET /health/readiness          # Readiness for K8s readiness probe
```

## Development

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# Integration tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Format check
npm run format:check
```

### Building

```bash
# Development build
npm run build

# Production build (production)
NODE_ENV=production npm run build
```

### Database

```bash
# Create new migration after schema changes
npm run db:migrate:create

# Reset database (dev only)
npm run db:reset

# View database UI
npm run db:studio
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment |
| `APP_PORT` | `3000` | Server port |
| `APP_HOST` | `0.0.0.0` | Server host |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | JWT signing secret (min 32 chars) |
| `JWT_EXPIRATION` | `86400` | Token expiration (seconds) |
| `DAPR_HTTP_PORT` | `3500` | Dapr HTTP port |
| `DAPR_GRPC_PORT` | `50001` | Dapr gRPC port |
| `LOG_LEVEL` | `debug` | Logging level |
| `CORS_ORIGIN` | `*` | CORS allowed origin |

### Dapr Configuration

```yaml
# dapr-config.yaml (if using local Dapr)
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: daprConfig
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "http://localhost:9411/api/v2/spans"
  mtls:
    enabled: true
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t feaf-backend:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  feaf-backend:latest
```

### Docker Compose (Production)

```bash
# Copy and configure environment
cp .env.prod.example .env.prod

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Prerequisites: Dapr installed on cluster

# Create namespace
kubectl create namespace feaf

# Create secrets
kubectl create secret generic feaf-secrets \
  --from-literal=jwt-secret=$(openssl rand -hex 16) \
  -n feaf

# Apply manifests
kubectl apply -f k8s/ -n feaf

# Check status
kubectl get pods -n feaf
```

See [k8s/README.md](../k8s/README.md) for complete Kubernetes setup.

## Monitoring & Troubleshooting

### Health Checks

```bash
# Check liveness
curl http://localhost:3000/health/liveness

# Check readiness
curl http://localhost:3000/health/readiness
```

### Logs

```bash
# View development logs
npm run start:dev

# View docker logs
docker-compose logs -f backend

# Structured logging (production)
# Logs are output as JSON for ELK/CloudWatch parsing
```

### Database Connection Issues

```bash
# Test database connectivity
npm run db:generate

# View Prisma validation errors
npm run db:validate

# Reset database (dev only)
npm run db:reset
```

### Dapr Issues

```bash
# Check Dapr sidecar status
dapr invoke --app-id feaf-backend --method health

# View Dapr logs
docker-compose logs dapr

# Test state management
curl http://localhost:3500/v1.0/state/statestore
```

## Performance Optimization

### Caching

- Components cached in Dapr state (1 hour TTL)
- Relationships cached in Dapr state (1 hour TTL)
- Cross-board links cached in Dapr state (2 hour TTL)

### Database Indexing

- Indexes on board.userId (user isolation)
- Indexes on component.boardId (query optimization)
- Indexes on relationship types (filtering)
- Composite indexes on foreign keys

### Connection Pooling

- Prisma connection pool: 10 connections
- Redis connection pooling via Dapr
- Database connection reuse for performance

## Contributing

1. Follow NestJS best practices
2. Maintain type safety (strict TypeScript)
3. Add tests for new features
4. Format code with Prettier
5. Pass linting before committing

## License

MIT - See LICENSE file for details

## Support

For issues and questions:
- Check [API Documentation](#api-documentation)
- Review [Troubleshooting](#monitoring--troubleshooting)
- Open issue in repository
