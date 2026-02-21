# FEAF-Aligned AI Agents - Frontend

A modern React + Vite frontend for managing enterprise architecture using the FEAF reference models.

## Features

✅ **Authentication & Authorization**
- User registration and login
- JWT token management
- Protected routes

✅ **Board Management**
- Create boards for each FEAF reference model
- List and view boards
- Board details and metadata

✅ **Component Management**
- Create, edit, delete components
- Type validation per reference model
- Drag-and-drop positioning (planned)

✅ **Relationship Visualization**
- Display component relationships
- 5 relationship types (DEPENDS_ON, COMMUNICATES_WITH, CONTAINS, SUPPORTS, IMPLEMENTS)
- Interactive relationship editor (planned)

✅ **Cross-Board Linking**
- Link components across reference models
- Semantic validation
- Visual connection display (planned)

✅ **API Integration**
- Full TypeScript client for backend API
- React Query for data fetching
- Automatic token management

✅ **State Management**
- Zustand store for auth state
- Canvas state for UI interactions
- React Query for server state

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18.2.0 |
| **Build Tool** | Vite 5.0.8 |
| **Language** | TypeScript 5.3.3 |
| **Styling** | Tailwind CSS 3.3.6 |
| **Data Fetching** | React Query 3.39.3 |
| **State Management** | Zustand 4.4.7 |
| **Routing** | React Router DOM 6.20.1 |
| **HTTP Client** | Axios 1.6.2 |
| **Testing** | Vitest 1.0.4 |
| **Notifications** | React Hot Toast 2.4.1 |

## Project Structure

```
frontend/
├── src/
│   ├── components/              # Reusable React components
│   │   └── ProtectedRoute.tsx   # Route protection wrapper
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── BoardsPage.tsx
│   │   ├── BoardDetailPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/                # API integration
│   │   └── api-client.ts        # Axios instance + API methods
│   ├── store/                   # Zustand stores
│   │   ├── auth.ts              # Auth state
│   │   └── canvas.ts            # Canvas/UI state
│   ├── hooks/                   # Custom React hooks
│   │   ├── useApi.ts            # react-query hooks
│   │   └── useAuth.ts           # Auth logic
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # All type definitions
│   ├── constants/               # App constants
│   ├── styles/                  # CSS/Tailwind
│   ├── utils/                   # Utility functions
│   ├── test/                    # Test setup
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── vitest.config.ts             # Test configuration
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind config
├── package.json                 # Dependencies
└── Dockerfile                   # Docker build
```

## Quick Start

### Prerequisites
- Node.js 20+
- Running backend on http://localhost:3000

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local if needed (defaults work with backend on localhost:3000)
```

### 3. Start Development Server
```bash
npm run dev
# Frontend runs on http://localhost:3001
```

### 4. Access Application
- Open http://localhost:3001
- Register new account or login
- Create and manage boards

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Check TypeScript types

# Quality
npm run lint             # Run ESLint
npm run format           # Auto-format code
npm run format:check     # Check formatting

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

## Main Pages

### LoginPage (`/login`)
- User authentication
- Email and password input
- Error handling
- Register link

### RegisterPage (`/register`)
- New user account creation
- Name, email, password inputs
- Password confirmation
- Login link

### BoardsPage (`/boards`)
- List all user boards
- Create new board
- Board cards with metadata
- Navigate to board details

### BoardDetailPage (`/boards/:boardId`)
- View board details
- List components on board
- Display relationships
- (Future) Canvas visualization

## API Integration

### Authentication
```typescript
// Login
const { login } = useAuth();
login({ email: 'user@example.com', password: 'password' });

// Register
const { register } = useAuth();
register({ name: 'John', email: 'john@example.com', password: 'pass' });

// Logout
const { logout } = useAuth();
logout();
```

### Boards
```typescript
// Get all boards
const { data: boards } = useBoards();

// Get single board
const { data: board } = useBoard(boardId);

// Create board
const { mutate: createBoard } = useCreateBoard();

// Update board
const { mutate: updateBoard } = useUpdateBoard(boardId);

// Delete board
const { mutate: deleteBoard } = useDeleteBoard();

// Export board
const { mutate: exportBoard } = useExportBoard();
```

### Components
```typescript
// Get components on board
const { data: components } = useComponents(boardId);

// Create component
const { mutate: createComponent } = useCreateComponent(boardId);

// Update component
const { mutate: updateComponent } = useUpdateComponent(boardId, componentId);

// Delete component
const { mutate: deleteComponent } = useDeleteComponent(boardId);
```

### Relationships
```typescript
// Get relationships
const { data: relationships } = useRelationships(boardId);

