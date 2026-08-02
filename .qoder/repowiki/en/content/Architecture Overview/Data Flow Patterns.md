# Data Flow Patterns

<cite>
**Referenced Files in This Document**
- [main.ts](file://Backend/src/main.ts)
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [bachhoaxanh.ts](file://Backend/src/crawlers/bachhoaxanh.ts)
- [coopmart.ts](file://Backend/src/crawlers/coopmart.ts)
- [winmart.ts](file://Backend/src/crawlers/winmart.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [MockOrm.ts](file://Backend/src/repos/MockOrm.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [page.tsx](file://Frontend/studentbite/app/login/page.tsx)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains the end-to-end data flow patterns in StudentBite, covering request-response cycles from Next.js frontend components through Express API routes to database operations. It also details real-time synchronization strategies, caching approaches, state management patterns, and the data flows for meal planning, price comparison across stores, and user preference handling. Sequence diagrams illustrate transformations at each layer and how errors propagate.

## Project Structure
StudentBite is a full-stack application:
- Frontend: Next.js app with pages and reusable hooks/libraries for API calls and types.
- Backend: Express server with typed routes, services, crawlers for store price data, Prisma ORM for persistence, and shared utilities.

```mermaid
graph TB
subgraph "Frontend"
FE_Planner["Planner Page"]
FE_Stores["Stores Page"]
FE_Login["Login Page"]
FE_API["lib/api.ts"]
FE_Hooks["lib/hooks.ts"]
FE_Types["lib/types.ts"]
end
subgraph "Backend"
BE_Server["Express Server"]
BE_Router["API Router"]
BE_PlannerRoutes["Planner Routes"]
BE_StoreRoutes["Store Routes"]
BE_AuthRoutes["Auth Routes"]
BE_ProfileRoutes["Profile Routes"]
BE_UserRoutes["User Routes"]
BE_Services["Services Layer"]
BE_Crawlers["Crawler Runner + Store Crawlers"]
BE_Prisma["Prisma Client"]
BE_DB[(Database)]
end
FE_Planner --> FE_API
FE_Stores --> FE_API
FE_Login --> FE_API
FE_API --> BE_Router
BE_Router --> BE_PlannerRoutes
BE_Router --> BE_StoreRoutes
BE_Router --> BE_AuthRoutes
BE_Router --> BE_ProfileRoutes
BE_Router --> BE_UserRoutes
BE_PlannerRoutes --> BE_Services
BE_StoreRoutes --> BE_Services
BE_AuthRoutes --> BE_Services
BE_ProfileRoutes --> BE_Services
BE_UserRoutes --> BE_Services
BE_Services --> BE_Prisma
BE_Services --> BE_Crawlers
BE_Prisma --> BE_DB
```

**Diagram sources**
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

**Section sources**
- [server.ts](file://Backend/src/server.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)

## Core Components
- Frontend API client: Centralized HTTP client with typed requests and response normalization.
- Hooks: Stateful data fetching, caching, and revalidation using React state and local storage.
- Routes: Express routers mapping endpoints to service handlers.
- Services: Business logic orchestration (auth, planner, store data, user profile).
- Crawlers: Asynchronous scraping pipeline for store prices and product availability.
- Repositories: Abstraction over Prisma client for DB access; includes mock implementation for tests.
- Database schema: Prisma model definitions defining entities and relations.

Key responsibilities:
- Request validation and transformation occur early in routes or middleware.
- Services coordinate external calls (crawlers), DB reads/writes, and business rules.
- Frontend manages optimistic UI updates and error states.

**Section sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

## Architecture Overview
The system follows a layered architecture:
- Presentation: Next.js pages and components.
- API Client: Typed fetch wrapper and hooks for stateful data access.
- Routing: Express router dispatches to route handlers.
- Service Layer: Encapsulates domain logic and orchestrates crawlers and repositories.
- Data Access: Prisma client abstracts SQL queries; mock ORM supports testing.
- External Systems: Store websites via crawlers.

```mermaid
sequenceDiagram
participant FE as "Next.js Page"
participant API as "Frontend API Client"
participant RT as "Express Router"
participant RH as "Route Handler"
participant SVC as "Service"
participant CR as "Crawler Runner"
participant PR as "Prisma Client"
participant DB as "Database"
FE->>API : "POST /api/planner/generate"
API->>RT : "HTTP POST /api/planner/generate"
RT->>RH : "Dispatch PlannerRoutes.generate"
RH->>SVC : "PlanMeals(request)"
SVC->>CR : "FetchPrices(storeList)"
CR-->>SVC : "NormalizedPrice[] (cached or fresh)"
SVC->>PR : "Read preferences & history"
PR-->>SVC : "Preferences, History"
SVC->>SVC : "Run planning algorithm"
SVC->>PR : "Persist plan & stats"
PR-->>SVC : "OK"
SVC-->>RH : "PlanResult"
RH-->>API : "JSON Response"
API-->>FE : "State update + optimistic UI"
```

**Diagram sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [schema.prisma](file://Backend/prisma/schema.prisma)

## Detailed Component Analysis

### Meal Planning Data Flow
The planner endpoint coordinates user preferences, historical data, and live store prices to produce an optimized weekly plan.

```mermaid
flowchart TD
Start(["Request Received"]) --> Validate["Validate payload<br/>and auth context"]
Validate --> LoadPrefs["Load user preferences<br/>from DB"]
LoadPrefs --> FetchPrices["Trigger crawler runner<br/>for selected stores"]
FetchPrices --> Normalize["Normalize crawled data<br/>to canonical format"]
Normalize --> Algorithm["Run planning algorithm<br/>with constraints"]
Algorithm --> Persist["Persist plan and stats"]
Persist --> Respond["Return plan result"]
Validate --> |Invalid| Err["Return 400/401"]
FetchPrices --> |Timeout/Error| Fallback["Use cached prices if available"]
Fallback --> Algorithm
Persist --> |Error| ErrDB["Return 500 with error"]
```

**Diagram sources**
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

**Section sources**
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [planner-algorithm.ts](file://Backend/src/services/planner-algorithm.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)

### Price Comparison Data Processing
Store crawlers run concurrently to collect pricing and availability. Results are normalized and optionally cached before being used by services.

```mermaid
sequenceDiagram
participant SVC as "StoreService"
participant RUN as "Runner"
participant BHH as "Bach Ho Xanh Crawler"
participant CM as "Coop Mart Crawler"
participant WM as "Win Mart Crawler"
participant PR as "Prisma Client"
participant DB as "Database"
SVC->>RUN : "run(stores, query)"
RUN->>BHH : "scrape(query)"
RUN->>CM : "scrape(query)"
RUN->>WM : "scrape(query)"
BHH-->>RUN : "Raw results"
CM-->>RUN : "Raw results"
WM-->>RUN : "Raw results"
RUN->>RUN : "Normalize & deduplicate"
RUN->>PR : "Upsert latest prices"
PR-->>RUN : "OK"
RUN-->>SVC : "NormalizedPrice[]"
SVC-->>SVC : "Cache strategy applied"
```

**Diagram sources**
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [bachhoaxanh.ts](file://Backend/src/crawlers/bachhoaxanh.ts)
- [coopmart.ts](file://Backend/src/crawlers/coopmart.ts)
- [winmart.ts](file://Backend/src/crawlers/winmart.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)

**Section sources**
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [bachhoaxanh.ts](file://Backend/src/crawlers/bachhoaxanh.ts)
- [coopmart.ts](file://Backend/src/crawlers/coopmart.ts)
- [winmart.ts](file://Backend/src/crawlers/winmart.ts)

### Authentication and User Preference Handling
Authentication routes manage login/register sessions and attach user context to subsequent requests. Preferences are stored and retrieved per user.

```mermaid
sequenceDiagram
participant FE as "Login Page"
participant API as "Frontend API Client"
participant AUTH_RT as "AuthRoutes"
participant AUTH_SVC as "AuthService"
participant USER_REPO as "UserRepo"
participant PR as "Prisma Client"
participant DB as "Database"
FE->>API : "POST /api/auth/login"
API->>AUTH_RT : "Handle login"
AUTH_RT->>AUTH_SVC : "authenticate(email, password)"
AUTH_SVC->>USER_REPO : "findByEmail(email)"
USER_REPO->>PR : "Query users"
PR-->>USER_REPO : "User record"
USER_REPO-->>AUTH_SVC : "User"
AUTH_SVC->>AUTH_SVC : "Verify credentials"
AUTH_SVC-->>AUTH_RT : "Token + user info"
AUTH_RT-->>API : "JWT token"
API-->>FE : "Set session/token"
FE->>API : "GET /api/profile/me"
API->>PROFILE_RT : "Get profile"
PROFILE_RT->>USER_REPO : "Find by id"
USER_REPO-->>PROFILE_RT : "Profile + preferences"
PROFILE_RT-->>API : "Profile"
API-->>FE : "Profile data"
```

**Diagram sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)

**Section sources**
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)

### Real-Time Data Synchronization
Real-time updates can be achieved via short polling or WebSocket channels. The current codebase uses HTTP-based APIs; real-time behavior on the frontend is implemented through periodic refetching and optimistic updates.

```mermaid
sequenceDiagram
participant FE as "Next.js Page"
participant HOOK as "Custom Hook"
participant API as "API Client"
participant RT as "Express Router"
participant SVC as "Service"
participant PR as "Prisma Client"
HOOK->>API : "poll(interval, endpoint)"
API->>RT : "HTTP GET"
RT->>SVC : "Fetch latest data"
SVC->>PR : "Read from DB"
PR-->>SVC : "Data"
SVC-->>RT : "Response"
RT-->>API : "JSON"
API-->>HOOK : "New data"
HOOK->>HOOK : "Update state + cache"
HOOK-->>FE : "Re-render with fresh data"
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### Caching Strategies
- In-memory cache: Short-lived cache for frequently accessed data (e.g., normalized prices).
- Database-backed cache: Persisted snapshots of crawled prices for fallback when crawlers fail.
- Frontend cache: Local storage and React state for optimistic UI and reduced network calls.

```mermaid
flowchart TD
Req["Incoming Request"] --> CheckMem["Check memory cache"]
CheckMem --> |Hit| ReturnMem["Return cached value"]
CheckMem --> |Miss| CheckDB["Check DB snapshot"]
CheckDB --> |Hit| UseDB["Use DB snapshot"]
CheckDB --> |Miss| FetchExt["Call crawlers/API"]
FetchExt --> UpdateCache["Update memory + DB cache"]
UpdateCache --> ReturnFresh["Return fresh data"]
UseDB --> ReturnDB["Return DB snapshot"]
ReturnMem --> End(["Done"])
ReturnFresh --> End
ReturnDB --> End
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### State Management Patterns
- Frontend: Custom hooks encapsulate fetch, loading, error, and cache states. Optimistic updates improve perceived performance.
- Backend: Stateless services; state is persisted via Prisma. No in-process global mutable state beyond caches.

```mermaid
classDiagram
class ApiClient {
+get(url, options) Promise
+post(url, body, options) Promise
+setHeaders(headers) void
}
class PlannerHook {
+state PlanState
+fetchPlan() void
+submitPlan(data) void
+invalidate() void
}
class StoreHook {
+state StoreState
+fetchStores() void
+refreshPrices() void
}
ApiClient <.. PlannerHook : "used by"
ApiClient <.. StoreHook : "used by"
```

**Diagram sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

**Section sources**
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

## Dependency Analysis
The backend organizes dependencies by layers: routes depend on services; services depend on repositories and crawlers; repositories depend on Prisma.

```mermaid
graph LR
ROUTES["Routes"] --> SERVICES["Services"]
SERVICES --> REPOS["Repositories"]
SERVICES --> CRAWLERS["Crawlers"]
REPOS --> PRISMA["Prisma Client"]
PRISMA --> DB["Database"]
```

**Diagram sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)

**Section sources**
- [apiRouter.ts](file://Backend/src/routes/apiRouter.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserRepo.ts](file://Backend/src/repos/UserRepo.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [runner.ts](file://Backend/src/crawlers/runner.ts)

## Performance Considerations
- Concurrency: Run multiple store crawlers concurrently to reduce latency.
- Caching: Implement multi-level caching (memory + DB snapshot) to avoid repeated crawling.
- Pagination: For large datasets (store listings, plans), paginate responses.
- Debounce: Debounce frequent UI-triggered requests (e.g., search).
- Idempotency: Ensure write operations are idempotent where possible.
- Connection pooling: Configure Prisma connection pool appropriately for load.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolution paths:
- Network timeouts during crawling:
  - Verify crawler endpoints and rate limits.
  - Enable fallback to cached prices.
  - Log detailed errors per store.
- Authentication failures:
  - Validate JWT configuration and expiration.
  - Ensure consistent secret keys across services.
- Database errors:
  - Check migration status and schema consistency.
  - Inspect transaction boundaries and rollback behavior.
- Frontend state inconsistencies:
  - Revalidate data after mutations.
  - Handle stale cache entries gracefully.

**Section sources**
- [runner.ts](file://Backend/src/crawlers/runner.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [prisma.ts](file://Backend/src/repos/prisma.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)

## Conclusion
StudentBite’s data flow emphasizes clear separation of concerns: frontend hooks manage state and caching, Express routes delegate to services, and services orchestrate crawlers and databases. The planner leverages real-time price data and user preferences to generate optimized plans. Robust caching and error propagation ensure reliability and responsiveness. Future enhancements may include WebSockets for true real-time sync and more sophisticated caching policies.