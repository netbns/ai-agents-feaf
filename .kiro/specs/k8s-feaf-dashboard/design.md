# Design Document: k8s-feaf-dashboard

## Overview

The k8s-feaf-dashboard is a cloud-native, full-stack application for creating and managing Federal Enterprise Architecture Framework (FEAF) boards. The system provides an intuitive interface for collecting architecture information across the six FEAF reference models and visualizing them as interactive boards.

### Architecture Goals

1. **User-Centric**: Guided forms that make FEAF board creation accessible
2. **Extensible**: Architecture ready for future multi-agent integration and Enterprise Integration Patterns
3. **Cloud-Native**: Kubernetes-native deployment with observability built-in
4. **Scalable**: Stateless services that can scale horizontally
5. **Reliable**: Health checks, monitoring, and graceful degradation

### Technology Stack

- **Frontend**: React 18+ with TypeScript, React Router, React Flow for visualization
- **Backend**: NestJS with TypeScript, Prisma ORM
- **Database**: PostgreSQL 15+
- **Service Mesh**: Dapr (Distributed Application Runtime) with gRPC
- **Monitoring**: Prometheus with custom metrics
- **Container Orchestration**: Kubernetes
- **API Documentation**: OpenAPI/Swagger

## Architecture

### High-Level Architecture with Dapr

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Frontend Tier"
            subgraph "Frontend Pod 1"
                FE1[React App]
                FE1_DAPR[Dapr Sidecar]
            end
            subgraph "Frontend Pod 2"
                FE2[React App]
                FE2_DAPR[Dapr Sidecar]
            end
            FE_SVC[Frontend Service<br/>LoadBalancer]
        end
        
        subgraph "Backend Tier"
            subgraph "Backend Pod 1"
                BE1[NestJS App]
                BE1_DAPR[Dapr Sidecar]
            end
            subgraph "Backend Pod 2"
                BE2[NestJS App]
                BE2_DAPR[Dapr Sidecar]
            end
            BE_SVC[Backend Service<br/>ClusterIP]
        end
        
        subgraph "Dapr Control Plane"
            DAPR_OP[Dapr Operator]
            DAPR_PLACE[Dapr Placement]
            DAPR_SENT[Dapr Sentry]
        end
        
        subgraph "Data Tier"
            DB[PostgreSQL<br/>StatefulSet]
            PV[Persistent Volume]
        end
        
        subgraph "Monitoring Tier"
            PROM[Prometheus]
            PROM_SVC[Prometheus Service]
        end
    end
    
    USER[User Browser] --> FE_SVC
    FE_SVC --> FE1
    FE_SVC --> FE2
    FE1 --> FE1_DAPR
    FE2 --> FE2_DAPR
    FE1_DAPR -->|gRPC Service Invocation| BE1_DAPR
    FE2_DAPR -->|gRPC Service Invocation| BE2_DAPR
    BE1_DAPR --> BE1
    BE2_DAPR --> BE2
    BE1 --> BE1_DAPR
    BE2 --> BE2_DAPR
    BE1_DAPR -->|State Management| DB
    BE2_DAPR -->|State Management| DB
    DB --> PV
    PROM --> BE1
    PROM --> BE2
    PROM --> FE1
    PROM --> FE2
    DAPR_OP -.Manages.-> BE1_DAPR
    DAPR_OP -.Manages.-> BE2_DAPR
    DAPR_OP -.Manages.-> FE1_DAPR
    DAPR_OP -.Manages.-> FE2_DAPR
```

### Dapr Architecture and Sidecar Pattern

Dapr (Distributed Application Runtime) provides a sidecar architecture that simplifies microservice communication, state management, and observability. Each application pod runs with a Dapr sidecar container that handles cross-cutting concerns.

#### Dapr Sidecar Pattern

```mermaid
graph LR
    subgraph "Application Pod"
        APP[Application<br/>Container]
        DAPR[Dapr Sidecar<br/>Container]
    end
    
    subgraph "External Services"
        OTHER_APP[Other App<br/>+ Dapr Sidecar]
        STATE_STORE[(State Store<br/>PostgreSQL)]
        PUBSUB[Pub/Sub<br/>Broker]
    end
    
    APP -->|HTTP/gRPC<br/>localhost:3500| DAPR
    DAPR -->|gRPC Service<br/>Invocation| OTHER_APP
    DAPR -->|State API| STATE_STORE
    DAPR -->|Pub/Sub API| PUBSUB
```

#### Dapr Components Used

1. **Service Invocation (gRPC)**
   - Service-to-service calls with automatic service discovery
   - Built-in retries, timeouts, and circuit breakers
   - mTLS encryption for secure communication
   - Distributed tracing integration

2. **State Management**
   - Abstraction layer over PostgreSQL for state operations
   - CRUD operations with consistency guarantees
   - Bulk operations for performance
   - Query capabilities with filtering

3. **Observability**
   - Automatic distributed tracing with OpenTelemetry
   - Metrics export to Prometheus
   - Logging correlation across services

4. **Resiliency**
   - Configurable retry policies
   - Circuit breakers for fault tolerance
   - Timeout policies per operation

#### Communication Flow with Dapr

**Frontend → Backend Communication**:
```
1. React App makes HTTP request to localhost:3500 (Dapr sidecar)
2. Dapr sidecar resolves "feaf-backend" service via Kubernetes DNS
3. Dapr sidecar invokes backend's Dapr sidecar using gRPC
4. Backend Dapr sidecar forwards request to NestJS app on localhost:3000
5. Response flows back through the same path
```

**Backend → Database Communication**:
```
1. NestJS app calls Dapr State API on localhost:3500
2. Dapr sidecar translates to PostgreSQL operations
3. Dapr handles connection pooling, retries, and error handling
4. State operations are tracked for observability
```

#### Dapr Configuration

**Dapr Components**:
- `statestore.yaml`: PostgreSQL state store configuration
- `resiliency.yaml`: Retry and circuit breaker policies
- `configuration.yaml`: Tracing and metrics configuration

**Dapr Annotations** (added to pod specs):
```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "feaf-backend"  # or "feaf-frontend"
  dapr.io/app-port: "3000"  # Application port
  dapr.io/app-protocol: "grpc"  # Use gRPC for performance
  dapr.io/enable-metrics: "true"
  dapr.io/metrics-port: "9090"
  dapr.io/log-level: "info"
