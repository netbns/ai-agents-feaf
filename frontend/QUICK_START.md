# Frontend - Quick Start Guide

## Get Running in 3 Steps

### Step 1: Install & Configure
```bash
cd frontend
npm install
cp .env.example .env.local
```

### Step 2: Verify Backend is Running
```bash
# In another terminal, check backend:
curl http://localhost:3000/health/liveness
# Should return: {"status":"ok"}
```

### Step 3: Start Development Server
```bash
npm run dev
# Opens http://localhost:3001
```

## First Time Setup

1. **Register Account**
   - Go to http://localhost:3001/register
   - Fill in name, email, password
   - Click "Create account"

2. **Create First Board**
   - You're redirected to /boards page
   - Click "New Board"
   - Name: "My First Board"
   - Model: "PRM" (Performance Reference Model)
   - Click "Create Board"

3. **View Board**
   - Click on your board
   - See components and relationships
   - (More features coming soon)

## Development Commands

```bash
npm run dev              # Start with hot reload
npm run lint             # Check code quality  
npm run format           # Fix formatting
npm run test             # Run tests
npm run build            # Production build
```

## Project Structure

```
frontend/src/
├── pages/               # Page components (Login, Boards, etc)
├── components/          # Reusable components
├── services/            # API integration
├── store/               # Zustand state
├── hooks/               # Custom hooks
├── types/               # TypeScript definitions
└── styles/              # Tailwind CSS
```

## Troubleshooting

### Port 3001 already in use
```bash
# Find process on port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Backend not responding
```bash
# Check backend is running
curl http://localhost:3000/health/liveness
# If not, start it: cd ../backend && docker-compose up
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force
# Retry install
npm install
```

## Next: Test Both Together

```bash
# Terminal 1: Backend
cd backend
docker-compose up

# Terminal 2: Frontend  
cd frontend
npm run dev

# Both running!
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
```

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with routing |
| `src/services/api-client.ts` | API integration |
| `src/types/index.ts` | All TypeScript types |
| `src/store/auth.ts` | Auth state (Zustand) |
| `src/pages/LoginPage.tsx` | Authentication |
| `src/pages/BoardsPage.tsx` | Board list & create |

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

### Get Boards
```bash
curl http://localhost:3000/boards \
  -H "Authorization: Bearer <token>"
```

## Frontend Architecture

```
┌─────────────────────────┐
│   React Components      │ (Pages, UI)
├─────────────────────────┤
│   React Hooks           │ (useApi, useAuth)
├─────────────────────────┤
│   Zustand Store         │ (Auth, Canvas state)
├─────────────────────────┤
│   React Query           │ (Data fetching, caching)
├─────────────────────────┤
│   Axios API Client      │ (HTTP requests)
└─────────────────────────┘
         ↓ REST API
┌─────────────────────────┐
│   NestJS Backend        │
│   (Port 3000)           │
└─────────────────────────┘
```

## What's Ready

✅ Authentication (Login/Register)  
✅ Board management (Create, list, view)  
✅ API integration with full TypeScript types  
✅ State management (Auth, Canvas)  
✅ Protected routes  
✅ Error handling  
✅ Toast notifications  

## What's Planned

⏳ Drag-and-drop canvas  
⏳ Visual component editing  
⏳ Relationship visualization  
⏳ Cross-board linking UI  
⏳ Advanced search/filtering  
⏳ Dark mode  

## Support

- Check [README.md](./README.md) for full documentation
- See backend [QUICK_START.md](../backend/QUICK_START.md) for backend setup
- Review TypeScript types in `src/types/index.ts`
- Check API client methods in `src/services/api-client.ts`
