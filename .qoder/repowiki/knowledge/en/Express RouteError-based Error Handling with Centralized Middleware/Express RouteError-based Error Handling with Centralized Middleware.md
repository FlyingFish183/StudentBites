---
kind: error_handling
name: Express RouteError-based Error Handling with Centralized Middleware
category: error_handling
scope:
    - '**'
source_files:
    - Backend/src/common/utils/route-errors.ts
    - Backend/src/common/constants/HttpStatusCodes.ts
    - Backend/src/server.ts
    - Backend/src/services/AuthService.ts
    - Backend/src/routes/common/auth.ts
    - Backend/src/routes/common/parseReq.ts
    - Backend/tests/common/error-utils.ts
---

The StudentBites backend uses a structured, class-based error handling approach built around Express middleware and custom error types.

**Core error types and hierarchy**
- `RouteError` (in `src/common/utils/route-errors.ts`) is the base error class extending `Error`, carrying an HTTP status code from the centralized `HttpStatusCodes` constant map. Every business-layer error thrown by services extends this type.
- `ValidationError` extends `RouteError` and wraps validation failures from `jet-validators`, serializing the parse errors into a JSON message body with a 400 status.

**Centralized error propagation**
- A single Express error-handling middleware in `src/server.ts` catches all unhandled errors. It logs via `jet-logger` (skipped in test mode) and responds with `{ error: err.message }` for `RouteError` instances, using the embedded status code. Non-`RouteError` exceptions are passed through to the next handler via `next(err)`.
- Routes and services throw `RouteError` (or `ValidationError`) rather than returning error objects, letting the global middleware format responses uniformly.

**Status code management**
- `src/common/constants/HttpStatusCodes.ts` provides a comprehensive, typed enum-like object of all standard HTTP status codes, used consistently across services when constructing `RouteError` instances.

**Service-layer conventions**
- Each service defines a local `Errors` const mapping domain-specific messages (e.g., `EMAIL_TAKEN`, `BAD_CREDENTIALS`, `USER_NOT_FOUND`) and throws `new RouteError(HttpStatusCodes.XXX, Errors.KEY)` for every failure path. This pattern appears in `AuthService`, `LogService`, `PlannerService`, `ProfileService`, `StoreService`, and `UserService`.
- Request validation errors are raised as `ValidationError` from `parseReq.ts`, which wraps `jet-validators` `ParseError` arrays.

**Authentication error handling**
- The `requireAuth` middleware in `src/routes/common/auth.ts` handles JWT verification failures inline, responding directly with 401 JSON bodies (`{ error: '...' }`) instead of throwing `RouteError`, representing a deviation from the central error-flow convention.

**Crawler error isolation**
- Background crawlers (`bachhoaxanh.ts`, `coopmart.ts`, `winmart.ts`, `runner.ts`) use try/catch blocks to swallow errors locally so crawler failures do not crash the server process; they log via `jet-logger` rather than propagating errors to the API layer.

**Frontend expectations**
- The frontend expects a consistent `{ error: string }` response shape for failed requests, matching what the global error middleware produces for `RouteError` instances.

**Testing support**
- `tests/common/error-utils.ts` provides a helper `parseValidationError` that deserializes the JSON-stringified `ValidationError` message body, enabling tests to assert on validation error details.