```

### Future Extensibility: Multi-Agent Architecture

The system is designed to support future integration with AI agents and Enterprise Integration Patterns:

```mermaid
graph TB
    subgraph "Current Implementation"
        FE[React Frontend]
        BE[NestJS Backend]
        DB[(PostgreSQL)]
    end
    
    subgraph "Future: Agent Layer"
        ORCH[Multi-Agent Orchestrator]
        MB[Message Broker<br/>RabbitMQ/Kafka]
        
        subgraph "Strategic Planning Agents"
            A1[Agent 1]
        end
        
        subgraph "Business Architecture Agents"
            A2[Agent 2]
            A3[Agent 3]
        end
        
        subgraph "Data Architecture Agents"
            A4[Agent 4]
        end
        
        subgraph "Application Architecture Agents"
            A5[Agent 5]
        end
        
        subgraph "Infrastructure Architecture Agents"
            A6[Agent 6]
        end
        
        subgraph "Security & Risk Agents"
            A7[Agent 7]
        end
    end
    
    FE --> BE
    BE --> DB
    BE -.Future.-> ORCH
    ORCH -.-> MB
    MB -.-> A1
    MB -.-> A2
    MB -.-> A3
    MB -.-> A4
    MB -.-> A5
    MB -.-> A6
    MB -.-> A7
