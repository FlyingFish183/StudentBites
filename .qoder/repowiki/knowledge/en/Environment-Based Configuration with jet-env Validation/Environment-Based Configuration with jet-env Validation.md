---
kind: configuration_system
name: Environment-Based Configuration with jet-env Validation
category: configuration_system
scope:
    - '**'
source_files:
    - Backend/config/.env.development
    - Backend/config/.env.production
    - Backend/config/.env.test
    - Backend/.env
    - Backend/src/common/constants/env.ts
    - Backend/package.json
    - Backend/prisma/schema.prisma
    - Frontend/studentbite/next.config.ts
---

The StudentBites monorepo uses a layered, environment-file-based configuration system for the backend and a minimal process.env approach for the frontend.

**Backend configuration loading**
- Environment files are organized per-environment under `Backend/config/`: `.env.development`, `.env.production`, `.env.test`. Each file defines the same set of keys: `NODE_ENV`, `PORT`, `HOST`, `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECURE`, and `JET_LOGGER_*` settings (mode, filepath, timestamp, format).
- A root `Backend/.env` holds only the Prisma CLI `DATABASE_URL`, with an explicit comment that runtime uses `config/.env.*`.
- Configuration is loaded at startup via `cross-env DOTENV_CONFIG_PATH=./config/.env.<env>` in npm scripts (`dev:basic`, `start`, `db:seed`, `crawl`). The `start` script additionally passes `-r dotenv/config` to Node so both `dotenv` and `DOTENV_CONFIG_PATH` apply.
- Typed validation is centralized in `Backend/src/common/constants/env.ts`, which uses `jet-env` with `tspo` validators (`num`, `str`, `bool`) and a custom enum validator for `NodeEnv` against a `NodeEnvs` constant. The validated `EnvVars` object is imported by `main.ts` and `server.ts` to drive server port, conditional middleware (morgan in dev, helmet in production), logger behavior, and crawler scheduling.
- Database connection strings are consumed both by Prisma (`prisma/schema.prisma` reads `DATABASE_URL` via `env()`) and by application code through the same validated `EnvVars.DatabaseUrl`.

**Frontend configuration**
- The Next.js app reads a single `BACKEND_URL` from `process.env` in `next.config.ts` (defaulting to `http://localhost:3001`) and rewrites `/api/*` requests to it, avoiding CORS and sharing cookies.
- No dedicated `.env` files are committed for the frontend; values are expected to be provided by the host environment or deployment platform.

**Architecture and conventions**
- All runtime configuration flows through environment variables — no JSON/YAML config files are read at runtime.
- Per-environment `.env` files live in a dedicated `config/` directory rather than the project root, keeping secrets out of version control (the root `.env` is gitignored).
- Configuration values are strictly typed and validated at import time via `jet-env`; invalid values will throw during module initialization, failing fast before the server starts.
- Conditional behavior is gated on `EnvVars.NodeEnv` (development/test/production), controlling logging verbosity, security headers, and background job scheduling.

**Constraints enforced by the codebase**
- `NODE_ENV` must be one of `development`, `test`, or `production` (enforced by the `tspo.isValue(NodeEnvs, v)` validator).
- `Port` must be a number, `DatabaseUrl` and `JwtSecret` must be strings, and `CookieSecure` must be a boolean — all enforced by `jet-env` validators.
- Tests run with `NODE_ENV=test` and use a separate `_test` database suffix in `DATABASE_URL`.
- Production builds require `COOKIE_SECURE=true` and switch the logger to file mode.