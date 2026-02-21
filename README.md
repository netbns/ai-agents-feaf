# 🏗️ FEAF-Aligned AI Agents

A production-ready full-stack enterprise architecture management platform implementing the Federal Enterprise Architecture Framework (FEAF) with support for all six reference models.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Overview

This application provides a comprehensive platform for managing enterprise architectures using the FEAF framework. It enables organizations to create, visualize, and maintain relationships between architectural components across all six FEAF reference models:

- **PRM** - Performance Reference Model
- **BRM** - Business Reference Model  
- **DRM** - Data Reference Model
- **ARM** - Application Reference Model
- **IRM** - Infrastructure Reference Model
- **SRM** - Security Reference Model

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Bcrypt password hashing
- User isolation and board ownership validation

### 📊 Board Management
- Create dedicated boards for each FEAF reference model
- Export board data with all components and relationships
- Multi-user support with proper isolation

### 🧩 Component Management
- Flexible component creation with type validation per reference model
- Support for component metadata and positioning
- Bulk position updates for efficient canvas management

### 🔗 Relationship Management
- Five relationship types:
  - `DEPENDS_ON` - Dependencies between components
  - `COMMUNICATES_WITH` - Communication flows
  - `CONTAINS` - Hierarchical containment
  - `SUPPORTS` - Support relationships
  - `IMPLEMENTS` - Implementation relationships

### 🌉 Cross-Board Linking
- Semantic linking between components across different reference models
- Validation of appropriate transitions between models
- Maintains architectural integrity across the enterprise

### 🚀 Dapr Integration
- Service invocation for microservices architecture
- State management with Redis backing
- gRPC protocol support
- Graceful degradation when Dapr is unavailable

### 📈 Monitoring & Health
- Kubernetes-ready health checks (liveness/readiness probes)
- Comprehensive logging
- Prometheus integration ready

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React + Vite)                            │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
│  │  Pages  │ │Components│ │  Store  │ │  API Client  │   │
│  └─────────┘ └──────────┘ └─────────┘ └──────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                         Backend                              │
│                    (NestJS + Prisma)                         │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
│  │  Auth   │ │  Boards  │ │Component│ │Relationships │   │
│  └─────────┘ └──────────┘ └─────────┘ └──────────────┘   │
│  ┌──────────────────┐  ┌────────────┐                      │
│  │Cross-Board Links │  │    Dapr    │                      │
│  └──────────────────┘  └────────────┘                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      PostgreSQL                              │
│                   (Prisma Schema)                            │
│  8 Models: User, Board, Component, Relationship, etc.       │
└──────────────────────────────────────────────────────────────┘
```

### 📐 Architecture Diagrams

Detailed architecture diagrams are available in the `docs/` directory:

#### C4 Model Diagrams
- **[C4 Context Diagram](docs/c4-context.drawio)** - System context showing users, main system, and external dependencies
- **[C4 Container Diagram](docs/c4-container.drawio)** - Detailed view of containers (frontend, backend modules, database)

#### Infrastructure Diagrams  
- **[Kubernetes Infrastructure](docs/kubernetes-infrastructure.drawio)** - Complete K8s deployment architecture with all resources

**To view/edit diagrams:** Open the `.drawio` files in VS Code with the [Draw.io Integration extension](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)

**Diagram contents:**
- **C4 Context**: Users (Architects, Stakeholders), System components, External systems (Dapr)
- **C4 Container**: React Frontend, NestJS Backend (9 modules), PostgreSQL, Redis, API endpoints
- **Kubernetes**: Deployments, StatefulSets, Services, ConfigMaps, Secrets, PVCs, Dapr components, RBAC

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.0.0 | Node.js framework |
| **Prisma** | 5.11.0 | ORM & database management |
| **PostgreSQL** | 14+ | Primary database |
| **Passport JWT** | 10.0.0 | Authentication |
| **Dapr** | 1.10+ | Microservices runtime |
| **Swagger** | 7.3.0 | API documentation |

### Frontend  
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **Vite** | 5.0.8 | Build tool & dev server |
| **TypeScript** | 5.3.3 | Type safety |
| **Tailwind CSS** | 3.3.6 | Styling |
| **React Query** | 3.39.3 | Server state management |
| **Zustand** | 4.4.7 | Client state management |
| **Axios** | 1.6.4 | HTTP client |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Kubernetes** | Orchestration |
| **Minikube** | Local K8s development |
| **Dapr** | Service mesh |
| **Prometheus** | Monitoring (planned) |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- PostgreSQL 14+ (or use Docker)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/netbns/ai-agents-feaf.git
   cd ai-agents-feaf
   ```