```

## Components and Interfaces

### Frontend Components

#### 1. Application Shell
- **Responsibility**: Top-level routing, authentication state, navigation
- **Key Components**:
  - `App.tsx`: Root component with routing
  - `AuthProvider.tsx`: Authentication context
  - `Navigation.tsx`: Main navigation bar
  - `ProtectedRoute.tsx`: Route guard for authenticated pages

#### 2. Board Management Module
- **Responsibility**: CRUD operations for boards
- **Key Components**:
  - `BoardList.tsx`: Display all user boards with filtering
  - `BoardCard.tsx`: Individual board preview card
  - `CreateBoardModal.tsx`: Modal for selecting reference model and creating board
  - `BoardTypeSelector.tsx`: UI for choosing from six reference models

#### 3. Form Module (Reference Model Specific)
- **Responsibility**: Guided data collection for each reference model
- **Key Components**:
  - `PRMForm.tsx`: Performance Reference Model form (KPIs, metrics)
  - `BRMForm.tsx`: Business Reference Model form (functions, services)
  - `DRMForm.tsx`: Data Reference Model form (entities, standards)
  - `ARMForm.tsx`: Application Reference Model form (applications, interfaces)
  - `IRMForm.tsx`: Infrastructure Reference Model form (infrastructure elements)
  - `SRMForm.tsx`: Security Reference Model form (controls, policies)
  - `FormField.tsx`: Reusable form field with validation and help text
  - `FormValidation.ts`: Validation logic and error messages

#### 4. Board Visualization Module
- **Responsibility**: Interactive board display with drag-and-drop
- **Key Components**:
  - `BoardCanvas.tsx`: Main canvas using React Flow
  - `ComponentNode.tsx`: Visual representation of a component
  - `RelationshipEdge.tsx`: Visual representation of relationships
  - `BoardToolbar.tsx`: Zoom, pan, export controls
  - `ComponentDetailsPanel.tsx`: Side panel showing component properties

#### 5. Component Management Module
- **Responsibility**: Add, edit, delete components on boards
- **Key Components**:
  - `ComponentForm.tsx`: Form for creating/editing components
  - `ComponentList.tsx`: List view of board components
  - `RelationshipForm.tsx`: Form for creating relationships
  - `CrossBoardLinkForm.tsx`: Form for linking across reference models

### Backend Modules

#### Dapr Integration Layer

- **Responsibility**: Interface with Dapr sidecar for service invocation and state management
- **Services**:
  - `DaprClientService`: Wrapper around Dapr SDK for service invocation
  - `DaprStateService`: State management operations via Dapr
  - `DaprHealthService`: Health checks for Dapr sidecar connectivity
- **Configuration**:
  - Dapr HTTP/gRPC client initialization
  - Service discovery configuration
  - Retry and timeout policies

#### 1. Authentication Module
- **Responsibility**: User authentication and session management
- **Endpoints**:
  - `POST /auth/login`: Authenticate user
  - `POST /auth/logout`: End session
  - `GET /auth/me`: Get current user
- **Services**:
  - `AuthService`: Authentication logic, token generation
  - `JwtStrategy`: JWT validation strategy
- **Guards**:
  - `JwtAuthGuard`: Protect routes requiring authentication

#### 2. Board Module
- **Responsibility**: Board CRUD operations
- **Endpoints**:
  - `GET /boards`: List user's boards (with filtering)
  - `POST /boards`: Create new board
  - `GET /boards/:id`: Get board details
  - `PATCH /boards/:id`: Update board
  - `DELETE /boards/:id`: Delete board
  - `GET /boards/:id/export`: Export board as JSON/CSV
- **Services**:
  - `BoardService`: Business logic for boards
  - `BoardValidationService`: Validate board data
- **DTOs**:
  - `CreateBoardDto`: Validation for board creation
  - `UpdateBoardDto`: Validation for board updates
  - `BoardFilterDto`: Query parameters for filtering

#### 3. Component Module
- **Responsibility**: Component CRUD operations
- **Endpoints**:
  - `GET /boards/:boardId/components`: List components
  - `POST /boards/:boardId/components`: Create component
  - `GET /components/:id`: Get component details
  - `PATCH /components/:id`: Update component
  - `DELETE /components/:id`: Delete component
- **Services**:
  - `ComponentService`: Business logic for components
  - `ComponentValidationService`: Validate component data based on reference model
- **DTOs**:
  - `CreateComponentDto`: Base DTO for components
  - `PRMComponentDto`: PRM-specific properties
  - `BRMComponentDto`: BRM-specific properties
  - `DRMComponentDto`: DRM-specific properties
  - `ARMComponentDto`: ARM-specific properties
  - `IRMComponentDto`: IRM-specific properties
  - `SRMComponentDto`: SRM-specific properties

#### 4. Relationship Module
- **Responsibility**: Manage relationships between components
- **Endpoints**:
  - `GET /boards/:boardId/relationships`: List relationships
  - `POST /relationships`: Create relationship
  - `DELETE /relationships/:id`: Delete relationship
  - `POST /cross-board-links`: Create cross-reference model link
  - `GET /cross-board-links/:componentId`: Get cross-board links for component
- **Services**:
  - `RelationshipService`: Business logic for relationships
  - `CrossBoardLinkService`: Business logic for cross-reference model links

#### 5. Reference Model Module
- **Responsibility**: Provide reference model metadata
- **Endpoints**:
  - `GET /reference-models`: List all six reference models
  - `GET /reference-models/:type`: Get specific reference model details
- **Services**:
  - `ReferenceModelService`: Provide reference model definitions

#### 6. Health Module
- **Responsibility**: Kubernetes health checks
- **Endpoints**:
  - `GET /health/liveness`: Liveness probe
  - `GET /health/readiness`: Readiness probe (checks DB connection)
- **Services**:
  - `HealthService`: Health check logic

#### 7. Metrics Module
- **Responsibility**: Prometheus metrics
- **Endpoints**:
  - `GET /metrics`: Prometheus metrics endpoint
- **Metrics Tracked**:
  - HTTP request count by method, path, status
  - HTTP request duration histogram
  - Database query duration
  - Active connections
  - Board count by reference model
  - Component count by type

### Future: Integration Module (Extensibility)

This module will be added in future iterations to support Enterprise Integration Patterns and multi-agent orchestration:

- **Agent Registry**: Register and manage AI agents
- **Message Broker Integration**: Pub/sub for event-driven communication
- **Workflow Engine**: Orchestrate multi-agent workflows
- **Schema Registry**: Manage message schemas for agent communication
- **Policy Enforcement**: Security and data governance at integration points

## Data Models

### Data Access Strategy with Dapr

The application uses a hybrid approach for data access:

1. **Prisma ORM**: For complex queries, transactions, and relational operations
2. **Dapr State Management**: For simple CRUD operations, caching, and distributed state

**When to use Prisma**:
- Complex joins across multiple tables
- Transaction-heavy operations (board deletion with cascades)
- Schema migrations and database versioning
- Advanced query capabilities (full-text search, aggregations)

**When to use Dapr State**:
- Simple key-value lookups (get board by ID)
- Caching frequently accessed data (reference models, user sessions)
- Distributed state that may span multiple data stores in the future
- Operations that benefit from Dapr's built-in retry and resilience

### Prisma Schema

```prisma
// User model
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  boards    Board[]
}

// Board model
model Board {
  id              String            @id @default(uuid())
  name            String
  description     String?
  referenceModel  ReferenceModelType
  userId          String
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  components      Component[]
  relationships   Relationship[]
  
  @@index([userId])
  @@index([referenceModel])
}

// Reference model enum
enum ReferenceModelType {
  PRM  // Performance Reference Model
  BRM  // Business Reference Model
  DRM  // Data Reference Model
  ARM  // Application Reference Model
  IRM  // Infrastructure Reference Model
  SRM  // Security Reference Model
}

// Component model
model Component {
  id                  String         @id @default(uuid())
  name                String
  description         String?
  componentType       String         // e.g., "KPI", "BusinessFunction", "DataEntity"
  boardId             String
  board               Board          @relation(fields: [boardId], references: [id], onDelete: Cascade)
  properties          Json           // Reference model specific properties
  position            Json           // {x: number, y: number} for visualization
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  relationshipsFrom   Relationship[] @relation("FromComponent")
  relationshipsTo     Relationship[] @relation("ToComponent")
  crossBoardLinksFrom CrossBoardLink[] @relation("FromComponent")
  crossBoardLinksTo   CrossBoardLink[] @relation("ToComponent")
  
  @@index([boardId])
  @@index([componentType])
}

