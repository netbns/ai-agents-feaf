# Implementation Plan: k8s-feaf-dashboard

## Overview

This implementation plan follows a bottom-up approach: infrastructure first, then database, backend services, and finally the frontend. Each step builds on the previous one, ensuring a solid foundation before adding complexity.

**Technology Stack**:
- Language: TypeScript
- Frontend: React 18+ with Tailwind CSS
- Backend: NestJS with Prisma ORM
- Database: PostgreSQL 15+
- Service Mesh: Dapr with gRPC
- Container Orchestration: Kubernetes
- Monitoring: Prometheus

## Tasks

### Phase 1: Kubernetes Infrastructure Setup

- [x] 1. Set up Kubernetes cluster and namespaces
  - Create namespace for the application
  - Set up RBAC roles and service accounts
  - Configure resource quotas
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8_

- [x] 2. Create ConfigMaps and Secrets
  - Create ConfigMap for non-sensitive configuration (API URLs, feature flags)
  - Create Secrets for sensitive data (database credentials, JWT secret)
  - Document secret management process
  - _Requirements: 12.1, 12.2, 12.4, 12.5_

- [x] 3. Set up persistent storage
  - Create PersistentVolumeClaim for PostgreSQL
  - Create PersistentVolumeClaim for Prometheus
  - Configure storage class and access modes
  - _Requirements: 10.3_

- [x] 4. Deploy PostgreSQL StatefulSet
  - Create PostgreSQL StatefulSet manifest
  - Configure persistent volume mounts
  - Set up database initialization scripts
  - Create ClusterIP service for database
  - Configure resource limits and requests
  - _Requirements: 10.3, 10.8_

- [x] 5. Verify database deployment
  - Test database connectivity from within cluster
  - Verify persistent storage is working
  - Check pod logs for errors
  - _Requirements: 10.3_

- [x] 6. Checkpoint - Ensure infrastructure is ready
  - Ensure all infrastructure components are running, ask the user if questions arise.

### Phase 1.5: Dapr Installation and Configuration

- [ ] 6A. Install Dapr on Kubernetes cluster
  - [x] 6A.1 Install Dapr CLI
    - Download and install Dapr CLI for local development
    - Verify Dapr CLI installation
    - _Requirements: 18.11_

  - [x] 6A.2 Initialize Dapr on Kubernetes
    - Run `dapr init -k` to install Dapr control plane
    - Verify Dapr Operator, Placement, and Sentry pods are running
    - Check Dapr system namespace (dapr-system)
    - _Requirements: 18.11_

  - [x] 6A.3 Create Dapr state store component
    - Create statestore.yaml for PostgreSQL state store
    - Configure connection string from Kubernetes Secret
    - Apply component to cluster
    - _Requirements: 19.1, 19.4_

  - [ ] 6A.4 Create Dapr resiliency configuration
    - Create resiliency.yaml with retry policies
    - Configure timeout policies for services and components
    - Configure circuit breaker policies
    - Apply resiliency configuration to cluster
    - _Requirements: 20.1, 20.2, 20.3_

  - [ ] 6A.5 Create Dapr configuration for tracing
    - Create configuration.yaml with tracing settings
    - Configure Zipkin endpoint (optional for MVP)
    - Enable mTLS for service-to-service communication
    - Configure access control policies
    - Apply configuration to cluster
    - _Requirements: 18.8, 21.1, 21.4_

  - [ ]* 6A.6 Verify Dapr installation
    - Test Dapr sidecar injection with sample app
    - Verify state store connectivity
    - Check Dapr dashboard (optional)
    - _Requirements: 18.11, 18.12_

- [ ] 6B. Checkpoint - Ensure Dapr is ready
  - Ensure Dapr control plane is running, components are configured, ask the user if questions arise.

### Phase 2: Backend Service Development

