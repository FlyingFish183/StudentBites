---
kind: external_dependency
name: PostgreSQL Database
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Primary data store for StudentBites application. Dockerized PostgreSQL 16 container running on port 5434 with dedicated volume for persistence. Prisma ORM used as database client with schema defined in schema.prisma. Database credentials configured via DATABASE_URL environment variable.