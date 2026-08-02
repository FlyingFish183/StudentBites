---
kind: build_system
name: Node.js Monorepo Build & Deployment (Backend + Next.js Frontend)
category: build_system
scope:
    - '**'
source_files:
    - Backend/package.json
    - Frontend/studentbite/package.json
    - Backend/tsconfig.json
    - Backend/vitest.config.mts
    - Backend/docker-compose.yml
    - Frontend/studentbite/next.config.ts
---

The StudentBites monorepo uses a straightforward Node.js-based build system split across two independent npm projects — an Express/Prisma backend and a Next.js frontend — with no shared Makefile or CI orchestration at the repository root.

**Build tools and scripts**
- Backend: TypeScript compilation via `tsc` using two configs (`tsconfig.json` for development, `tsconfig.prod.json` for production). The `build` script chains linting, compilation, static asset copying, and Prisma artifact creation. Development runs through `ts-node` with SWC acceleration, `nodemon` file watching, and `concurrently` to also start Prisma migration sync and BrowserSync.
- Frontend: Standard Next.js CLI (`next dev`, `next build`, `next start`) with ESLint configured via `eslint.config.mjs`.
- Testing: Vitest in the backend (`vitest.config.mts`) with globals enabled, Node environment, dotenv loading from `config/.env.test`, and isolated test execution. Supertest is used for HTTP assertions.
- Linting/formatting: ESLint 10 (TypeScript-enabled) and Prettier with import sorting plugin; both are invoked as npm scripts rather than pre-commit hooks.

**Environment and configuration**
- Backend loads environment files per mode via `cross-env DOTENV_CONFIG_PATH=./config/.env.{development,production,test}` and `.env` at the project root. A separate `ts-node` require hook loads `dotenv/config` and `tsconfig-paths/register` so source-path aliases like `@src/*` resolve during development and tests.
- Production runtime uses `module-alias/register` to remap `@src` to `dist` when running compiled output.
- Frontend proxies `/api/*` requests to the backend URL via Next.js rewrites, defaulting to `http://localhost:3001`.

**Database and containerization**
- PostgreSQL 16 Alpine image managed by `docker-compose.yml` under `Backend/`. The compose service exposes port 5434 on the host and persists data in a named volume `studentbites-pgdata`. No Dockerfile exists for either service; deployment is not containerized in this repo.
- Database schema migrations are handled by Prisma (`prisma migrate dev`, `prisma seed`).

**Conventions and constraints**
- Each subproject manages its own dependencies, scripts, and build pipeline independently — there is no top-level `package.json`, `Makefile`, or monorepo tool (pnpm workspaces, Nx, Turborepo, etc.).
- Backend enforces strict TypeScript (`strict: true`), targets ES2020 CommonJS modules, and excludes generated/public assets from compilation.
- Tests are isolated per run and load their own `.env.test`; the test setup file `tests/support/agent.ts` provides shared Supertest agents.
- No CI/CD pipelines, GitHub Actions workflows, or release automation are present in the repository.