- [ ] 7. Initialize NestJS project
  - [~] 7.1 Create NestJS project with TypeScript
    - Initialize project with Nest CLI
    - Configure TypeScript compiler options
    - Set up project structure (modules, controllers, services)
    - Install core dependencies (NestJS, Prisma, JWT, bcrypt)
    - _Requirements: 8.1_

  - [~] 7.2 Configure Prisma ORM
    - Initialize Prisma with PostgreSQL provider
    - Create Prisma schema with User, Board, Component, Relationship, CrossBoardLink models
    - Configure database connection from environment variables
    - Generate Prisma Client
    - _Requirements: 7.1, 12.1_

  - [~] 7.3 Create database migrations
    - Generate initial migration from Prisma schema
    - Test migration on local database
    - Document migration process
    - _Requirements: 7.1_

  - [ ] 7.4 Install and configure Dapr SDK
    - Install @dapr/dapr package for Node.js
    - Create DaprClientService wrapper
    - Configure Dapr HTTP and gRPC ports from environment
    - Initialize Dapr client in NestJS module
    - _Requirements: 18.1, 18.3, 18.7_

  - [ ] 7.5 Create Dapr state management service
    - Create DaprStateService for state operations
    - Implement get, set, delete, and bulk operations
    - Add error handling and logging
    - Document when to use Dapr state vs Prisma
    - _Requirements: 19.2, 19.3, 19.4, 19.6_

  - [ ]* 7.6 Write unit tests for Dapr integration
    - Test Dapr client initialization
    - Test state operations with mock Dapr sidecar
    - Test error handling for Dapr failures
    - _Requirements: 18.3, 19.2_

- [ ] 8. Implement Authentication Module
  - [~] 8.1 Create User model and authentication service
    - Implement user registration with password hashing (bcrypt)
    - Implement login with JWT token generation
    - Create JWT strategy for token validation
    - Implement password hashing verification
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 8.2 Write property test for authentication
    - **Property 1: Authentication Token Generation**
    - **Validates: Requirements 1.1, 1.3**

  - [ ]* 8.3 Write property test for invalid credentials
    - **Property 2: Invalid Credentials Rejection**
    - **Validates: Requirements 1.2**

  - [ ]* 8.4 Write property test for password hashing
    - **Property 3: Password Hashing**
    - **Validates: Requirements 1.5**

  - [~] 8.5 Create authentication guards
    - Implement JwtAuthGuard for protecting routes
    - Add token expiration handling
    - _Requirements: 1.3, 1.4_

  - [ ]* 8.6 Write unit tests for authentication edge cases
    - Test expired token rejection
    - Test malformed token handling
    - Test missing authentication header
    - _Requirements: 1.4_

- [ ] 9. Implement Reference Model Module
  - [~] 9.1 Create reference model service
    - Define all six FEAF reference models (PRM, BRM, DRM, ARM, IRM, SRM)
    - Implement endpoint to list all reference models
    - Include descriptions and allowed component types for each model
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 9.2 Write unit test for reference model listing
    - Test that all six models are returned
    - Test that each model has required fields
    - _Requirements: 2.7_