// Relationship model (within same board)
model Relationship {
  id               String           @id @default(uuid())
  relationshipType RelationshipType
  fromComponentId  String
  fromComponent    Component        @relation("FromComponent", fields: [fromComponentId], references: [id], onDelete: Cascade)
  toComponentId    String
  toComponent      Component        @relation("ToComponent", fields: [toComponentId], references: [id], onDelete: Cascade)
  boardId          String
  board            Board            @relation(fields: [boardId], references: [id], onDelete: Cascade)
  createdAt        DateTime         @default(now())
  
  @@index([boardId])
  @@index([fromComponentId])
  @@index([toComponentId])
}

enum RelationshipType {
  DEPENDS_ON
  COMMUNICATES_WITH
  CONTAINS
  SUPPORTS
  IMPLEMENTS
}

// Cross-board link model (across reference models)
model CrossBoardLink {
  id              String   @id @default(uuid())
  fromComponentId String
  fromComponent   Component @relation("FromComponent", fields: [fromComponentId], references: [id], onDelete: Cascade)
  toComponentId   String
  toComponent     Component @relation("ToComponent", fields: [toComponentId], references: [id], onDelete: Cascade)
  linkType        String   // e.g., "BRM_to_ARM", "ARM_to_IRM"
  description     String?
  createdAt       DateTime @default(now())
  
  @@index([fromComponentId])
  @@index([toComponentId])
}
```

### Component Properties by Reference Model

Each reference model has specific properties stored in the `properties` JSON field:

#### PRM (Performance Reference Model)
```typescript
interface PRMProperties {
  kpiName: string;
  targetValue: number;
  actualValue: number;
  measurementUnit: string;
  measurementFrequency: string; // "daily", "weekly", "monthly", "quarterly"
  owner: string;
  category: string; // "mission", "customer", "process", "technology"
}
```

#### BRM (Business Reference Model)
```typescript
interface BRMProperties {
  functionName: string;
  functionCategory: string; // "services", "support", "management"
  serviceLevel: string;
  stakeholder: string;
  businessValue: string;
}
```

#### DRM (Data Reference Model)
```typescript
interface DRMProperties {
  entityName: string;
  classificationLevel: string; // "public", "internal", "confidential", "restricted"
  formatSpecification: string; // "JSON", "XML", "CSV", "Avro"
  governanceRules: string;
  dataOwner: string;
  retentionPeriod: string;
}
```

#### ARM (Application Reference Model)
```typescript
interface ARMProperties {
  applicationName: string;
  vendor: string;
  version: string;
  hostingModel: string; // "on-premise", "cloud", "hybrid"
  integrationPoints: string[];
  criticality: string; // "low", "medium", "high", "critical"
}
```

#### IRM (Infrastructure Reference Model)
```typescript
interface IRMProperties {
  elementName: string;
  infrastructureType: string; // "compute", "storage", "network", "platform"
  capacity: string;
  location: string;
  maintenanceSchedule: string;
  provider: string;
}
```

#### SRM (Security Reference Model)
```typescript
interface SRMProperties {
  controlName: string;
  frameworkReference: string; // "NIST", "ISO27001", "FedRAMP"
  riskLevel: string; // "low", "medium", "high", "critical"
  complianceStatus: string; // "compliant", "non-compliant", "in-progress"
  implementationStatus: string;
  owner: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication Token Generation

*For any* valid user credentials, authenticating with those credentials should return a valid session token that can be used for subsequent requests.

**Validates: Requirements 1.1, 1.3**

### Property 2: Invalid Credentials Rejection

*For any* invalid credentials (wrong password, non-existent user, malformed input), the authentication attempt should be rejected with an appropriate error message.

**Validates: Requirements 1.2**

### Property 3: Password Hashing

*For any* user account in the database, the stored password should be a hashed value, not plaintext, and should verify correctly against the original password using bcrypt.

**Validates: Requirements 1.5**

### Property 4: Board Persistence Round Trip

*For any* valid board data (name, description, reference model type), creating a board then retrieving it should return equivalent data with the same properties.

**Validates: Requirements 3.1, 3.4**

### Property 5: Empty Board Name Rejection

*For any* string composed entirely of whitespace or empty string, attempting to create a board with that name should be rejected with a validation error.

**Validates: Requirements 3.2**

### Property 6: Board Ownership and Isolation

*For any* user, querying their boards should return only boards they created, and boards should always be associated with the user who created them.

**Validates: Requirements 3.3, 3.6**

### Property 7: Cascade Deletion

*For any* board with components and relationships, deleting the board should also delete all associated components, relationships, and cross-board links involving those components.

**Validates: Requirements 3.5, 5.3, 6A.4**

### Property 8: Component Persistence Round Trip

*For any* valid component data on a board, creating a component then retrieving it should return equivalent data with the same properties.

**Validates: Requirements 4.1, 4.3**

### Property 9: Component Validation

*For any* component with missing required fields, attempting to create the component should be rejected with validation errors specifying which fields are missing.

**Validates: Requirements 4.2**

### Property 10: Component Query Completeness

*For any* board with multiple components, querying components for that board should return all components associated with the board.

**Validates: Requirements 4.5**

### Property 11: Reference Model Component Type Validation

*For any* board of a specific reference model type, only component types appropriate for that reference model should be accepted, and inappropriate types should be rejected.

**Validates: Requirements 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12**

### Property 12: Reference Model Property Validation

*For any* component on a reference model board, the component should accept properties specific to that reference model (e.g., PRM accepts targetValue/actualValue, BRM accepts functionCategory), and invalid properties should be rejected.

**Validates: Requirements 5A.2, 5A.3, 5A.4, 5A.5, 5A.6, 5A.7, 5A.8**

### Property 13: Relationship Persistence Round Trip

*For any* valid relationship between two components on the same board, creating the relationship then querying relationships for that board should return the relationship with equivalent data.

**Validates: Requirements 5.1, 5.4**

### Property 14: Cross-Board Relationship Rejection

*For any* two components on different boards, attempting to create a relationship between them should be rejected (cross-board links should be used instead).

**Validates: Requirements 5.2**

### Property 15: Cross-Board Link Persistence

*For any* two components on different reference model boards, creating a cross-board link then querying links for either component should return the link with correct source, target, and relationship type.

**Validates: Requirements 6A.1, 6A.3**

### Property 16: Cross-Board Link Semantic Validation

*For any* cross-board link, the system should validate that the link is semantically meaningful based on reference model types (e.g., BRM to ARM is valid, but invalid combinations should be rejected).

**Validates: Requirements 6A.6**

### Property 17: Component Position Persistence

*For any* component on a board, updating its position coordinates then retrieving the component should return the updated position.

**Validates: Requirements 6.4**

### Property 18: Transaction Atomicity

*For any* operation that modifies multiple entities (e.g., creating a board with initial components), if any part fails, the entire operation should be rolled back and no partial state should be persisted.

**Validates: Requirements 7.3, 7.4**

### Property 19: API Response Consistency

*For any* successful API response, the response should follow a consistent JSON structure with standard fields (data, status, etc.), and error responses should consistently include status codes and error messages.

**Validates: Requirements 8.2, 8.3**

### Property 20: Board Export Completeness

*For any* board with components and relationships, exporting the board should produce a JSON representation containing all components, all relationships, and all board metadata.

**Validates: Requirements 13.1, 13.2**

### Property 21: Search Functionality

*For any* search query, the backend should return boards where the query matches (case-insensitive) the board name or description, and filtering by reference model type should return only boards of that type.

**Validates: Requirements 14.1, 14.2, 14.4**

### Property 22: Search Result Ordering

*For any* search query, results should be ordered consistently by relevance (e.g., exact matches first, then partial matches, ordered by creation date).

**Validates: Requirements 14.5**

### Property 23: Error Logging Completeness

*For any* error that occurs in the backend, the error should be logged with timestamp, severity level, and sufficient context to diagnose the issue.

**Validates: Requirements 15.1, 15.3**

### Property 24: Error Response Sanitization

*For any* error in production mode, the error response to the client should not contain internal details (stack traces, database errors), only user-friendly messages.

**Validates: Requirements 15.2, 15.4**

### Property 25: Form Validation

*For any* reference model form, the form should validate required fields, data types, and format constraints before allowing submission, and should display inline validation errors for invalid inputs.

**Validates: Requirements 16.7, 17.2, 17.3, 17.5**

### Property 26: Reference Model Form Fields

*For any* reference model type, the form should contain all required fields specific to that reference model (e.g., PRM form has KPI name, target value, actual value, measurement unit, measurement frequency).

**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**

### Property 27: Form Help Text Presence

*For any* form field, help text explaining the field should be present and accessible to users.

**Validates: Requirements 17.1, 17.4**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Missing required fields
   - Invalid data types
   - Business rule violations (e.g., cross-board relationships)
   - Empty or whitespace-only names

2. **Authentication Errors** (401 Unauthorized)
   - Invalid credentials
   - Expired session tokens
   - Missing authentication headers

3. **Authorization Errors** (403 Forbidden)
   - Accessing boards owned by other users
   - Insufficient permissions

4. **Not Found Errors** (404 Not Found)
   - Board, component, or relationship doesn't exist
   - Invalid endpoint

5. **Conflict Errors** (409 Conflict)
   - Duplicate resource creation
   - Referential integrity violations

6. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Unexpected exceptions
   - Transaction rollback failures

### Error Response Format

All error responses follow a consistent structure:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Error Handling Strategy

1. **Input Validation**: Use NestJS validation pipes with class-validator decorators
2. **Exception Filters**: Global exception filter to catch and format all errors
3. **Logging**: Log all errors with context using structured logging
4. **Monitoring**: Emit error metrics to Prometheus for alerting
5. **Graceful Degradation**: Return cached data or default values when possible
6. **Transaction Rollback**: Automatically rollback database transactions on errors

### Database Error Handling

- **Connection Failures**: Readiness probe returns 503, Kubernetes stops routing traffic
- **Query Timeouts**: Log warning, return 504 Gateway Timeout
- **Constraint Violations**: Return 409 Conflict with user-friendly message
- **Deadlocks**: Automatic retry with exponential backoff (up to 3 attempts)

## Testing Strategy

### Dual Testing Approach

The application requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property Tests**: Verify universal properties across all inputs using randomized testing

### Unit Testing

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty strings, null values, boundary conditions)
- Error conditions and exception handling
- Integration between modules (e.g., authentication + board access)
- API endpoint contracts