// Create relationship
const { mutate: createRelationship } = useCreateRelationship(boardId);

// Update relationship
const { mutate: updateRelationship } = useUpdateRelationship(boardId, relId);

// Delete relationship
const { mutate: deleteRelationship } = useDeleteRelationship(boardId);
```

## State Management

### Auth Store (Zustand)
```typescript
import { useAuthStore } from '@/store/auth';

// Get state
const user = useAuthStore((state) => state.user);
const token = useAuthStore((state) => state.token);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Set state
const setUser = useAuthStore((state) => state.setUser);
const setToken = useAuthStore((state) => state.setToken);
```

### Canvas Store (Zustand)
```typescript
import { useCanvasStore } from '@/store/canvas';

// Canvas state for UI interactions
const selectedComponentId = useCanvasStore((state) => state.selectedComponentId);
const zoom = useCanvasStore((state) => state.zoom);
const panX = useCanvasStore((state) => state.panX);
const panY = useCanvasStore((state) => state.panY);
```

## Type Safety

All types are defined in `src/types/index.ts`:

```typescript
// Entities
export interface User { ... }
export interface Board { ... }
export interface Component { ... }
export interface Relationship { ... }
export interface CrossBoardLink { ... }

// DTOs
export interface CreateBoardRequest { ... }
export interface UpdateComponentRequest { ... }
export interface CreateRelationshipRequest { ... }

// Enums
export type ReferenceModel = 'PRM' | 'BRM' | 'DRM' | 'ARM' | 'IRM' | 'SRM';
export type RelationshipType = 'DEPENDS_ON' | 'COMMUNICATES_WITH' | ...;
```

## Docker Deployment

### Development
```bash
docker build -t feaf-frontend:dev .
docker run -p 3001:3001 \
  -e VITE_API_URL=http://backend:3000 \
  feaf-frontend:dev
```

### Production
```bash
docker build -t feaf-frontend:1.0 .
docker run -p 3001:3001 \
  -e VITE_API_URL=https://api.example.com \
  feaf-frontend:1.0
```

### Docker Compose (Full Stack)
```bash
docker-compose up
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
```

## Testing

### Unit Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

### Run Tests in UI Mode
```bash
npm run test:ui
# Opens interactive test UI
```

## Performance Optimization

### Build Output
- Multi-chunk splitting for vendor libraries
- React, React DOM, React Router in separate chunk
- React Query in separate chunk
- Zustand in separate chunk
- Source maps disabled in production

### Caching
- React Query stale time: 5 minutes
- No refetch on window focus
- Selective refetching on mutations

### Code Splitting
- Route-based code splitting
- Lazy loading of pages
- Dynamic imports

## Common Issues & Solutions

### CORS Errors
**Problem:** API requests blocked by CORS
**Solution:** 
- Verify backend is running on http://localhost:3000
- Check VITE_API_URL in .env.local
- Verify backend CORS configuration

### 401 Unauthorized
**Problem:** API returns 401 unauthorized
**Solution:**
- Clear localStorage and login again
- Check JWT token validity in browser DevTools
- Verify token is being sent: `Authorization: Bearer <token>`

### Components Not Loading
**Problem:** Board detail page loads but no components showing
**Solution:**
- Check backend API is returning components
- Verify board ID is valid
- Check React Query DevTools for API responses
- Look at browser console for errors

### Styling Not Applied
**Problem:** Tailwind styles not showing
**Solution:**
- Verify npm install completed
- Rebuild: `npm run build`
- Clear browser cache
- Check tailwind.config.js content paths

## Next Steps

### Phase 1 (Current)
- ✅ Project setup with Vite + React
- ✅ TypeScript configuration
- ✅ API client integration
- ✅ Authentication pages
- ✅ Board management
- ✅ Basic component listing

### Phase 2 (Planned)
- [ ] Canvas visualization
- [ ] Drag-and-drop components
- [ ] Relationship visualization
- [ ] Visual editor for relationships
- [ ] Cross-board link visualization
- [ ] Advanced filtering and search

### Phase 3 (Future)
- [ ] Real-time updates (WebSockets)
- [ ] Collaborative editing
- [ ] Advanced export formats
- [ ] Analytics dashboard
- [ ] AI-powered suggestions
- [ ] Mobile responsive design

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Contributing

Follow the existing code patterns:
- Use TypeScript strictly
- Add types for all function parameters and returns
- Use React hooks for logic
- Maintain component size (< 300 lines)
- Add error handling for API calls
- Test new features before submitting

## License

MIT - See LICENSE file for details