- [ ] 10. Implement Board Module
  - [~] 10.1 Create Board DTOs and validation
    - CreateBoardDto with validation (name required, non-empty, reference model enum)
    - UpdateBoardDto with optional fields
    - BoardFilterDto for search and filtering
    - _Requirements: 3.1, 3.2, 14.1, 14.2_

  - [~] 10.2 Create Board service with CRUD operations
    - Implement create board (associate with user, persist to database)
    - Implement get user's boards (filter by user ID)
    - Implement get board by ID (with ownership check)
    - Implement update board (name, description)
    - Implement delete board (cascade delete components and relationships)
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 10.3 Write property test for board persistence
    - **Property 4: Board Persistence Round Trip**
    - **Validates: Requirements 3.1, 3.4**

  - [ ]* 10.4 Write property test for empty name rejection
    - **Property 5: Empty Board Name Rejection**
    - **Validates: Requirements 3.2**

  - [ ]* 10.5 Write property test for board ownership
    - **Property 6: Board Ownership and Isolation**
    - **Validates: Requirements 3.3, 3.6**

  - [ ]* 10.6 Write property test for cascade deletion
    - **Property 7: Cascade Deletion**
    - **Validates: Requirements 3.5, 5.3, 6A.4**

  - [~] 10.7 Create Board controller
    - GET /boards (list user's boards with filtering)
    - POST /boards (create board)
    - GET /boards/:id (get board details)
    - PATCH /boards/:id (update board)
    - DELETE /boards/:id (delete board)
    - Add JwtAuthGuard to all endpoints
    - _Requirements: 8.1, 8.2_

  - [ ]* 10.8 Write unit tests for board controller
    - Test unauthorized access returns 401
    - Test accessing other user's board returns 403
    - Test deleting non-existent board returns 404
    - _Requirements: 3.3_

- [ ] 11. Implement Component Module
  - [~] 11.1 Create Component DTOs with reference model validation
    - Base CreateComponentDto with common fields
    - PRMComponentDto with KPI-specific properties
    - BRMComponentDto with business function properties
    - DRMComponentDto with data entity properties
    - ARMComponentDto with application properties
    - IRMComponentDto with infrastructure properties
    - SRMComponentDto with security control properties
    - Validation for component type matching board type
    - _Requirements: 4.1, 4.2, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 5A.1, 5A.2, 5A.3, 5A.4, 5A.5, 5A.6, 5A.7_

  - [~] 11.2 Create Component service with CRUD operations
    - Implement create component (validate type, persist with properties JSON)
    - Implement get components for board
    - Implement get component by ID
    - Implement update component (properties, position)
    - Implement delete component (cascade delete relationships)
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 6.4_

  - [ ]* 11.3 Write property test for component persistence
    - **Property 8: Component Persistence Round Trip**
    - **Validates: Requirements 4.1, 4.3**

  - [ ]* 11.4 Write property test for component validation
    - **Property 9: Component Validation**
    - **Validates: Requirements 4.2**

  - [ ]* 11.5 Write property test for component query completeness
    - **Property 10: Component Query Completeness**
    - **Validates: Requirements 4.5**

  - [ ]* 11.6 Write property test for reference model validation
    - **Property 11: Reference Model Component Type Validation**
    - **Validates: Requirements 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12**

  - [ ]* 11.7 Write property test for reference model properties
    - **Property 12: Reference Model Property Validation**
    - **Validates: Requirements 5A.2, 5A.3, 5A.4, 5A.5, 5A.6, 5A.7, 5A.8**

  - [~] 11.8 Create Component controller
    - GET /boards/:boardId/components (list components)
    - POST /boards/:boardId/components (create component)
    - GET /components/:id (get component details)
    - PATCH /components/:id (update component)
    - DELETE /components/:id (delete component)
    - Add ownership validation (board belongs to user)
    - _Requirements: 8.1_

  - [ ]* 11.9 Write unit tests for component edge cases
    - Test creating component on non-existent board
    - Test creating component with invalid type for board
    - Test updating component with invalid properties
    - _Requirements: 4.2, 4.6_

- [ ] 12. Implement Relationship Module
  - [~] 12.1 Create Relationship DTOs and service
    - CreateRelationshipDto with validation (both components on same board)
    - Implement create relationship (validate same board constraint)
    - Implement get relationships for board
    - Implement delete relationship
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]* 12.2 Write property test for relationship persistence
    - **Property 13: Relationship Persistence Round Trip**
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 12.3 Write property test for cross-board rejection
    - **Property 14: Cross-Board Relationship Rejection**
    - **Validates: Requirements 5.2**

  - [~] 12.4 Create Relationship controller
    - GET /boards/:boardId/relationships (list relationships)
    - POST /relationships (create relationship)
    - DELETE /relationships/:id (delete relationship)
    - _Requirements: 5.5, 8.1_

  - [ ]* 12.5 Write unit tests for relationship types
    - Test all relationship types (DEPENDS_ON, COMMUNICATES_WITH, CONTAINS, SUPPORTS, IMPLEMENTS)
    - _Requirements: 5.5_

- [ ] 13. Implement Cross-Board Link Module
  - [~] 13.1 Create CrossBoardLink service
    - Implement create cross-board link (validate semantic meaning)
    - Implement get cross-board links for component
    - Implement delete cross-board link
    - Validate link types (e.g., BRM to ARM is valid)
    - _Requirements: 6A.1, 6A.2, 6A.6_

  - [ ]* 13.2 Write property test for cross-board link persistence
    - **Property 15: Cross-Board Link Persistence**
    - **Validates: Requirements 6A.1, 6A.3**

  - [ ]* 13.3 Write property test for semantic validation
    - **Property 16: Cross-Board Link Semantic Validation**
    - **Validates: Requirements 6A.6**

  - [~] 13.4 Create CrossBoardLink controller
    - POST /cross-board-links (create link)
    - GET /cross-board-links/:componentId (get links for component)
    - DELETE /cross-board-links/:id (delete link)
    - _Requirements: 6A.1, 6A.3_