**Tools**:
- Jest for test runner
- Supertest for API testing
- React Testing Library for frontend components

**Example Unit Tests**:
- Creating a board with specific valid data returns 201
- Deleting a non-existent board returns 404
- Unauthenticated request to protected endpoint returns 401
- Form submission with empty required field shows validation error

### Property-Based Testing

**Configuration**:
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Each test references its design document property
- Tag format: `Feature: k8s-feaf-dashboard, Property {number}: {property_text}`

**Focus Areas**:
- Universal properties that hold for all inputs
- Data persistence round trips
- Validation rules across all input combinations
- Cascade deletion behavior
- Search and filter correctness

**Example Property Tests**:
- For any valid board data, create → retrieve produces equivalent board
- For any whitespace string, board creation is rejected
- For any board with components, deletion removes all components
- For any search query, results match the query case-insensitively

### Test Coverage Goals

- **Backend**: 80% code coverage minimum
- **Frontend**: 70% code coverage minimum
- **Critical Paths**: 100% coverage (authentication, data persistence, cascade deletion)

### Integration Testing

- **Database Integration**: Test Prisma queries against real PostgreSQL
- **API Integration**: Test full request/response cycles
- **Frontend-Backend Integration**: Test API calls from React components

### End-to-End Testing

- **User Workflows**: Test complete user journeys (login → create board → add components → visualize)
- **Cross-Browser**: Test on Chrome, Firefox, Safari
- **Responsive Design**: Test on desktop and mobile viewports

