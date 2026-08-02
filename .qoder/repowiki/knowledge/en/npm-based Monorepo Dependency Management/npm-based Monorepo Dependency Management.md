---
kind: dependency_management
name: npm-based Monorepo Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - Backend/package.json
    - Backend/package-lock.json
    - Frontend/studentbite/package.json
    - Frontend/studentbite/package-lock.json
---

The StudentBites monorepo manages dependencies through npm with a per-package approach: each subproject (Backend and Frontend/studentbite) maintains its own `package.json` and `package-lock.json`. There is no shared workspace configuration, root-level manifest, or monorepo tooling such as npm workspaces, pnpm, yarn, or Turborepo.

**Package managers and lockfiles**
- Both packages use npm with lockfileVersion 3 (`package-lock.json`). The Backend package declares an `engines.node >= 16.0.0` constraint.
- No `.npmrc`, `pnpm-workspace.yaml`, `yarn.lock`, or `go.mod` files exist at the repository root or within subpackages, so there is no custom registry, private scope, or vendoring strategy configured.

**Dependency declaration patterns**
- Dependencies are declared in two categories per package:
  - `dependencies`: runtime libraries (e.g., Express, Prisma client, Axios on the Backend; Next.js, React, TanStack Query on the Frontend).
  - `devDependencies`: build, lint, test, and type tooling (TypeScript, ESLint, Vitest, Prisma CLI, etc.).
- Version ranges use caret (`^`) for most packages, allowing minor/patch updates while pinning major versions. A few packages (Next.js, React, react-dom) are pinned to exact versions in the Frontend.
- The Backend uses `module-alias` with `_moduleAliases` mapping `@src` to `dist`, indicating compiled output paths rather than source imports during development.

**Scripts and update workflow**
- The Backend exposes a `clean-install` script that removes `node_modules` and `package-lock.json` before reinstalling, suggesting manual dependency resets are expected.
- Development scripts rely on `cross-env` for environment variable injection and `ts-node`/`nodemon` for hot-reloading TypeScript sources.
- Database migrations and seeding are handled via Prisma CLI scripts (`db:migrate`, `db:seed`), which are separate from npm dependency management but part of the overall build/runtime setup.

**No vendoring or private registries**
- All resolved packages point to `https://registry.npmjs.org` in the lockfiles, confirming reliance on the public npm registry.
- No `vendor/` directories, `package.json` overrides, or scoped registries are present.

**Constraints observed**
- Node.js version is constrained to `>=16.0.0` in the Backend's `engines` field.
- Each subproject must be installed independently; there is no top-level `npm install` that resolves all packages together.