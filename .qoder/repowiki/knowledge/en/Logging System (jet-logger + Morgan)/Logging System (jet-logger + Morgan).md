---
kind: logging_system
name: Logging System (jet-logger + Morgan)
category: logging_system
scope:
    - '**'
source_files:
    - Backend/src/server.ts
    - Backend/src/main.ts
    - Backend/src/crawlers/runner.ts
    - Backend/src/crawlers/common.ts
    - Backend/package.json
---

The StudentBites backend uses a two-layer logging approach built on the `jet-logger` package for application-level structured logging and `morgan` for HTTP request logging.

**Frameworks and tools**
- `jet-logger` (v2.2.3) is the primary application logger, imported as a singleton via `import logger from 'jet-logger'` across modules.
- `morgan` (v1.11.0) is used as an Express middleware to log HTTP requests, configured with the `'dev'` format only in development (`EnvVars.NodeEnv === NodeEnvs.DEV`).
- `console.log` / `console.error` are still used in a few places (e.g., `prisma/seed.ts`), indicating incomplete migration away from bare console calls.

**Where logging is initialized and used**
- `src/server.ts` sets up the Express app, mounts `morgan('dev')` conditionally in dev, and wires a global error handler that logs uncaught errors via `logger.err(err, true)`.
- `src/main.ts` imports the logger and uses it for server startup success/failure messages and crawler scheduling decisions.
- All crawlers under `src/crawlers/*.ts` import `jet-logger` directly and emit `info`, `warn`, and `err` messages prefixed with their source site name (e.g., `[bachhoaxanh]`, `[crawler]`).
- The `LogService` and `LogRoutes` files are **not** about application logging — they implement meal-log persistence (the `/api/logs` REST endpoints for user meal history).

**Log levels and conventions**
- Three levels are consistently used: `logger.info` for normal operational messages (server start, crawler lifecycle), `logger.warn` for non-fatal issues (missing store sources, crawl errors), and `logger.err` for errors (server startup failures, unhandled exceptions). A boolean second argument (`true`) is passed to `logger.err` in error-handler and crawler-runner contexts, likely enabling stack trace output.
- Log messages follow a Vietnamese/English mixed style, often prefixed with bracketed context tags like `[crawler]`, `[bachhoaxanh]`, etc., to identify the originating subsystem.

**Environment-based behavior**
- Morgan request logging is enabled only when `NodeEnv === NodeEnvs.DEV`.
- Error logging via `logger.err` is suppressed when `NodeEnv === NodeEnvs.TEST` in both the main server startup and the global Express error handler.
- Crawler scheduling is skipped entirely in test mode.

**Frontend**
- No dedicated logging system is present in the Next.js frontend; no logger framework is imported or configured there.

**Constraints and patterns observed**
- Every module that needs logging imports the same `jet-logger` singleton rather than creating its own instance.
- There is no centralized logger configuration file; `jet-logger` appears to be used with default settings.
- Structured fields are not emitted — logs are plain text strings concatenated with template literals.