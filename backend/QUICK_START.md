# Backend - Getting Started (5 Minutes)

## Option 1: Docker (Recommended for Quick Start)

### 1. Verify Docker Installation
```bash
docker --version      # Should be 24.0+
docker-compose --version  # Should be 2.20+
```

### 2. Start Everything
```bash
cd backend
docker-compose up
```

### 3. Verify Services
```bash
# In another terminal:
curl http://localhost:3000/health/liveness
# Returns: {"status":"ok"}

# Access Swagger UI
open http://localhost:3000/api/docs
```

### 4. Test Authentication
```bash
# Register (in Swagger UI or via curl)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Response: {"access_token": "eyJhbGc..."}
```

### 5. Create First Board
```bash
# Copy the token from previous response
TOKEN="eyJhbGc..."

curl -X POST http://localhost:3000/boards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Board",
    "description": "Testing the API",
    "referenceModel": "PRM"
  }'
```

**✅ Done! Backend is running with full stack.**

---

## Option 2: Local Development (Manual Setup)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ running locally
- Dapr CLI installed

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
```bash
# Create PostgreSQL database
createdb feaf_db -U postgres

# Update .env
cp .env.example .env

# Edit .env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/feaf_db
# JWT_SECRET=your-super-secret-key-min-32-chars
```

### 3. Initialize Database
```bash
npm run db:generate
npm run db:migrate:dev
```

### 4. Start Backend
```bash
npm run start:dev
```

### 5. Access API
```bash
# Health check
curl http://localhost:3000/health/liveness

# Swagger UI
open http://localhost:3000/api/docs
```

---

## Option 3: Production Build

### 1. Build Docker Image
```bash
docker build -t feaf-backend:1.0.0 .
```

### 2. Run Container
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e JWT_SECRET="your-secret" \
  --name feaf-backend \
  feaf-backend:1.0.0
```

### 3. Verify
```bash
curl http://localhost:3000/health/readiness
```

---

## File Structure at a Glance

```
backend/
├── src/domain/          # All business logic by feature
├── prisma/              # Database schema
├── .env.example         # Configuration template
├── docker-compose.yml   # Full dev stack
├── package.json         # Dependencies
└── README.md            # Full documentation
```

---

## Common Commands

```bash
# Development
npm run start:dev        # Start with hot reload
npm run build            # Build for production
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate:dev   # Create/run migrations
npm run db:reset         # Drop & recreate (DEV ONLY)
npm run db:studio        # Open Prisma Studio UI

# Linting & Formatting
npm run lint             # Check code
npm run format           # Auto-format
npm run format:check     # Check formatting
```

---

## Troubleshooting

### Port Already in Use
```bash
# If port 3000 is taken:
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify PostgreSQL running:
psql -U postgres -c "SELECT 1"

# Check connection string in .env
```

### Dapr Issues
```bash
# Start Dapr separately:
dapr run --app-id feaf-backend --app-port 3000

# Or disable Dapr (services will log warning but work):
DAPR_HTTP_PORT=0 npm run start:dev
```

### Docker Compose Failure
```bash
# Clean up and restart:
docker-compose down -v
docker-compose up --build
```

---

## Next: Test an Endpoint

### Via Swagger UI (Easiest)
1. Open http://localhost:3000/api/docs
2. Click "Authorize" button (top right)
3. Click "Try it out" on any endpoint
4. Click "Execute"

### Via cURL (Try yourself)
```bash
# 1. Register a user
REGISTER=$(curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@test.com",
    "password": "DemoPass123!",
    "name": "Demo User"
  }')

# 2. Extract token
TOKEN=$(echo $REGISTER | jq -r '.access_token')

# 3. Create a board
curl -X POST http://localhost:3000/boards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Board",
    "referenceModel": "PRM"
  }'

# 4. List boards
curl http://localhost:3000/boards \
  -H "Authorization: Bearer $TOKEN"
```

---

## Architecture Overview

```
┌─────────────────────┐
│     React App       │ (Frontend - To be created)
└──────────┬──────────┘
           │ REST API
┌──────────▼──────────┐
│   NestJS Backend    │ ← You are here
│  (41 endpoints)     │
└──────────┬──────────┘
      ┌────┴─────┐
      │           │
┌─────▼─┐   ┌────▼──────┐
│  PostgreSQL │   Dapr    │
│ Database    │ State Mgmt │
└─────────────┴───────────┘
```

---

## API Quick Reference

### Authentication (No token needed)
```
POST /auth/register    # Create account
POST /auth/login       # Get token
```

### Boards (Token required)
```
GET   /boards                  # List all
POST  /boards                  # Create new
GET   /boards/:id              # Get one
PATCH /boards/:id              # Update
DELETE /boards/:id             # Delete
```

### Components (Token required)
```
GET  /boards/:boardId/components              # List
POST /boards/:boardId/components              # Create
GET  /boards/:boardId/components/:componentId # Get
PATCH /boards/:boardId/components/:componentId # Update
DELETE /boards/:boardId/components/:componentId # Delete
```

### Relationships (Token required)
```
GET   /boards/:boardId/relationships              # List
POST  /boards/:boardId/relationships              # Create
GET   /boards/:boardId/relationships/:relationshipId # Get
PATCH /boards/:boardId/relationships/:relationshipId # Update
DELETE /boards/:boardId/relationships/:relationshipId # Delete
```

### Cross-Board Links (Token required)
```
GET  /cross-board-links                # List
POST /cross-board-links                # Create
GET  /cross-board-links/:linkId        # Get
PATCH /cross-board-links/:linkId       # Update
DELETE /cross-board-links/:linkId      # Delete
```

---

## ✅ You're Ready!

- **Backend is complete** with 41 endpoints
- **Swagger docs are live** at /api/docs
- **Tests are ready** to run with `npm test`
- **Docker setup is ready** for production

**What's next?**
1. Explore backend with Swagger UI
2. Read full [README.md](./README.md) for details
3. Start building the frontend (React + Vite)

**Questions?** See [README.md](./README.md#troubleshooting) for common issues.
