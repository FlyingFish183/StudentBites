# Route Handlers and API Endpoints

<cite>
**Referenced Files in This Document**
- [main.ts](file://Backend/src/main.ts)
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [LogRoutes.ts](file://Backend/src/routes/LogRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [express-types.ts](file://Backend/src/routes/common/express-types.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [route-errors.ts](file://Backend/src/common/utils/route-errors.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [HttpStatusCodes.ts](file://Backend/src/common/constants/HttpStatusCodes.ts)
- [Paths.ts](file://Backend/src/common/constants/Paths.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [LogService.ts](file://Backend/src/services/LogService.ts)
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
This document explains the Express.js route handler architecture and API endpoint organization used by the backend. It covers how requests are processed, how parameters are validated, how errors are handled consistently, and how responses are formatted. It also details the router structure, middleware integration, and RESTful design principles applied across the application.

## Project Structure
The backend organizes routing into feature-based route modules under src/routes, with shared utilities for parsing, validation, error handling, and HTTP constants. The server entry wires up Express, mounts routers, and integrates global middleware. Services encapsulate business logic invoked by route handlers.

```mermaid
graph TB
A["Express App<br/>src/server.ts"] --> B["API Router<br/>src/routes/apiRouter.ts"]
B --> C["Auth Routes<br/>src/routes/AuthRoutes.ts"]
B --> D["User Routes<br/>src/routes/UserRoutes.ts"]
B --> E["Planner Routes<br/>src/routes/PlannerRoutes.ts"]
B --> F["Profile Routes<br/>src/routes/ProfileRoutes.ts"]
B --> G["Store Routes<br/>src/routes/StoreRoutes.ts"]
B --> H["Log Routes<br/>src/routes/LogRoutes.ts"]
C --> I["AuthService<br/>src/services/AuthService.ts"]
D --> J["UserService<br/>src/services/UserService.ts"]
E --> K["PlannerService<br/>src/services/PlannerService.ts"]
F --> L["ProfileService<br/>src/services/ProfileService.ts"]
G --> M["StoreService<br/>src/services/StoreService.ts"]
H --> N["LogService<br/>src/services/LogService.ts"]
```

**Diagram sources**
- [server.ts:1-200](file://Backend/src/server.ts#L1-L200)
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-L200)
- [UserRoutes.ts:1-200](file://Backend/src/routes/UserRoutes.ts#L1-L200)
- [PlannerRoutes.ts:1-200](file://Backend/src/routes/PlannerRoutes.ts#L1-L200)
- [ProfileRoutes.ts:1-200](file://Backend/src/routes/ProfileRoutes.ts#L1-L200)
- [StoreRoutes.ts:1-200](file://Backend/src/routes/StoreRoutes.ts#L1-L200)
- [LogRoutes.ts:1-200](file://Backend/src/routes/LogRoutes.ts#L1-L200)
- [AuthService.ts:1-200](file://Backend/src/services/AuthService.ts#L1-L200)
- [UserService.ts:1-200](file://Backend/src/services/UserService.ts#L1-L200)
- [PlannerService.ts:1-200](file://Backend/src/services/PlannerService.ts#L1-L200)
- [ProfileService.ts:1-200](file://Backend/src/services/ProfileService.ts#L1-L200)
- [StoreService.ts:1-200](file://Backend/src/services/StoreService.ts#L1-L200)
- [LogService.ts:1-200](file://Backend/src/services/LogService.ts#L1-L200)

**Section sources**
- [server.ts:1-200](file://Backend/src/server.ts#L1-L200)
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)

## Core Components
- Router assembly: The API router aggregates feature-specific route modules and applies common middleware such as authentication guards and request parsers.
- Route modules: Each feature (Auth, User, Planner, Profile, Store, Log) is defined in its own file to keep endpoints cohesive and maintainable.
- Middleware: Shared parsing and validation helpers live under routes/common and common/utils.
- Error handling: Centralized error utilities and HTTP status codes ensure consistent error responses.
- Services: Business logic is delegated to service modules, keeping routes thin and focused on I/O.

Key responsibilities:
- Request parsing and normalization via shared utilities.
- Parameter validation using reusable validators.
- Consistent error formatting and status mapping.
- Service-driven data operations and domain rules.

**Section sources**
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-L200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-L200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-L200)
- [HttpStatusCodes.ts:1-200](file://Backend/src/common/constants/HttpStatusCodes.ts#L1-L200)

## Architecture Overview
The request lifecycle follows a clear path from Express through the API router to feature-specific routes, then to services, and finally back to a standardized response shape. Global middleware handles parsing, logging, and authentication where applicable.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Express as "Express Server<br/>src/server.ts"
participant Router as "API Router<br/>src/routes/apiRouter.ts"
participant Feature as "Feature Route<br/>e.g., AuthRoutes.ts"
participant Guard as "Auth Middleware<br/>routes/common/auth.ts"
participant Service as "Service<br/>e.g., AuthService.ts"
participant Utils as "Validators & Errors<br/>common/utils/*"
Client->>Express : "HTTP Request"
Express->>Router : "Mount /api"
Router->>Feature : "Dispatch to route handler"
Feature->>Guard : "Apply auth/validation"
Guard-->>Feature : "Context or error"
Feature->>Utils : "Validate inputs"
Utils-->>Feature : "Validated payload"
Feature->>Service : "Invoke business logic"
Service-->>Feature : "Result or exception"
Feature-->>Client : "Standardized JSON Response"
```

**Diagram sources**
- [server.ts:1-200](file://Backend/src/server.ts#L1-L200)
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-L200)
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-L200)
- [AuthService.ts:1-200](file://Backend/src/services/AuthService.ts#L1-L200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-L200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-L200)

## Detailed Component Analysis

### API Router and Mounting
- The API router centralizes route mounting and applies shared middleware before dispatching to feature routers.
- Paths are organized under a common prefix to support versioning and clarity.

```mermaid
flowchart TD
Start(["Request enters /api"]) --> Parse["Parse body/query/params"]
Parse --> Validate["Run input validators"]
Validate --> Valid{"Valid?"}
Valid --> |No| Err["Format error response"]
Valid --> |Yes| Dispatch["Dispatch to feature router"]
Dispatch --> ServiceCall["Call service layer"]
ServiceCall --> Resp["Return standardized JSON"]
Err --> End(["Response"])
Resp --> End
```

**Diagram sources**
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-L200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-L200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-L200)

**Section sources**
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-L200)

### Authentication Middleware
- Provides context injection and authorization checks for protected routes.
- Integrates with token/session handling and user resolution.

```mermaid
classDiagram
class AuthMiddleware {
+apply(req, res, next) void
+requireRole(role) function
+extractToken(req) string
}
class ExpressTypes {
+AppRequest extends Request
+AppResponse extends Response
}
AuthMiddleware --> ExpressTypes : "uses typed req/res"
```

**Diagram sources**
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-200)
- [express-types.ts:1-200](file://Backend/src/routes/common/express-types.ts#L1-200)

**Section sources**
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-200)
- [express-types.ts:1-200](file://Backend/src/routes/common/express-types.ts#L1-200)

### Request Parsing Utilities
- Normalizes incoming payloads, extracts query parameters, and ensures consistent types.
- Used by route handlers to avoid duplicated parsing logic.

```mermaid
flowchart TD
In(["Incoming req"]) --> Extract["Extract body/query/params"]
Extract --> Normalize["Normalize fields"]
Normalize --> Output["Typed parsed object"]
```

**Diagram sources**
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-200)

**Section sources**
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-200)

### Input Validation Patterns
- Validators enforce schema constraints and return structured errors.
- Applied before invoking services to fail fast and reduce downstream errors.

```mermaid
flowchart TD
VStart(["Validate input"]) --> CheckSchema["Check against schema"]
CheckSchema --> Ok{"Passes?"}
Ok --> |No| BuildErr["Build validation error"]
Ok --> |Yes| ReturnOk["Return valid payload"]
BuildErr --> VEnd(["Error response"])
ReturnOk --> VEnd
```

**Diagram sources**
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)

**Section sources**
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)

### Error Handling and Response Formatting
- Centralized utilities map exceptions to consistent JSON structures and HTTP status codes.
- Ensures predictable client behavior and easier debugging.

```mermaid
flowchart TD
EStart(["Exception thrown"]) --> Classify["Classify error type"]
Classify --> MapStatus["Map to HTTP status"]
MapStatus --> Format["Format error payload"]
Format --> Send["Send response"]
```

**Diagram sources**
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)
- [HttpStatusCodes.ts:1-200](file://Backend/src/common/constants/HttpStatusCodes.ts#L1-200)

**Section sources**
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)
- [HttpStatusCodes.ts:1-200](file://Backend/src/common/constants/HttpStatusCodes.ts#L1-200)

### Feature Routers and RESTful Design
- Each feature module defines endpoints following REST conventions: resource-oriented paths, appropriate HTTP methods, and consistent status usage.
- Examples include authentication flows, user management, planning features, profile updates, store operations, and logging.

```mermaid
graph LR
subgraph "Auth"
A1["POST /auth/login"]
A2["POST /auth/register"]
A3["GET /auth/me"]
end
subgraph "Users"
U1["GET /users/:id"]
U2["PUT /users/:id"]
end
subgraph "Planner"
P1["POST /planner/schedule"]
P2["GET /planner/history"]
end
subgraph "Profile"
PR1["PATCH /profile"]
end
subgraph "Stores"
S1["GET /stores"]
S2["GET /stores/:id"]
end
subgraph "Logs"
L1["GET /logs"]
end
```

[No diagram sources since this diagram shows conceptual REST endpoints]

**Section sources**
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-200)
- [UserRoutes.ts:1-200](file://Backend/src/routes/UserRoutes.ts#L1-200)
- [PlannerRoutes.ts:1-200](file://Backend/src/routes/PlannerRoutes.ts#L1-200)
- [ProfileRoutes.ts:1-200](file://Backend/src/routes/ProfileRoutes.ts#L1-200)
- [StoreRoutes.ts:1-200](file://Backend/src/routes/StoreRoutes.ts#L1-200)
- [LogRoutes.ts:1-200](file://Backend/src/routes/LogRoutes.ts#L1-200)

### Example Request/Response Flow: Authentication
A typical login flow demonstrates parsing, validation, authentication, and standardized response formatting.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoute as "AuthRoutes.ts"
participant Guard as "auth.ts"
participant Validator as "validators.ts"
participant Service as "AuthService.ts"
participant Errors as "route-errors.ts"
Client->>AuthRoute : "POST /auth/login {email,password}"
AuthRoute->>Validator : "Validate payload"
Validator-->>AuthRoute : "Validated or error"
AuthRoute->>Service : "authenticate(email,password)"
Service-->>AuthRoute : "User/token or error"
AuthRoute-->>Client : "200 OK {token,user} or 4xx error"
```

**Diagram sources**
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-200)
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [AuthService.ts:1-200](file://Backend/src/services/AuthService.ts#L1-200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)

**Section sources**
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-200)
- [AuthService.ts:1-200](file://Backend/src/services/AuthService.ts#L1-200)

### Example Request/Response Flow: User Management
Fetching and updating a user illustrates parameter extraction, validation, service calls, and consistent responses.

```mermaid
sequenceDiagram
participant Client as "Client"
participant UserRoute as "UserRoutes.ts"
participant Parser as "parseReq.ts"
participant Validator as "validators.ts"
participant Service as "UserService.ts"
participant Errors as "route-errors.ts"
Client->>UserRoute : "GET /users/ : id"
UserRoute->>Parser : "Extract params"
Parser-->>UserRoute : "Typed params"
UserRoute->>Validator : "Validate id"
Validator-->>UserRoute : "Valid or error"
UserRoute->>Service : "getUser(id)"
Service-->>UserRoute : "User or not found"
UserRoute-->>Client : "200 OK {user} or 404"
```

**Diagram sources**
- [UserRoutes.ts:1-200](file://Backend/src/routes/UserRoutes.ts#L1-200)
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [UserService.ts:1-200](file://Backend/src/services/UserService.ts#L1-200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)

**Section sources**
- [UserRoutes.ts:1-200](file://Backend/src/routes/UserRoutes.ts#L1-200)
- [UserService.ts:1-200](file://Backend/src/services/UserService.ts#L1-200)

## Dependency Analysis
Routers depend on shared middleware and utilities, while services encapsulate business logic. Constants define HTTP statuses and paths, ensuring consistency across the API.

```mermaid
graph TB
Router["apiRouter.ts"] --> AR["AuthRoutes.ts"]
Router --> UR["UserRoutes.ts"]
Router --> PR["PlannerRoutes.ts"]
Router --> PF["ProfileRoutes.ts"]
Router --> SR["StoreRoutes.ts"]
Router --> LR["LogRoutes.ts"]
AR --> ASvc["AuthService.ts"]
UR --> USvc["UserService.ts"]
PR --> PSvc["PlannerService.ts"]
PF --> PFSvc["ProfileService.ts"]
SR --> SSvc["StoreService.ts"]
LR --> LSvc["LogService.ts"]
AR --> AuthMw["auth.ts"]
UR --> Parse["parseReq.ts"]
UR --> Val["validators.ts"]
UR --> Err["route-errors.ts"]
UR --> Status["HttpStatusCodes.ts"]
UR --> Paths["Paths.ts"]
```

**Diagram sources**
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-200)
- [AuthRoutes.ts:1-200](file://Backend/src/routes/AuthRoutes.ts#L1-200)
- [UserRoutes.ts:1-200](file://Backend/src/routes/UserRoutes.ts#L1-200)
- [PlannerRoutes.ts:1-200](file://Backend/src/routes/PlannerRoutes.ts#L1-200)
- [ProfileRoutes.ts:1-200](file://Backend/src/routes/ProfileRoutes.ts#L1-200)
- [StoreRoutes.ts:1-200](file://Backend/src/routes/StoreRoutes.ts#L1-200)
- [LogRoutes.ts:1-200](file://Backend/src/routes/LogRoutes.ts#L1-200)
- [AuthService.ts:1-200](file://Backend/src/services/AuthService.ts#L1-200)
- [UserService.ts:1-200](file://Backend/src/services/UserService.ts#L1-200)
- [PlannerService.ts:1-200](file://Backend/src/services/PlannerService.ts#L1-200)
- [ProfileService.ts:1-200](file://Backend/src/services/ProfileService.ts#L1-200)
- [StoreService.ts:1-200](file://Backend/src/services/StoreService.ts#L1-200)
- [LogService.ts:1-200](file://Backend/src/services/LogService.ts#L1-200)
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-200)
- [parseReq.ts:1-200](file://Backend/src/routes/common/parseReq.ts#L1-200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)
- [HttpStatusCodes.ts:1-200](file://Backend/src/common/constants/HttpStatusCodes.ts#L1-200)
- [Paths.ts:1-200](file://Backend/src/common/constants/Paths.ts#L1-200)

**Section sources**
- [apiRouter.ts:1-200](file://Backend/src/routes/apiRouter.ts#L1-200)
- [paths.ts:1-200](file://Backend/src/common/constants/Paths.ts#L1-200)
- [http-status-codes.ts:1-200](file://Backend/src/common/constants/HttpStatusCodes.ts#L1-200)

## Performance Considerations
- Keep route handlers thin; delegate heavy work to services.
- Use validators early to fail fast and avoid unnecessary processing.
- Avoid synchronous blocking operations within request handlers.
- Reuse parsing and validation utilities to minimize duplication and overhead.
- Apply caching at the service layer where appropriate for read-heavy endpoints.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid input: Ensure validators cover all required fields and provide clear messages.
- Authentication failures: Verify middleware order and token extraction logic.
- Unexpected status codes: Confirm error mapping uses correct HTTP status constants.
- Missing context: Confirm that parsing utilities populate req fields expected by handlers.

Use centralized error utilities to log and format errors consistently, aiding quick diagnosis.

**Section sources**
- [route-errors.ts:1-200](file://Backend/src/common/utils/route-errors.ts#L1-200)
- [validators.ts:1-200](file://Backend/src/common/utils/validators.ts#L1-200)
- [auth.ts:1-200](file://Backend/src/routes/common/auth.ts#L1-200)

## Conclusion
The backend’s Express architecture separates concerns cleanly: routers handle HTTP concerns, middleware standardizes parsing and security, validators enforce correctness, and services encapsulate business logic. Consistent error handling and response formatting make the API predictable and developer-friendly. Following these patterns ensures maintainability, scalability, and a robust RESTful interface.