- [ ] 14. Implement Search and Export Features
  - [~] 14.1 Add search functionality to Board service
    - Implement case-insensitive search on name and description
    - Implement filtering by reference model type
    - Implement result ordering by relevance
    - _Requirements: 14.1, 14.2, 14.4, 14.5_

  - [ ]* 14.2 Write property test for search functionality
    - **Property 21: Search Functionality**
    - **Validates: Requirements 14.1, 14.2, 14.4**

  - [ ]* 14.3 Write property test for search ordering
    - **Property 22: Search Result Ordering**
    - **Validates: Requirements 14.5**

  - [~] 14.4 Implement board export functionality
    - Create export service for JSON format
    - Create export service for CSV format
    - Include all components and relationships in export
    - _Requirements: 13.1, 13.2, 13.5_

  - [ ]* 14.5 Write property test for export completeness
    - **Property 20: Board Export Completeness**
    - **Validates: Requirements 13.1, 13.2**

  - [~] 14.6 Add export endpoint to Board controller
    - GET /boards/:id/export?format=json|csv
    - _Requirements: 13.1_

- [ ] 15. Implement Health Check and Metrics
  - [~] 15.1 Create Health module
    - Implement /health/liveness endpoint (always returns 200)
    - Implement /health/readiness endpoint (checks database connection)
    - Return 503 when database is unreachable
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 15.2 Write unit tests for health endpoints
    - Test liveness always returns 200
    - Test readiness returns 200 when DB is up
    - Test readiness returns 503 when DB is down
    - _Requirements: 11.1, 11.2, 11.3_

  - [~] 15.3 Implement Prometheus metrics
    - Install @willsoto/nestjs-prometheus
    - Expose /metrics endpoint
    - Track HTTP request count, duration, status codes
    - Track database query duration
    - Track active connections
    - Track board and component counts by type
    - Track error counts by type
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 15.4 Write unit test for metrics endpoint
    - Test /metrics returns Prometheus format
    - Test required metrics are present
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 16. Implement Error Handling and Logging
  - [~] 16.1 Create global exception filter
    - Catch all exceptions and format consistently
    - Return appropriate HTTP status codes
    - Sanitize error messages in production
    - Log errors with timestamp, severity, context
    - _Requirements: 8.3, 15.1, 15.2_

  - [ ]* 16.2 Write property test for error logging
    - **Property 23: Error Logging Completeness**
    - **Validates: Requirements 15.1, 15.3**

  - [ ]* 16.3 Write property test for error sanitization
    - **Property 24: Error Response Sanitization**
    - **Validates: Requirements 15.2, 15.4**

  - [~] 16.2 Configure structured logging
    - Install winston logger
    - Configure log format (JSON with timestamp, level, service, context)
    - Log all API requests with method, path, response time
    - Emit alert metrics for critical errors
    - _Requirements: 15.1, 15.3, 15.5_

  - [ ]* 16.5 Write unit tests for logging
    - Test request logging includes required fields
    - Test error logging includes stack trace in development
    - Test error logging excludes stack trace in production
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 17. Implement API Documentation
  - [~] 17.1 Set up Swagger/OpenAPI
    - Install @nestjs/swagger
    - Configure Swagger module
    - Add API decorators to all controllers
    - Document request/response schemas
    - Document authentication requirements
    - _Requirements: 8.5_

  - [ ]* 17.2 Write unit test for Swagger endpoint
    - Test /api/docs returns Swagger UI
    - Test OpenAPI spec is valid JSON
    - _Requirements: 8.5_

- [ ] 18. Implement Database Transactions
  - [~] 18.1 Add transaction support to services
    - Wrap multi-entity operations in Prisma transactions
    - Implement rollback on failure
    - Test transaction atomicity
    - _Requirements: 7.3, 7.4_

  - [ ]* 18.2 Write property test for transaction atomicity
    - **Property 18: Transaction Atomicity**
    - **Validates: Requirements 7.3, 7.4**

- [~] 19. Create Backend Dockerfile
  - Create multi-stage Dockerfile for NestJS
  - Install dependencies and build TypeScript
  - Install Dapr SDK dependencies
  - Configure production environment
  - Expose port 3000 (HTTP) and 50001 (gRPC for Dapr)
  - _Requirements: 10.2, 18.7_