## Deployment Architecture

### Kubernetes Resources

#### Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feaf-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: feaf-frontend
  template:
    metadata:
      labels:
        app: feaf-frontend
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "feaf-frontend"
        dapr.io/app-port: "80"
        dapr.io/app-protocol: "http"
        dapr.io/enable-metrics: "true"
        dapr.io/metrics-port: "9090"
        dapr.io/log-level: "info"
    spec:
      containers:
      - name: frontend
        image: feaf-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          value: "http://localhost:3500/v1.0/invoke/feaf-backend/method"
        - name: REACT_APP_DAPR_ENABLED
          value: "true"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feaf-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: feaf-backend
  template:
    metadata:
      labels:
        app: feaf-backend
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "feaf-backend"
        dapr.io/app-port: "3000"
        dapr.io/app-protocol: "grpc"
        dapr.io/enable-metrics: "true"
        dapr.io/metrics-port: "9090"
        dapr.io/log-level: "info"
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: backend
        image: feaf-backend:latest
        ports:
        - containerPort: 3000
        - containerPort: 50001  # gRPC port for Dapr
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: feaf-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: feaf-secrets
              key: jwt-secret
        - name: NODE_ENV
          value: "production"
        - name: DAPR_HTTP_PORT
          value: "3500"
        - name: DAPR_GRPC_PORT
          value: "50001"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### Database StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: feaf-postgres
spec:
  serviceName: feaf-postgres
  replicas: 1
  selector:
    matchLabels:
      app: feaf-postgres
  template:
    metadata:
      labels:
        app: feaf-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: feaf
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: feaf-secrets
              key: db-user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: feaf-secrets
              key: db-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
```

#### Prometheus Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        persistentVolumeClaim:
          claimName: prometheus-pvc
```

### Services

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: feaf-frontend
spec:
  type: LoadBalancer
  selector:
    app: feaf-frontend
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: feaf-backend
spec:
  type: ClusterIP
  selector:
    app: feaf-backend
  ports:
  - port: 3000
    targetPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: feaf-postgres
spec:
  type: ClusterIP
  clusterIP: None
  selector:
    app: feaf-postgres
  ports:
  - port: 5432
    targetPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
spec:
  type: ClusterIP
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
```

### Dapr Components

#### State Store Component (PostgreSQL)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
  namespace: default
spec:
  type: state.postgresql
  version: v1
  metadata:
  - name: connectionString
    secretKeyRef:
      name: feaf-secrets
      key: database-url
  - name: tableName
    value: "dapr_state"
  - name: metadataTableName
    value: "dapr_state_metadata"
  - name: timeoutInSeconds
    value: "30"
  - name: cleanupIntervalInSeconds
    value: "3600"
```

#### Resiliency Configuration

```yaml
apiVersion: dapr.io/v1alpha1
kind: Resiliency
metadata:
  name: feaf-resiliency
  namespace: default
spec:
  policies:
    retries:
      DefaultRetryPolicy:
        policy: constant
        duration: 1s
        maxRetries: 3
      
      DatabaseRetryPolicy:
        policy: exponential
        maxInterval: 15s
        maxRetries: 5
    
    timeouts:
      DefaultTimeout: 5s
      DatabaseTimeout: 10s
    
    circuitBreakers:
      DefaultCircuitBreaker:
        maxRequests: 3
        interval: 10s
        timeout: 30s
        trip: consecutiveFailures >= 5
  
  targets:
    apps:
      feaf-backend:
        retry: DefaultRetryPolicy
        timeout: DefaultTimeout
        circuitBreaker: DefaultCircuitBreaker
      
      feaf-frontend:
        retry: DefaultRetryPolicy
        timeout: DefaultTimeout
    
    components:
      statestore:
        outbound:
          retry: DatabaseRetryPolicy
          timeout: DatabaseTimeout
          circuitBreaker: DefaultCircuitBreaker
```

