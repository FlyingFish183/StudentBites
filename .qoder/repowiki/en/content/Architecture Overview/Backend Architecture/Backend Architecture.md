# Backend Architecture

<cite>
**Referenced Files in This Document**
- [main.ts](file://Backend/src/main.ts)
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
- [StatsService.ts](file://Backend/src/services/StatsService.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [express-types.ts](file://Backend/src/routes/common/express-types.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)
- [Paths.ts](file://Backend/src/common/constants/Paths.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the backend architecture of the Express.js server for the StudentBite application. It explains the layered design with routes, services, repositories, and database access, along with middleware configuration, error handling strategies, authentication flow, service layer design, dependency injection patterns, and module organization. The goal is to make the system understandable for both technical and non-technical readers while providing concrete references to source files.

## Project Structure
The backend follows a clear separation of concerns:
- Routes: HTTP endpoints that parse requests and delegate to services.
- Services: Business logic and orchestration, independent of HTTP concerns.
- Repositories: Data access abstractions over Prisma or mock implementations.
- Common utilities: Validation, constants, error helpers, and shared types.
- Configuration: Environment variables and app bootstrap.

```mermaid
graph TB
subgraph "HTTP Layer"
API["apiRouter.ts"]
AR["AuthRoutes.ts"]
UR["UserRoutes.ts"]
PR["PlannerRoutes.ts"]
PROF["ProfileRoutes.ts"]
SR["StoreRoutes.ts"]
LR["LogRoutes.ts"]
end
subgraph "Business Layer"
AS["AuthService.ts"]
US["UserService.ts"]
PS["PlannerService.ts"]
PFS["ProfileService.ts"]
SS["StoreService.ts"]
LS["LogService.ts"]
STS["StatsService.ts"]
PA["planner-algorithm.ts"]
end
subgraph "Data Access Layer"
URepo["UserRepo.ts"]
MockORM["MockOrm.ts"]
PrismaClient["prisma.ts"]
Schema["schema.prisma"]
end
subgraph "Common"
AuthMW["auth.ts"]
ParseReq["parseReq.ts"]
Types["express-types.ts"]
RouteErr["route-errors.ts"]
Validators["validators.ts"]
HttpStatus["HttpStatusCodes.ts"]
Paths["Paths.ts"]
Env["env.ts"]
end
API --> AR
API --> UR
API --> PR
API --> PROF
API --> SR
API --> LR
AR --> AS
UR --> US
PR --> PS
PR --> PA
PROF --> PFS
SR --> SS
LR --> LS
PS --> STS
AS --> URepo
US --> URepo
PFS --> URepo
SS --> URepo
LS --> URepo
STS --> URepo
URepo --> PrismaClient
URepo --> MockORM
PrismaClient --> Schema
```

**Diagram sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
- [StatsService.ts](file://Backend/src/services/StatsService.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [express-types.ts](file://Backend/src/routes/common/express-types.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)
- [Paths.ts](file://Backend/src/common/constants/Paths.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

**Section sources**
- [main.ts](file://Backend/src/main.ts)
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)

## Core Components
- Application bootstrap: Initializes environment, configures Express, registers middleware, mounts routers, and starts the server.
- Router composition: Central router aggregates feature-specific routers under defined paths.
- Middleware: Authentication guard, request parsing, validation, and error formatting.
- Services: Encapsulate business rules, coordinate multiple repositories, and return domain objects.
- Repositories: Abstract data operations behind interfaces; implement Prisma-based persistence and a mock ORM for tests.
- Database schema: Single source of truth for models and relations via Prisma.

Key responsibilities:
- Routes: Validate inputs, call services, format responses.
- Services: Implement use cases (e.g., login, user management, planning, store operations).
- Repositories: Provide CRUD and query methods; hide SQL/Prisma details from services.
- Common: Shared utilities, constants, and type definitions.

**Section sources**
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)
- [Paths.ts](file://Backend/src/common/constants/Paths.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

## Architecture Overview
The backend uses a layered architecture:
- HTTP Layer (routes) handles routing, input parsing, and response formatting.
- Service Layer encapsulates business logic and orchestrates repository calls.
- Repository Layer abstracts data access using Prisma or a mock implementation.
- Common utilities provide cross-cutting concerns like validation and error mapping.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Express as "Express App"
participant Router as "Feature Router"
participant Service as "Service"
participant Repo as "Repository"
participant DB as "Prisma/DB"
Client->>Express : HTTP Request
Express->>Router : Match route
Router->>Router : Parse & validate request
Router->>Service : Invoke business method
Service->>Repo : Data operation(s)
Repo->>DB : Query/mutation
DB-->>Repo : Result
Repo-->>Service : Domain object(s)
Service-->>Router : Use-case result
Router-->>Client : JSON Response
```

**Diagram sources**
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

## Detailed Component Analysis

### HTTP Layer: Routers and Middleware
- Central router composes feature routers under base paths.
- Feature routers define endpoints for auth, users, planner, profile, stores, and logs.
- Common middleware includes authentication guards, request parsing, and validation helpers.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Parse["Parse Request Body/Params"]
Parse --> Validate{"Validation Pass?"}
Validate --> |No| Err["Format Error Response"]
Validate --> |Yes| Guard{"Auth Required?"}
Guard --> |Yes| CheckAuth["Verify Token/Session"]
Guard --> |No| RouteHandler["Route Handler"]
CheckAuth --> |Fail| Err
CheckAuth --> |Pass| RouteHandler
RouteHandler --> ServiceCall["Call Service"]
ServiceCall --> Success["Return JSON Response"]
Err --> End(["End"])
Success --> End
```

**Diagram sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)

**Section sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)

### Service Layer: Business Logic and Orchestration
Services implement domain use cases:
- AuthService: Handles registration, login, token issuance, and session management.
- UserService: Manages user profiles, preferences, and related data.
- PlannerService: Coordinates meal planning algorithms and data retrieval.
- ProfileService: Handles profile updates and avatar/media metadata.
- StoreService: Integrates with store data sources and caching.
- LogService: Records audit and diagnostic logs.
- StatsService: Aggregates metrics and analytics.

```mermaid
classDiagram
class AuthService {
+register(data)
+login(credentials)
+refreshToken(token)
+logout(userId)
}
class UserService {
+getById(id)
+updateProfile(id, data)
+listUsers(filters)
}
class PlannerService {
+generatePlan(userId, constraints)
+updatePlan(planId, changes)
}
class ProfileService {
+getProfile(userId)
+uploadAvatar(userId, file)
}
class StoreService {
+fetchStores(query)
+syncStoreData()
}
class LogService {
+info(msg, meta)
+error(msg, err)
}
class StatsService {
+getUserStats(userId)
+aggregateMetrics(timeframe)
}
AuthService --> UserService : "uses"
PlannerService --> StatsService : "reads"
PlannerService --> UserService : "reads"
ProfileService --> UserService : "updates"
StoreService --> LogService : "logs"
```

**Diagram sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
- [StatsService.ts](file://Backend/src/services/StatsService.ts)

**Section sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
- [StatsService.ts](file://Backend/src/services/StatsService.ts)

### Repository Layer: Data Abstraction
Repositories abstract data operations:
- UserRepo: Provides user-related queries and mutations.
- MockOrm: In-memory implementation used in tests.
- prisma.ts: Prisma client initialization and connection management.

```mermaid
classDiagram
class UserRepo {
+create(user)
+findById(id)
+findByEmail(email)
+update(id, data)
+delete(id)
}
class MockOrm {
+users : Array
+findUserByEmail(email)
+saveUser(user)
}
class PrismaClient {
+connect()
+disconnect()
+user()
}
UserRepo ..> PrismaClient : "uses"
UserRepo ..> MockOrm : "fallback for tests"
```

**Diagram sources**
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

**Section sources**
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

### Database Schema and Models
- Prisma schema defines entities, relations, and constraints.
- Migrations manage schema evolution.
- Seed script populates initial data.

```mermaid
erDiagram
USER {
uuid id PK
string email UK
string password
string name
timestamp created_at
timestamp updated_at
}
STORE {
uuid id PK
string name
string address
float latitude
float longitude
}
PLAN {
uuid id PK
uuid user_id FK
timestamp date
json plan_data
}
LOG {
uuid id PK
uuid user_id FK
string level
text message
json meta
timestamp created_at
}
USER ||--o{ PLAN : creates
USER ||--o{ LOG : generates
```

**Diagram sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)

### Authentication Flow
Authentication is implemented via middleware and service methods:
- Routes protect endpoints using an auth guard.
- AuthService validates credentials and issues tokens.
- Tokens are verified on subsequent requests.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoute as "AuthRoutes"
participant AuthSvc as "AuthService"
participant Repo as "UserRepo"
participant DB as "Database"
Client->>AuthRoute : POST /auth/login
AuthRoute->>AuthSvc : login(credentials)
AuthSvc->>Repo : findByEmail(email)
Repo->>DB : query user
DB-->>Repo : user record
Repo-->>AuthSvc : user record
AuthSvc->>AuthSvc : verifyPassword(password)
AuthSvc-->>AuthRoute : token payload
AuthRoute-->>Client : {token, user}
Client->>AuthRoute : GET /protected (with token)
AuthRoute->>AuthRoute : verify token middleware
AuthRoute-->>Client : protected data
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)

### Dependency Injection Patterns
- Services receive dependencies through constructor parameters or factory functions.
- Repositories are injected into services to decouple business logic from data access.
- Test environments can swap real repositories with mocks.

```mermaid
graph TB
DI["Dependency Injection Container"]
SvcA["AuthService"]
SvcB["UserService"]
Repo["UserRepo"]
Mock["MockOrm"]
DI --> SvcA
DI --> SvcB
SvcA --> Repo
SvcB --> Repo
Repo --> Mock
```

**Diagram sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)

**Section sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)

### Module Organization
- Routes grouped by feature with shared common utilities.
- Services encapsulated per domain area.
- Repositories abstracted per entity with consistent interfaces.
- Constants and validators centralized for reuse.

```mermaid
graph TB
Routes["routes/*"]
Services["services/*"]
Repos["repos/*"]
Common["common/*"]
Config["config/*"]
Prisma["prisma/*"]
Routes --> Services
Services --> Repos
Routes --> Common
Services --> Common
Repos --> Prisma
Config --> Routes
```

**Diagram sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

## Dependency Analysis
The following diagram shows key dependencies between modules:

```mermaid
graph TB
API["apiRouter.ts"]
AR["AuthRoutes.ts"]
UR["UserRoutes.ts"]
PR["PlannerRoutes.ts"]
PROF["ProfileRoutes.ts"]
SR["StoreRoutes.ts"]
LR["LogRoutes.ts"]
AS["AuthService.ts"]
US["UserService.ts"]
PS["PlannerService.ts"]
PFS["ProfileService.ts"]
SS["StoreService.ts"]
LS["LogService.ts"]
STS["StatsService.ts"]
URepo["UserRepo.ts"]
Mock["MockOrm.ts"]
Prisma["prisma.ts"]
API --> AR
API --> UR
API --> PR
API --> PROF
API --> SR
API --> LR
AR --> AS
UR --> US
PR --> PS
PROF --> PFS
SR --> SS
LR --> LS
PS --> STS
AS --> URepo
US --> URepo
PFS --> URepo
SS --> URepo
LS --> URepo
STS --> URepo
URepo --> Prisma
URepo --> Mock
```

**Diagram sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
- [StatsService.ts](file://Backend/src/services/StatsService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

**Section sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

## Performance Considerations
- Connection pooling: Ensure Prisma client is reused across requests to minimize overhead.
- Caching: Introduce in-memory or external cache for frequently accessed data (e.g., store listings).
- Pagination: Apply pagination on list endpoints to reduce payload size.
- Validation: Keep validation lightweight and close to input boundaries.
- Logging: Use structured logging with sampling for high-volume endpoints.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: Verify token presence, expiration, and secret configuration.
- Validation errors: Check request payloads against validators and ensure required fields.
- Database connectivity: Confirm environment variables and Prisma connection strings.
- Error formatting: Use centralized error utilities to map exceptions to HTTP responses.

**Section sources**
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

## Conclusion
The backend implements a robust layered architecture with clear separation between HTTP, business logic, and data access. Middleware and error handling are centralized for consistency. Services encapsulate domain logic and rely on repositories for data operations. Dependency injection enables testability and flexibility. The Prisma schema serves as the single source of truth for data models. This structure supports scalability, maintainability, and clarity for future enhancements.

[No sources needed since this section summarizes without analyzing specific files]