- [~] 20. Deploy Backend to Kubernetes with Dapr
  - Create Backend Deployment manifest (2 replicas)
  - Add Dapr annotations for sidecar injection
  - Configure Dapr app-id, app-port, and app-protocol (grpc)
  - Configure environment variables from ConfigMap and Secrets
  - Add Dapr HTTP and gRPC port environment variables
  - Set resource limits and requests
  - Configure liveness and readiness probes
  - Create ClusterIP Service
  - Add Prometheus scrape annotations
  - _Requirements: 10.2, 10.6, 10.8, 11.1, 11.2, 11.5, 11.6, 18.7, 18.8, 18.10, 18.12_

- [~] 21. Checkpoint - Ensure backend is working
  - Ensure all backend tests pass, API is accessible, ask the user if questions arise.

### Phase 3: Frontend Development

- [ ] 22. Initialize React project with Tailwind CSS
  - [~] 22.1 Create React project with TypeScript
    - Initialize project with Create React App or Vite
    - Configure TypeScript
    - Install React Router for routing
    - Install Axios for API calls
    - _Requirements: 8.1_

  - [~] 22.2 Set up Tailwind CSS
    - Install Tailwind CSS and dependencies
    - Configure tailwind.config.js
    - Add Tailwind directives to CSS
    - Set up custom theme colors for FEAF reference models
    - _Requirements: 6.1, 6.2_

  - [~] 22.3 Create project structure
    - Set up folder structure (components, pages, services, hooks, types)
    - Create API client service with Axios
    - Configure Dapr service invocation URL
    - Configure environment variables for Dapr endpoints
    - _Requirements: 12.3, 18.1_

  - [ ] 22.4 Install and configure Dapr SDK for frontend
    - Install @dapr/dapr package for browser
    - Create Dapr service invocation wrapper
    - Configure Dapr HTTP endpoint (localhost:3500)
    - Update API client to use Dapr service invocation
    - _Requirements: 18.1_

  - [ ]* 22.5 Write unit tests for Dapr service invocation
    - Test Dapr client initialization
    - Test service invocation with mock responses
    - Test error handling
    - _Requirements: 18.1_

- [ ] 23. Implement Authentication UI
  - [~] 23.1 Create authentication context and hooks
    - Create AuthContext for managing auth state
    - Create useAuth hook for accessing auth state
    - Implement login, logout, and token storage
    - Implement protected route component
    - _Requirements: 1.1, 1.2, 1.4_

  - [~] 23.2 Create Login page
    - Create login form with email and password fields
    - Add form validation (required fields, email format)
    - Display error messages for invalid credentials
    - Redirect to dashboard on successful login
    - Style with Tailwind CSS
    - _Requirements: 1.1, 1.2_

  - [ ]* 23.3 Write unit tests for login component
    - Test form validation
    - Test error message display
    - Test successful login redirect
    - _Requirements: 1.1, 1.2_

- [ ] 24. Implement Board Management UI
  - [~] 24.1 Create Board List page
    - Fetch and display user's boards
    - Show board cards with name, reference model, description
    - Add search input with debouncing
    - Add filter dropdown for reference model types
    - Add "Create Board" button
    - Style with Tailwind CSS (grid layout, cards)
    - _Requirements: 3.3, 14.1, 14.2_

  - [ ]* 24.2 Write property test for board list rendering
    - **Property 1: Board List Completeness**
    - Test that all boards are rendered
    - _Requirements: 3.3_

  - [~] 24.3 Create Board Card component
    - Display board name, reference model badge, description
    - Add action buttons (view, edit, delete)
    - Add confirmation dialog for delete
    - Style with Tailwind CSS (hover effects, badges)
    - _Requirements: 3.3, 3.5_

  - [~] 24.4 Create Create Board Modal
    - Create modal with board name input
    - Add reference model selector (6 options with descriptions)
    - Add description textarea
    - Implement form validation
    - Call API to create board
    - Close modal and refresh list on success
    - Style with Tailwind CSS (modal overlay, form)
    - _Requirements: 3.1, 3.2_

  - [ ]* 24.5 Write unit tests for board creation
    - Test empty name validation
    - Test successful board creation
    - Test error handling
    - _Requirements: 3.1, 3.2_

