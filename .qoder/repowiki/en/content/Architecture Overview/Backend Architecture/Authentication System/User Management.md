# User Management

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [User.model.ts](file://Backend/src/models/User.model.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [auth.ts](file://Backend/src/routes/common/auth.ts)
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [users.test.ts](file://Backend/tests/users.test.ts)
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
10. [Appendices](#appendices)

## Introduction
This document explains the user management system with a focus on registration, profile updates, and account lifecycle operations. It covers the User model schema, validation rules, database operations, password hashing using bcrypt, email verification processes, and security considerations. It also provides examples of CRUD operations, profile management, and account deletion workflows.

## Project Structure
The user management functionality spans several layers:
- Data layer: Prisma schema and repository for database operations
- Service layer: Business logic for users, authentication, and profiles
- Route layer: HTTP endpoints that expose APIs for clients
- Validation utilities: Input validation helpers
- Environment configuration: Secrets and runtime settings

```mermaid
graph TB
subgraph "Data Layer"
Schema["Prisma Schema<br/>schema.prisma"]
Repo["User Repository<br/>UserRepo.ts"]
DB["Database"]
end
subgraph "Service Layer"
UserService["User Service<br/>UserService.ts"]
AuthService["Auth Service<br/>AuthService.ts"]
ProfileService["Profile Service<br/>ProfileService.ts"]
end
subgraph "Route Layer"
AuthRoutes["Auth Routes<br/>AuthRoutes.ts"]
ProfileRoutes["Profile Routes<br/>ProfileRoutes.ts"]
UserRoutes["User Routes<br/>UserRoutes.ts"]
end
subgraph "Utilities"
Validators["Validators<br/>validators.ts"]
Env["Environment<br/>env.ts"]
end
Client["Client App"] --> AuthRoutes
Client --> ProfileRoutes
Client --> UserRoutes
AuthRoutes --> AuthService
ProfileRoutes --> ProfileService
UserRoutes --> UserService
AuthService --> Repo
ProfileService --> Repo
UserService --> Repo
Repo --> Schema
Repo --> DB
AuthService --> Validators
ProfileService --> Validators
UserService --> Validators
AuthService --> Env
ProfileService --> Env
UserService --> Env
```

**Diagram sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

**Section sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

## Core Components
- User Model: Defines fields such as id, email, password, name, and optional profile attributes. The schema is defined in the Prisma schema file and reflected in the TypeScript model.
- Repository: Encapsulates database operations for creating, reading, updating, and deleting users via Prisma client.
- Services: Implement business logic for user registration, login, profile updates, and account deletion. They coordinate validation, hashing, and persistence.
- Routes: Expose HTTP endpoints for authentication, profile management, and user administration.
- Validators: Provide input validation helpers used across services and routes.
- Environment: Holds secrets like JWT tokens and bcrypt salt rounds.

Key responsibilities:
- Registration: Validate inputs, hash password, create user, handle duplicates, return minimal user data.
- Login: Verify credentials, generate token, return session or token payload.
- Profile Update: Authenticate request, validate fields, update user profile safely.
- Account Deletion: Authenticate request, remove user data, confirm deletion.

**Section sources**
- [User.model.ts](file://Backend/src/models/User.model.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

## Architecture Overview
The user management flow follows a layered architecture:
- Routes receive HTTP requests and delegate to services.
- Services enforce business rules, validate inputs, and call repositories.
- Repositories perform database operations through Prisma.
- Utilities provide validation and environment access.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoutes as "AuthRoutes"
participant AuthService as "AuthService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>AuthRoutes : "POST /register {email,password,name}"
AuthRoutes->>AuthService : "register(email,password,name)"
AuthService->>AuthService : "validate inputs"
AuthService->>AuthService : "hash password (bcrypt)"
AuthService->>UserRepo : "create user"
UserRepo->>DB : "INSERT user"
DB-->>UserRepo : "created user"
UserRepo-->>AuthService : "user object"
AuthService-->>AuthRoutes : "success response"
AuthRoutes-->>Client : "201 Created"
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

## Detailed Component Analysis

### User Model and Schema
- Fields include unique identifiers, email, hashed password, and profile-related attributes.
- Constraints ensure uniqueness and required fields.
- The Prisma schema defines relationships and indexes for performance.

```mermaid
erDiagram
USER {
uuid id PK
string email UK
string password
string name
datetime created_at
datetime updated_at
}
```

**Diagram sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [User.model.ts](file://Backend/src/models/User.model.ts)

### Password Hashing with bcrypt
- Passwords are hashed before storage using bcrypt.
- Salt rounds are configured via environment variables.
- Verification compares plaintext passwords against stored hashes securely.

```mermaid
flowchart TD
Start(["Register Entry"]) --> Validate["Validate email/password/name"]
Validate --> Hash["Hash password with bcrypt"]
Hash --> Create["Create user record"]
Create --> Success{"Created?"}
Success --> |Yes| ReturnOK["Return success"]
Success --> |No| HandleError["Handle duplicate/error"]
HandleError --> End(["Exit"])
ReturnOK --> End
```

**Diagram sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)

**Section sources**
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)

### Email Verification Process
- On registration, an email verification token can be generated and sent to the user’s email.
- The verification endpoint validates the token and marks the user as verified.
- Protected routes may require verified status.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoutes as "AuthRoutes"
participant AuthService as "AuthService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>AuthRoutes : "POST /verify-email {token}"
AuthRoutes->>AuthService : "verifyEmail(token)"
AuthService->>AuthService : "validate token format"
AuthService->>UserRepo : "find user by token"
UserRepo->>DB : "SELECT user by token"
DB-->>UserRepo : "user"
UserRepo-->>AuthService : "user"
AuthService->>AuthService : "mark user verified"
AuthService->>UserRepo : "update user"
UserRepo->>DB : "UPDATE user set verified=true"
DB-->>UserRepo : "ok"
UserRepo-->>AuthService : "updated user"
AuthService-->>AuthRoutes : "verification success"
AuthRoutes-->>Client : "200 OK"
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

### User Registration Workflow
- Validates email uniqueness and password strength.
- Hashes password and creates user record.
- Returns minimal user info without sensitive data.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoutes as "AuthRoutes"
participant AuthService as "AuthService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>AuthRoutes : "POST /register {email,password,name}"
AuthRoutes->>AuthService : "register(email,password,name)"
AuthService->>AuthService : "validate inputs"
AuthService->>AuthService : "hash password"
AuthService->>UserRepo : "create user"
UserRepo->>DB : "INSERT user"
DB-->>UserRepo : "user"
UserRepo-->>AuthService : "user"
AuthService-->>AuthRoutes : "success"
AuthRoutes-->>Client : "201 Created"
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

### Profile Updates
- Requires authenticated request.
- Validates allowed fields and constraints.
- Updates only permitted attributes to prevent overwriting sensitive data.

```mermaid
sequenceDiagram
participant Client as "Client"
participant ProfileRoutes as "ProfileRoutes"
participant ProfileService as "ProfileService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>ProfileRoutes : "PATCH /profile {name,email,...}"
ProfileRoutes->>ProfileService : "updateProfile(userId,payload)"
ProfileService->>ProfileService : "validate payload"
ProfileService->>UserRepo : "find user by id"
UserRepo->>DB : "SELECT user"
DB-->>UserRepo : "user"
UserRepo-->>ProfileService : "user"
ProfileService->>UserRepo : "update user fields"
UserRepo->>DB : "UPDATE user"
DB-->>UserRepo : "ok"
UserRepo-->>ProfileService : "updated user"
ProfileService-->>ProfileRoutes : "success"
ProfileRoutes-->>Client : "200 OK"
```

**Diagram sources**
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

### Account Deletion Workflow
- Requires strong authentication (e.g., re-enter password or confirmation).
- Deletes user record and related data if cascading.
- Returns confirmation and ensures no residual sensitive data remains.

```mermaid
sequenceDiagram
participant Client as "Client"
participant UserRoutes as "UserRoutes"
participant UserService as "UserService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>UserRoutes : "DELETE /user/{id}"
UserRoutes->>UserService : "deleteUser(id)"
UserService->>UserService : "authenticate and authorize"
UserService->>UserRepo : "delete user"
UserRepo->>DB : "DELETE user"
DB-->>UserRepo : "ok"
UserRepo-->>UserService : "deleted"
UserService-->>UserRoutes : "success"
UserRoutes-->>Client : "204 No Content"
```

**Diagram sources**
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

### Authentication Flow
- Login verifies credentials and issues a token.
- Token-based sessions protect subsequent requests.
- Middleware validates tokens and attaches user context.

```mermaid
sequenceDiagram
participant Client as "Client"
participant AuthRoutes as "AuthRoutes"
participant AuthService as "AuthService"
participant UserRepo as "UserRepo"
participant DB as "Database"
Client->>AuthRoutes : "POST /login {email,password}"
AuthRoutes->>AuthService : "login(email,password)"
AuthService->>UserRepo : "find user by email"
UserRepo->>DB : "SELECT user"
DB-->>UserRepo : "user"
UserRepo-->>AuthService : "user"
AuthService->>AuthService : "verify password"
AuthService->>AuthService : "generate token"
AuthService-->>AuthRoutes : "token + user"
AuthRoutes-->>Client : "200 OK"
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

### Request Parsing and Validation
- Input parsing ensures correct types and formats.
- Validators enforce constraints like email format, password length, and field presence.
- Errors are standardized and returned consistently.

```mermaid
flowchart TD
Entry(["Request Entry"]) --> Parse["Parse request body"]
Parse --> Validate["Run validators"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Return validation error"]
Valid --> |Yes| Proceed["Proceed to service layer"]
Error --> Exit(["Exit"])
Proceed --> Exit
```

**Diagram sources**
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)

**Section sources**
- [parseReq.ts](file://Backend/src/routes/common/parseReq.ts)
- [validators.ts](file://Backend/src/common/utils/validators.ts)

### Security Best Practices
- Use bcrypt with appropriate salt rounds from environment configuration.
- Never log or return sensitive fields like password or tokens.
- Enforce HTTPS and secure cookie policies for tokens.
- Apply rate limiting and account lockout strategies for login attempts.
- Validate and sanitize all inputs to prevent injection attacks.

[No sources needed since this section provides general guidance]

## Dependency Analysis
The user management components have clear dependencies:
- Routes depend on services for business logic.
- Services depend on repositories for data access.
- Repositories depend on Prisma schema and database.
- Utilities provide shared validation and environment access.

```mermaid
graph LR
AuthRoutes["AuthRoutes"] --> AuthService["AuthService"]
ProfileRoutes["ProfileRoutes"] --> ProfileService["ProfileService"]
UserRoutes["UserRoutes"] --> UserService["UserService"]
AuthService --> UserRepo["UserRepo"]
ProfileService --> UserRepo
UserService --> UserRepo
UserRepo --> Schema["schema.prisma"]
UserRepo --> DB["Database"]
AuthService --> Validators["validators.ts"]
ProfileService --> Validators
UserService --> Validators
AuthService --> Env["env.ts"]
ProfileService --> Env
UserService --> Env
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [validators.ts](file://Backend/src/common/utils/validators.ts)
- [env.ts](file://Backend/src/common/constants/env.ts)

## Performance Considerations
- Index frequently queried fields like email to speed up lookups.
- Use Prisma transactions for multi-step operations to maintain consistency.
- Avoid returning large payloads; project only necessary fields.
- Cache tokens and session data where appropriate to reduce DB load.
- Monitor bcrypt cost factor to balance security and latency.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Duplicate email during registration: Ensure uniqueness checks and return clear errors.
- Invalid token during verification: Validate token format and expiration.
- Permission denied on profile update: Confirm authentication middleware is applied.
- Database connection failures: Check Prisma client initialization and environment variables.

**Section sources**
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [ProfileService.ts](file://Backend/src/services/ProfileService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

## Conclusion
The user management system implements secure registration, login, profile updates, and account deletion with robust validation and hashing. The layered architecture promotes clarity and maintainability. Following the best practices outlined here will help ensure reliability, security, and performance.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### API Examples
- Register: POST /register with email, password, name
- Login: POST /login with email, password
- Verify Email: POST /verify-email with token
- Update Profile: PATCH /profile with allowed fields
- Delete Account: DELETE /user/{id}

[No sources needed since this section provides general guidance]

### Testing References
- Unit tests for user flows demonstrate expected behaviors and error handling.

**Section sources**
- [users.test.ts](file://Backend/tests/users.test.ts)