#### Dapr Configuration

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: feaf-dapr-config
  namespace: default
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "http://zipkin:9411/api/v2/spans"
  
  metric:
    enabled: true
  
  mtls:
    enabled: true
    workloadCertTTL: "24h"
    allowedClockSkew: "15m"
  
  accessControl:
    defaultAction: deny
    trustDomain: "public"
    policies:
    - appId: feaf-frontend
      defaultAction: allow
      trustDomain: "public"
      operations:
      - name: /v1.0/invoke/feaf-backend/method/*
        httpVerb: ['*']
        action: allow
    
    - appId: feaf-backend
      defaultAction: allow
      trustDomain: "public"
      operations:
      - name: /v1.0/state/statestore/*
        httpVerb: ['*']
        action: allow
```

### ConfigMaps and Secrets

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: feaf-config
data:
  dapr-enabled: "true"
  dapr-http-port: "3500"
  dapr-grpc-port: "50001"
---
apiVersion: v1
kind: Secret
metadata:
  name: feaf-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:password@feaf-postgres:5432/feaf"
  jwt-secret: "your-jwt-secret-here"
  db-user: "feaf_user"
  db-password: "secure-password-here"
```

## Future Extensibility: Enterprise Integration Patterns

The architecture is designed to support future integration with AI agents and Enterprise Integration Patterns. Dapr provides the foundation for this extensibility through its pub/sub, service invocation, and bindings capabilities.

### Message Broker Integration with Dapr Pub/Sub

**Future Addition**: Dapr Pub/Sub component with RabbitMQ or Apache Kafka

```yaml
# Future: Dapr Pub/Sub Component
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "kafka:9092"
  - name: consumerGroup
    value: "feaf-group"
```

```typescript
// Future: Event publishing via Dapr
interface BoardEvent {
  eventType: 'BOARD_CREATED' | 'BOARD_UPDATED' | 'BOARD_DELETED';
  boardId: string;
  userId: string;
  referenceModel: ReferenceModelType;
  timestamp: Date;
  correlationId: string;
}

// Future: Publish event via Dapr SDK
async publishBoardEvent(event: BoardEvent) {
  await this.daprClient.pubsub.publish('pubsub', 'board-events', event);
}

// Future: Subscribe to events via Dapr
@DaprSubscribe('pubsub', 'board-events')
async handleBoardEvent(event: BoardEvent) {
  // Notify subscribed agents
  await this.agentOrchestrator.notifyAgents(event);
}
```

### Agent Registry with Dapr Service Invocation

**Future Addition**: Registry for managing AI agents with Dapr-based communication

```typescript
// Future: Agent model
interface Agent {
  id: string;
  name: string;
  category: 'strategic' | 'business' | 'data' | 'application' | 'infrastructure' | 'security';
  capabilities: string[];
  daprAppId: string;  // Dapr app-id for service invocation
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastSeen: Date;
}

// Future: Agent service using Dapr
class AgentService {
  constructor(private daprClient: DaprClient) {}
  
  async registerAgent(agent: Agent): Promise<void> {
    // Store agent metadata in Dapr state store
    await this.daprClient.state.save('statestore', [
      { key: `agent:${agent.id}`, value: agent }
    ]);
  }
  
  async invokeAgent(agentId: string, method: string, payload: any): Promise<any> {
    const agent = await this.getAgent(agentId);
    // Use Dapr service invocation with automatic retry and circuit breaking
    return await this.daprClient.invoker.invoke(
      agent.daprAppId,
      method,
      HttpMethod.POST,
      payload
    );
  }
  
  async checkHealth(agentId: string): Promise<boolean> {
    try {
      const agent = await this.getAgent(agentId);
      await this.daprClient.invoker.invoke(
        agent.daprAppId,
        'health',
        HttpMethod.GET
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

### Integration Patterns

**Future Addition**: Support for EIP patterns

```typescript
// Future: Integration pattern definitions
enum IntegrationPattern {
  REQUEST_REPLY = 'request-reply',
  EVENT_DRIVEN = 'event-driven',
  BATCH_CDC = 'batch-cdc',
  FILE_ETL = 'file-etl'
}

// Future: Message routing
class MessageRouter {
  async route(message: any, pattern: IntegrationPattern): Promise<void>;
  async transform(message: any, targetSchema: string): Promise<any>;
  async enrich(message: any, referenceData: any): Promise<any>;
}
```

### Workflow Orchestration

**Future Addition**: Multi-agent workflow engine

```typescript
// Future: Workflow definition
interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  sagaCompensations: CompensationStep[];
}

interface WorkflowStep {
  agentId: string;
  action: string;
  input: any;
  retryPolicy: RetryPolicy;
  timeout: number;
}

// Future: Orchestrator
class WorkflowOrchestrator {
  async executeWorkflow(workflow: Workflow, correlationId: string): Promise<WorkflowResult>;
  async compensate(workflowId: string, failedStep: number): Promise<void>;
}
```

### Schema Registry

**Future Addition**: Centralized schema management

```typescript
// Future: Schema registry
class SchemaRegistry {
  async registerSchema(name: string, schema: any, format: 'avro' | 'json' | 'protobuf'): Promise<string>;
  async validateCompatibility(name: string, newSchema: any): Promise<boolean>;
  async getSchema(name: string, version?: number): Promise<any>;
}
```

### Observability Enhancements with Dapr

**Current**: Dapr provides built-in distributed tracing with OpenTelemetry

Dapr automatically instruments all service-to-service calls, state operations, and pub/sub messages with distributed tracing. Traces are exported to Zipkin or other OpenTelemetry-compatible backends.

**Future Addition**: Custom application-level tracing

```typescript
// Future: Custom tracing spans
import { trace, context } from '@opentelemetry/api';

class TracedService {
  async processRequest(correlationId: string) {
    const span = trace.getTracer('feaf-backend').startSpan('process-request');
    span.setAttribute('correlation.id', correlationId);
    
    try {
      // Business logic
      // Dapr automatically correlates this with service invocation traces
      await this.doWork();
    } finally {
      span.end();
    }
  }
}
```

**Dapr Tracing Benefits**:
- Automatic trace propagation across service boundaries
- No code changes required for basic tracing
- Integration with Prometheus for metrics
- Support for multiple tracing backends (Zipkin, Jaeger, Application Insights)

## Security Considerations

### Service-to-Service Security with Dapr mTLS

- Automatic mutual TLS (mTLS) between all Dapr sidecars
- Certificate rotation handled by Dapr Sentry service
- Zero-trust security model for service communication
- No application code changes required for encryption

### Authentication

- JWT tokens with configurable expiration (default: 1 hour)
- Refresh token mechanism for extended sessions
- Secure password hashing with bcrypt (cost factor: 10)
- Rate limiting on authentication endpoints (5 attempts per minute)

### Authorization

- Role-based access control (RBAC) for future multi-tenancy
- Board ownership validation on all operations
- Cross-user access prevention

### Data Protection

- HTTPS/TLS for all external communication
- Kubernetes Secrets for sensitive configuration
- Database connection encryption
- Input sanitization to prevent SQL injection (handled by Prisma)
- XSS protection in React (automatic escaping)

### API Security

- CORS configuration for allowed origins
- Request size limits (10MB max)
- Rate limiting per user (100 requests per minute)
- API key authentication for future agent integration

### Future Security Enhancements

- Dapr access control policies for fine-grained authorization
- PII detection and masking
- Audit logging for compliance
- Data encryption at rest
- Security scanning in CI/CD pipeline
- Dapr secrets management for external secret stores (Azure Key Vault, AWS Secrets Manager)

## Performance Considerations

### Dapr Performance Optimizations

- gRPC protocol for low-latency service invocation
- Connection pooling managed by Dapr sidecars
- Built-in caching for service discovery
- Sidecar resource limits to prevent overhead (default: 0.5 CPU, 250Mi memory)

### Backend Performance

- Database connection pooling (Prisma default: 10 connections)
- Query optimization with proper indexes
- Pagination for list endpoints (default: 20 items per page)
- Caching for reference model definitions (in-memory)
- Async processing for export operations

### Frontend Performance

- Code splitting by route
- Lazy loading for board visualization
- Virtual scrolling for large component lists
- Debounced search input (300ms delay)
- Optimistic UI updates for better perceived performance

### Database Performance

- Indexes on foreign keys (userId, boardId, componentId)
- Indexes on search fields (board name, description)
- Composite indexes for common queries
- Regular VACUUM and ANALYZE operations
- Connection pooling to prevent exhaustion

### Scalability

- Horizontal scaling of frontend and backend pods
- Stateless backend design (session in JWT, not server memory)
- Database read replicas for future scaling
- CDN for frontend static assets
- Load balancing across pod replicas

## Monitoring and Observability

### Dapr Metrics

**Dapr Sidecar Metrics** (automatically exposed):
- `dapr_http_server_request_count`: HTTP requests handled by Dapr
- `dapr_http_server_request_duration_ms`: HTTP request latency
- `dapr_grpc_io_server_completed_rpcs`: gRPC calls completed
- `dapr_component_state_transaction_count`: State store operations
- `dapr_runtime_service_invocation_req_sent_total`: Service invocations sent
- `dapr_runtime_service_invocation_req_recv_total`: Service invocations received
- `dapr_runtime_service_invocation_res_sent_total`: Service invocation responses

### Prometheus Metrics

**Application Metrics**:
- `http_requests_total`: Counter of HTTP requests by method, path, status
- `http_request_duration_seconds`: Histogram of request duration
- `db_query_duration_seconds`: Histogram of database query duration
- `active_connections`: Gauge of active database connections
- `boards_total`: Gauge of total boards by reference model
- `components_total`: Gauge of total components by type
- `errors_total`: Counter of errors by type and severity

**System Metrics**:
- CPU usage per pod
- Memory usage per pod
- Pod restart count
- Network I/O

### Logging

**Structured Logging Format**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "feaf-backend",
  "message": "Board created",
  "context": {
    "userId": "uuid",
    "boardId": "uuid",
    "referenceModel": "PRM"
  }
}
```

**Log Levels**:
- ERROR: Application errors, exceptions
- WARN: Validation failures, deprecated API usage
- INFO: Business events (board created, user logged in)
- DEBUG: Detailed execution flow (development only)

### Alerting Rules

- Pod restart rate > 3 in 5 minutes
- Error rate > 5% of requests
- Database connection pool exhaustion
- API response time p95 > 1 second
- Disk usage > 80%
- Dapr sidecar unhealthy (sidecar not responding)
- Dapr service invocation failure rate > 10%
- Dapr state store operation latency > 500ms

## Conclusion

The k8s-feaf-dashboard design provides a solid foundation for FEAF board creation and management, with Dapr enabling robust service communication and clear extensibility points for future multi-agent integration and Enterprise Integration Patterns. The architecture emphasizes:

1. **User Experience**: Guided forms and intuitive visualization
2. **Reliability**: Dapr's built-in retries, circuit breakers, and health checks
3. **Scalability**: Stateless services with Dapr sidecar pattern and horizontal scaling
4. **Extensibility**: Dapr's service invocation, pub/sub, and bindings for future agent integration
5. **Observability**: Comprehensive metrics, logging, and automatic distributed tracing via Dapr
6. **Security**: Automatic mTLS encryption for all service-to-service communication

The dual testing approach (unit tests + property-based tests) ensures both specific behaviors and universal properties are validated, providing confidence in system correctness.

### Dapr Benefits Summary

- **Simplified Communication**: gRPC-based service invocation with automatic service discovery
- **Resilience**: Built-in retries, timeouts, and circuit breakers
- **Security**: Automatic mTLS without code changes
- **Observability**: Distributed tracing and metrics out of the box
- **Portability**: Abstract away infrastructure concerns (state stores, pub/sub, bindings)
- **Future-Ready**: Easy integration of new services and agents through Dapr components