2. **Start the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   docker-compose up -d
   npm run prisma:migrate
   npm run start:dev
   ```
   Backend will be available at: http://localhost:3000
   Swagger API docs at: http://localhost:3000/api

3. **Start the frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Frontend will be available at: http://localhost:5173

### Option 2: Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Option 3: Kubernetes Deployment

See [k8s/README.md](k8s/README.md) for complete Kubernetes deployment instructions.

```bash
cd k8s
./apply-infrastructure.sh
./apply-storage.sh
./apply-postgres.sh
# Then deploy backend and frontend
```

## 📁 Project Structure

```
ai-agents-feaf/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── domain/            # Feature modules (auth, boards, components, etc.)
│   │   ├── prisma/            # Prisma service
│   │   └── config/            # Configuration
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (8 models)
│   ├── docker-compose.yml     # Local development stack
│   ├── Dockerfile             # Production container
│   └── README.md              # Backend documentation
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── pages/             # 5 main pages
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API client
│   │   ├── store/             # Zustand stores
│   │   ├── hooks/             # Custom hooks
│   │   └── types/             # TypeScript types
│   ├── vite.config.ts         # Vite configuration
│   └── README.md              # Frontend documentation
│
├── docs/                       # Architecture diagrams
│   ├── c4-context.drawio      # C4 Context diagram
│   ├── c4-container.drawio    # C4 Container diagram
│   └── kubernetes-infrastructure.drawio  # K8s architecture
│
├── k8s/                        # Kubernetes manifests
│   ├── 00-namespace.yaml      # Namespace
│   ├── 01-service-accounts.yaml
│   ├── 08-postgres-statefulset.yaml
│   ├── 20-backend-deployment.yaml
│   ├── 22-frontend-deployment.yaml
│   ├── *.sh                   # Deployment scripts
│   └── README.md              # K8s documentation
│
├── FULL_STACK_COMPLETION.md   # Project completion summary
├── PHASE-1.5-COMPLETION-SUMMARY.md
└── README.md                  # This file
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:3000/api
- **OpenAPI JSON:** http://localhost:3000/api-json

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

#### Boards
- `GET /boards` - List all boards
- `POST /boards` - Create new board
- `GET /boards/:id` - Get board details
- `PUT /boards/:id` - Update board
- `DELETE /boards/:id` - Delete board
- `GET /boards/:id/export` - Export board data

#### Components
- `GET /boards/:boardId/components` - List components
- `POST /boards/:boardId/components` - Create component
- `PUT /components/:id` - Update component
- `DELETE /components/:id` - Delete component
- `PATCH /components/bulk-positions` - Update multiple positions

#### Relationships
- `GET /boards/:boardId/relationships` - List relationships
- `POST /relationships` - Create relationship
- `PUT /relationships/:id` - Update relationship
- `DELETE /relationships/:id` - Delete relationship

#### Cross-Board Links
- `GET /cross-board-links` - List cross-board links
- `POST /cross-board-links` - Create cross-board link
- `PUT /cross-board-links/:id` - Update link
- `DELETE /cross-board-links/:id` - Delete link

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test           # Vitest unit tests
npm run test:ui        # Interactive test UI
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/feaf_dashboard"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Application
PORT=3000
NODE_ENV=development

# Dapr (optional)
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50001
```

### Frontend Configuration

Update `src/constants/index.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

## 📖 Documentation

Detailed documentation for each component:

- [Backend Documentation](backend/README.md) - Complete backend API guide
- [Frontend Documentation](frontend/README.md) - Frontend architecture and usage
- [Kubernetes Deployment](k8s/README.md) - K8s deployment guide
- [Backend Quick Start](backend/QUICK_START.md) - Fast backend setup
- [Frontend Quick Start](frontend/QUICK_START.md) - Fast frontend setup
- [Full Stack Completion](FULL_STACK_COMPLETION.md) - Project timeline and features
- [Secret Management](k8s/SECRET-MANAGEMENT.md) - K8s secrets guide
- [Storage Configuration](k8s/STORAGE.md) - Persistent storage setup
- [Dapr Integration](k8s/DAPR-INSTALLATION.md) - Dapr configuration

## 🔐 Security

- JWT tokens with secure HS256 signing
- Bcrypt password hashing with salt rounds
- User isolation at database level
- CORS configuration for production
- Environment-based secrets management
- SQL injection protection via Prisma

## 🐳 Docker Support

### Development
```bash
# Backend with PostgreSQL
cd backend
docker-compose up -d

# Frontend
cd frontend  
docker-compose up -d
```

### Production Build
```bash
# Backend
cd backend
docker build -t feaf-backend:latest .

# Frontend
cd frontend
docker build -t feaf-frontend:latest .
```

## ☸️ Kubernetes Deployment

Full Kubernetes deployment with:
- Namespace isolation
- Service accounts and RBAC
- Resource quotas and limits
- PostgreSQL StatefulSet with persistent storage
- ConfigMaps and Secrets management
- Health check probes
- Horizontal scaling ready

See [k8s/README.md](k8s/README.md) for complete instructions.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Diego Alonso Espinosa Jimenez - [@netbns](https://github.com/netbns)

## 🙏 Acknowledgments

- Federal Enterprise Architecture Framework (FEAF) documentation
- NestJS and React communities
- Dapr project for microservices runtime

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Email: da.espinosa@uniandes.edu.co

---

**Built with ❤️ for Enterprise Architecture Management**