- [ ] 25. Implement Reference Model Forms
  - [~] 25.1 Create base FormField component
    - Reusable form field with label, input, help text, error message
    - Support different input types (text, number, select, textarea)
    - Display inline validation errors
    - Style with Tailwind CSS
    - _Requirements: 17.1, 17.2_

  - [~] 25.2 Create PRM Form component
    - Form fields: KPI name, target value, actual value, measurement unit, measurement frequency
    - Add help text for each field
    - Add example values
    - Implement validation (required fields, number types)
    - _Requirements: 16.1, 17.1, 17.4, 17.5_

  - [~] 25.3 Create BRM Form component
    - Form fields: business function name, service level, stakeholder, function category
    - Add help text and examples
    - Implement validation
    - _Requirements: 16.2, 17.1, 17.4, 17.5_

  - [~] 25.4 Create DRM Form component
    - Form fields: data entity name, classification level, format specification, governance rules
    - Add help text and examples
    - Implement validation
    - _Requirements: 16.3, 17.1, 17.4, 17.5_

  - [~] 25.5 Create ARM Form component
    - Form fields: application name, vendor, version, hosting model, integration points
    - Add help text and examples
    - Implement validation
    - _Requirements: 16.4, 17.1, 17.4, 17.5_

  - [~] 25.6 Create IRM Form component
    - Form fields: infrastructure element name, type, capacity, location, maintenance schedule
    - Add help text and examples
    - Implement validation
    - _Requirements: 16.5, 17.1, 17.4, 17.5_

  - [~] 25.7 Create SRM Form component
    - Form fields: security control name, framework reference, risk level, compliance status
    - Add help text and examples
    - Implement validation
    - _Requirements: 16.6, 17.1, 17.4, 17.5_

  - [ ]* 25.8 Write property test for form validation
    - **Property 25: Form Validation**
    - **Validates: Requirements 16.7, 17.2, 17.3, 17.5**

  - [ ]* 25.9 Write property test for form fields
    - **Property 26: Reference Model Form Fields**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**

  - [ ]* 25.10 Write property test for help text
    - **Property 27: Form Help Text Presence**
    - **Validates: Requirements 17.1, 17.4**

- [ ] 26. Implement Board Visualization
  - [~] 26.1 Install and configure React Flow
    - Install react-flow-renderer
    - Create BoardCanvas component
    - Configure node and edge types
    - Set up zoom and pan controls
    - _Requirements: 6.1, 6.2, 6.5_

  - [~] 26.2 Create ComponentNode component
    - Display component name and type
    - Style based on reference model (different colors)
    - Make draggable
    - Show component details on click
    - Style with Tailwind CSS
    - _Requirements: 6.1, 6.3_

  - [~] 26.3 Create RelationshipEdge component
    - Display relationship type as edge label
    - Style based on relationship type
    - Add arrow markers
    - _Requirements: 6.2_

  - [~] 26.4 Implement drag-and-drop positioning
    - Handle node drag events
    - Update component position in state
    - Persist position to backend on drag end
    - _Requirements: 6.3, 6.4_

  - [ ]* 26.5 Write property test for position persistence
    - **Property 17: Component Position Persistence**
    - **Validates: Requirements 6.4**

  - [~] 26.6 Create BoardToolbar component
    - Add zoom in/out buttons
    - Add fit view button
    - Add export button
    - Add "Add Component" button
    - Style with Tailwind CSS
    - _Requirements: 6.5, 13.3_

  - [~] 26.7 Create ComponentDetailsPanel
    - Display component properties in side panel
    - Show cross-board links
    - Add edit and delete buttons
    - Style with Tailwind CSS (slide-in panel)
    - _Requirements: 6A.3_

- [ ] 27. Implement Component Management UI
  - [~] 27.1 Create Add Component Modal
    - Select component type based on board reference model
    - Show appropriate form (PRM/BRM/DRM/ARM/IRM/SRM)
    - Validate form before submission
    - Call API to create component
    - Add component to canvas on success
    - _Requirements: 4.1, 4.2, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [~] 27.2 Create Edit Component Modal
    - Pre-fill form with existing component data
    - Allow editing all properties
    - Validate and submit changes
    - Update canvas on success
    - _Requirements: 4.3_

  - [~] 27.3 Create Relationship Creation UI
    - Add "Create Relationship" mode to canvas
    - Allow selecting two components
    - Show relationship type selector
    - Create relationship via API
    - Display new edge on canvas
    - _Requirements: 5.1, 5.5_

  - [~] 27.4 Create Cross-Board Link UI
    - Add "Link to Another Board" button in component details
    - Show modal to select target board and component
    - Validate semantic meaning
    - Create cross-board link via API
    - Display link in component details panel
    - _Requirements: 6A.1, 6A.2, 6A.6_

