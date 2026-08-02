# Page Components

<cite>
**Referenced Files in This Document**
- [layout.tsx](file://Frontend/studentbite/app/(main)/layout.tsx)
- [page.tsx](file://Frontend/studentbite/app/(main)/page.tsx)
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [history/page.tsx](file://Frontend/studentbite/app/(main)/history/page.tsx)
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [onboarding/page.tsx](file://Frontend/studentbite/app/onboarding/page.tsx)
- [Providers.tsx](file://Frontend/studentbite/components/Providers.tsx)
- [TabBar.tsx](file://Frontend/studentbite/components/TabBar.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [ProgressBar.tsx](file://Frontend/studentbite/components/ProgressBar.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)
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
This document provides comprehensive documentation for the StudentBite application’s page components, focusing on the main dashboard, meal planner interface, store comparison page, history tracking, authentication pages (login/register), and the onboarding flow. It explains data fetching patterns, form handling, user interactions, state management, navigation between pages, and integration with backend services.

## Project Structure
The frontend is a Next.js app organized under app/ with route groups and shared components. The backend exposes REST endpoints via Express routes and services.

```mermaid
graph TB
subgraph "Frontend Pages"
A["(main)/page.tsx"]
B["(main)/planner/page.tsx"]
C["(main)/stores/page.tsx"]
D["(main)/history/page.tsx"]
E["login/page.tsx"]
F["register/page.tsx"]
G["onboarding/page.tsx"]
end
subgraph "Shared UI"
H["components/TabBar.tsx"]
I["components/Providers.tsx"]
J["components/StoresMap.tsx"]
K["components/ProgressBar.tsx"]
end
subgraph "API Layer"
L["lib/api.ts"]
M["lib/hooks.ts"]
N["lib/types.ts"]
end
A --> H
B --> H
C --> H
D --> H
E --> L
F --> L
G --> L
B --> L
C --> L
D --> L
L --> M
L --> N
```

**Diagram sources**
- [layout.tsx](file://Frontend/studentbite/app/(main)/layout.tsx)
- [page.tsx](file://Frontend/studentbite/app/(main)/page.tsx)
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [history/page.tsx](file://Frontend/studentbite/app/(main)/history/page.tsx)
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [onboarding/page.tsx](file://Frontend/studentbite/app/onboarding/page.tsx)
- [TabBar.tsx](file://Frontend/studentbite/components/TabBar.tsx)
- [Providers.tsx](file://Frontend/studentbite/components/Providers.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [ProgressBar.tsx](file://Frontend/studentbite/components/ProgressBar.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

**Section sources**
- [layout.tsx](file://Frontend/studentbite/app/(main)/layout.tsx)
- [page.tsx](file://Frontend/studentbite/app/(main)/page.tsx)
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [history/page.tsx](file://Frontend/studentbite/app/(main)/history/page.tsx)
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [onboarding/page.tsx](file://Frontend/studentbite/app/onboarding/page.tsx)
- [TabBar.tsx](file://Frontend/studentbite/components/TabBar.tsx)
- [Providers.tsx](file://Frontend/studentbite/components/Providers.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [ProgressBar.tsx](file://Frontend/studentbite/components/ProgressBar.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

## Core Components
- TabBar: Shared navigation bar used across main pages to switch between Dashboard, Planner, Stores, and History.
- Providers: Global providers wrapping the app (e.g., theme, auth context, query client).
- StoresMap: Map component used by the stores page to visualize nearby stores or locations.
- ProgressBar: Reusable progress indicator used during loading states.

These components are reused across pages to ensure consistent UX and behavior.

**Section sources**
- [TabBar.tsx](file://Frontend/studentbite/components/TabBar.tsx)
- [Providers.tsx](file://Frontend/studentbite/components/Providers.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [ProgressBar.tsx](file://Frontend/studentbite/components/ProgressBar.tsx)

## Architecture Overview
The frontend pages interact with backend services through a centralized API layer. Each page manages local state and uses hooks for data fetching and mutations. Navigation is handled by Next.js routing with a shared layout and tab-based navigation.

```mermaid
sequenceDiagram
participant User as "User"
participant Page as "Page Component"
participant API as "lib/api.ts"
participant Hook as "lib/hooks.ts"
participant Backend as "Express Routes & Services"
User->>Page : Interact (click/load)
Page->>Hook : Call hook (fetch/mutate)
Hook->>API : Request (GET/POST/PUT/DELETE)
API-->>Hook : Response data or error
Hook-->>Page : State update (data/loading/error)
Page-->>User : Render updated UI
Note over Backend : Routes delegate to services<br/>which handle business logic and DB access
```

**Diagram sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)

## Detailed Component Analysis

### Main Dashboard ((main)/page.tsx)
- Purpose: Entry point after login; displays overview metrics and quick actions.
- Data Fetching: Uses hooks to fetch user stats and recent activity from backend endpoints.
- State Management: Local state for filters and selections; global provider for user session.
- User Interactions: Clicks navigate to Planner or Stores; refresh triggers re-fetch.
- Navigation: TabBar provides quick links; direct route transitions via Next.js router.

```mermaid
flowchart TD
Start(["Dashboard Load"]) --> FetchStats["Fetch user stats"]
FetchStats --> StatsOK{"Data loaded?"}
StatsOK --> |Yes| Render["Render dashboard cards"]
StatsOK --> |No| ShowError["Show error state"]
Render --> Actions["Handle user actions"]
Actions --> NavigatePlanner["Navigate to Planner"]
Actions --> NavigateStores["Navigate to Stores"]
ShowError --> Retry["Retry action"]
Retry --> FetchStats
```

**Section sources**
- [page.tsx](file://Frontend/studentbite/app/(main)/page.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

### Meal Planner Interface ((main)/planner/page.tsx)
- Purpose: Create and manage weekly meal plans; adjust preferences and constraints.
- Data Fetching: Loads plan templates and user preferences; submits new plans via POST.
- Form Handling: Controlled inputs for meal selection, dietary filters, and portion sizes.
- State Management: Local state for form fields; optimistic updates for better UX.
- User Interactions: Drag-and-drop or select-to-add meals; save and confirm changes.
- Backend Integration: Planner routes and service orchestrate plan generation and storage.

```mermaid
sequenceDiagram
participant U as "User"
participant P as "Planner Page"
participant H as "Hooks"
participant A as "API"
participant R as "Planner Routes"
participant S as "Planner Service"
U->>P : Open planner
P->>H : UsePlanHooks()
H->>A : GET /planner/templates
A-->>H : Templates
H-->>P : Render templates
U->>P : Select meals & set constraints
P->>H : Submit plan
H->>A : POST /planner/save
A->>R : Route handler
R->>S : Generate & persist plan
S-->>R : Plan result
R-->>A : Success response
A-->>H : Updated plan
H-->>P : Update UI
```

**Diagram sources**
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)

**Section sources**
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)

### Store Comparison Page ((main)/stores/page.tsx)
- Purpose: Compare prices and availability across multiple stores; visualize on map.
- Data Fetching: Retrieves store catalogs and price lists; supports search and filters.
- Form Handling: Search input, category filters, and sort options.
- State Management: Local state for filters; cached results to reduce network calls.
- User Interactions: Click items to view details; toggle map view; export comparisons.
- Backend Integration: Store routes and service aggregate data from crawlers and databases.

```mermaid
classDiagram
class StoresPage {
+filters
+searchQuery
+results
+mapVisible
+handleSearch()
+applyFilters()
+toggleMap()
}
class StoresMap {
+renderMarkers()
+handleMarkerClick()
}
class API {
+getStores()
+getPrices()
}
class Hooks {
+useStores()
+usePrices()
}
StoresPage --> API : "uses"
StoresPage --> Hooks : "uses"
StoresPage --> StoresMap : "renders"
```

**Diagram sources**
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)

**Section sources**
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)

### History Tracking ((main)/history/page.tsx)
- Purpose: View past meal plans, purchases, and nutrition logs.
- Data Fetching: Paginated list of historical entries; detail view on click.
- State Management: Pagination state; selected item detail state.
- User Interactions: Filter by date range; drill into details; export reports.
- Backend Integration: Profile and user routes provide historical data.

```mermaid
flowchart TD
Load(["Load History"]) --> FetchList["Fetch paginated list"]
FetchList --> ListOK{"List loaded?"}
ListOK --> |Yes| RenderList["Render list"]
ListOK --> |No| ErrorState["Show error"]
RenderList --> SelectItem["Select item"]
SelectItem --> FetchDetail["Fetch detail"]
FetchDetail --> DetailOK{"Detail loaded?"}
DetailOK --> |Yes| RenderDetail["Render detail"]
DetailOK --> |No| ErrorState
```

**Section sources**
- [history/page.tsx](file://Frontend/studentbite/app/(main)/history/page.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)

### Authentication Pages (login/register)
- Login Page: Handles email/password submission, validates input, and navigates to dashboard upon success.
- Register Page: Collects user details, validates, creates account, and redirects to onboarding or dashboard.
- Data Fetching: Auth routes handle token issuance and user profile retrieval.
- Form Handling: Controlled inputs with real-time validation; error messages displayed inline.
- State Management: Local form state; global auth context for session persistence.
- Navigation: Redirects based on auth status and user flow.

```mermaid
sequenceDiagram
participant U as "User"
participant L as "Login Page"
participant R as "Register Page"
participant A as "API"
participant AR as "Auth Routes"
participant AS as "AuthService"
U->>L : Enter credentials
L->>A : POST /auth/login
A->>AR : Route handler
AR->>AS : Authenticate
AS-->>AR : Token + user
AR-->>A : Success
A-->>L : Set session
L-->>U : Redirect to dashboard
U->>R : Fill registration form
R->>A : POST /auth/register
A->>AR : Route handler
AR->>AS : Create user
AS-->>AR : Success
AR-->>A : Redirect info
A-->>R : Redirect to onboarding
```

**Diagram sources**
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)

**Section sources**
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)

### Onboarding Flow (onboarding/page.tsx)
- Purpose: Guided setup for new users; collects preferences, dietary restrictions, and goals.
- Data Fetching: Optional pre-filled data from profile if available.
- Form Handling: Multi-step wizard with validation and progress indication.
- State Management: Step state persisted locally until submission; final submission updates profile.
- User Interactions: Next/back navigation; skip optional steps; save progress.
- Backend Integration: Profile routes update user preferences.

```mermaid
flowchart TD
Start(["Onboarding Start"]) --> Step1["Step 1: Basic Info"]
Step1 --> Validate1{"Valid?"}
Validate1 --> |No| ShowErr1["Show errors"]
Validate1 --> |Yes| Step2["Step 2: Dietary Preferences"]
Step2 --> Validate2{"Valid?"}
Validate2 --> |No| ShowErr2["Show errors"]
Validate2 --> |Yes| Step3["Step 3: Goals"]
Step3 --> Submit["Submit profile"]
Submit --> Success["Redirect to dashboard"]
ShowErr1 --> Step1
ShowErr2 --> Step2
```

**Section sources**
- [onboarding/page.tsx](file://Frontend/studentbite/app/onboarding/page.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)

## Dependency Analysis
Pages depend on shared components and the API layer. Backend routes delegate to services that implement business logic and data access.

```mermaid
graph LR
Dashboard["Dashboard Page"] --> TabBar["TabBar"]
Planner["Planner Page"] --> TabBar
Stores["Stores Page"] --> TabBar
Stores --> StoresMap
History["History Page"] --> TabBar
Login["Login Page"] --> API["lib/api.ts"]
Register["Register Page"] --> API
Onboarding["Onboarding Page"] --> API
API --> Hooks["lib/hooks.ts"]
API --> Types["lib/types.ts"]
Backend["Backend Routes"] --> Services["Backend Services"]
```

**Diagram sources**
- [page.tsx](file://Frontend/studentbite/app/(main)/page.tsx)
- [planner/page.tsx](file://Frontend/studentbite/app/(main)/planner/page.tsx)
- [stores/page.tsx](file://Frontend/studentbite/app/(main)/stores/page.tsx)
- [history/page.tsx](file://Frontend/studentbite/app/(main)/history/page.tsx)
- [login/page.tsx](file://Frontend/studentbite/app/login/page.tsx)
- [register/page.tsx](file://Frontend/studentbite/app/register/page.tsx)
- [onboarding/page.tsx](file://Frontend/studentbite/app/onboarding/page.tsx)
- [TabBar.tsx](file://Frontend/studentbite/components/TabBar.tsx)
- [StoresMap.tsx](file://Frontend/studentbite/components/StoresMap.tsx)
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)

**Section sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)
- [AuthRoutes.ts](file://Backend/src/routes/AuthRoutes.ts)
- [PlannerRoutes.ts](file://Backend/src/routes/PlannerRoutes.ts)
- [StoreRoutes.ts](file://Backend/src/routes/StoreRoutes.ts)
- [ProfileRoutes.ts](file://Backend/src/routes/ProfileRoutes.ts)
- [UserRoutes.ts](file://Backend/src/routes/UserRoutes.ts)
- [AuthService.ts](file://Backend/src/services/AuthService.ts)
- [PlannerService.ts](file://Backend/src/services/PlannerService.ts)
- [StoreService.ts](file://Backend/src/services/StoreService.ts)
- [UserService.ts](file://Backend/src/services/UserService.ts)

## Performance Considerations
- Prefer lazy loading for heavy components like maps and charts.
- Cache frequently accessed data using hooks and local storage where appropriate.
- Debounce search inputs to reduce network requests.
- Implement pagination and virtualization for large lists.
- Optimize images and assets; use efficient formats and compression.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Network Errors: Check API responses and status codes; retry failed requests with backoff.
- Validation Errors: Ensure form fields match expected types and constraints; display clear messages.
- State Inconsistencies: Reset local state on navigation; avoid stale data by invalidating caches.
- Auth Issues: Verify tokens and session state; handle expiration gracefully.

**Section sources**
- [api.ts](file://Frontend/studentbite/lib/api.ts)
- [hooks.ts](file://Frontend/studentbite/lib/hooks.ts)
- [types.ts](file://Frontend/studentbite/lib/types.ts)

## Conclusion
StudentBite’s page components are structured around reusable UI elements and a centralized API layer. Each page manages its own state while leveraging shared hooks and providers for consistency. Clear separation between frontend pages and backend services ensures maintainability and scalability. Following the documented patterns will help extend functionality and improve reliability.

[No sources needed since this section summarizes without analyzing specific files]