- [ ] 28. Implement Search and Export UI
  - [~] 28.1 Add search functionality to Board List
    - Implement search input with debouncing (300ms)
    - Highlight matching text in results
    - Show "No results" message when empty
    - _Requirements: 14.1, 14.3, 14.4_

  - [~] 28.2 Implement board export
    - Add export button to board toolbar
    - Show format selector (JSON/CSV)
    - Trigger download on export
    - Show success message
    - _Requirements: 13.1, 13.3, 13.5_

- [ ] 29. Implement Error Handling UI
  - [~] 29.1 Create ErrorBoundary component
    - Catch React errors
    - Display user-friendly error message
    - Log errors to console
    - Provide "Reload" button
    - _Requirements: 15.4_

  - [~] 29.2 Create Toast notification system
    - Install react-hot-toast or similar
    - Show success messages for actions
    - Show error messages from API
    - Style with Tailwind CSS
    - _Requirements: 15.4_

  - [~] 29.3 Add loading states
    - Show loading spinners during API calls
    - Disable buttons during submission
    - Show skeleton loaders for lists
    - _Requirements: 15.4_

- [~] 30. Create Frontend Dockerfile
  - Create multi-stage Dockerfile for React
  - Build production bundle
  - Install Dapr SDK dependencies
  - Serve with nginx
  - Configure nginx for SPA routing and Dapr proxy
  - Expose port 80
  - _Requirements: 10.1, 18.1_

- [~] 31. Deploy Frontend to Kubernetes with Dapr
  - Create Frontend Deployment manifest (2 replicas)
  - Add Dapr annotations for sidecar injection
  - Configure Dapr app-id and app-port
  - Configure environment variables for Dapr service invocation
  - Set resource limits and requests
  - Configure liveness and readiness probes
  - Create LoadBalancer Service
  - _Requirements: 10.1, 10.5, 10.8, 11.4, 18.1, 18.10, 18.12_

- [~] 32. Checkpoint - Ensure frontend is working
  - Ensure all frontend tests pass, UI is accessible, ask the user if questions arise.

### Phase 4: Monitoring and Observability

- [ ] 33. Deploy Prometheus
  - [~] 33.1 Create Prometheus ConfigMap
    - Configure scrape targets (backend pods)
    - Set scrape interval (15s)
    - Configure retention period
    - _Requirements: 9.2_

  - [~] 33.2 Create Prometheus Deployment
    - Deploy Prometheus with ConfigMap
    - Configure persistent storage
    - Set resource limits
    - Create ClusterIP Service
    - _Requirements: 10.4_

  - [~] 33.3 Verify metrics collection
    - Access Prometheus UI
    - Verify backend metrics are being scraped
    - Test sample queries
    - _Requirements: 9.2, 9.3, 9.4_

- [ ] 34. Configure Alerting (Optional)
  - Create AlertManager configuration
  - Define alert rules (error rate, pod restarts, response time)
  - Configure notification channels
  - _Requirements: 15.5_

- [~] 35. Final checkpoint - End-to-end testing with Dapr
  - Test complete user workflow: login → create board → add components → visualize → export
  - Verify all health checks are passing
  - Verify Dapr sidecars are running alongside application pods
  - Verify Dapr service invocation is working (check logs for gRPC calls)
  - Verify Dapr state operations are working
  - Verify Dapr metrics are being collected by Prometheus
  - Verify Dapr distributed tracing (if Zipkin is configured)
  - Verify mTLS is enabled between services
  - Verify logs are structured correctly
  - Ask the user if questions arise.
  - _Requirements: 18.1, 18.5, 18.7, 18.8, 18.9, 18.10, 19.2, 21.1, 21.5, 21.6_

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation follows infrastructure-first approach: Kubernetes → Dapr → Database → Backend → Frontend → Monitoring
- Dapr provides service invocation, state management, resiliency, and observability out of the box
- gRPC is used for high-performance service-to-service communication via Dapr
- Tailwind CSS is used for all frontend styling
- TypeScript is used throughout for type safety
- Completed infrastructure tasks (1-6) remain unchanged and are marked as complete
