# Rennova data store

`schema.prisma` is the local Vibecode preview schema and uses SQLite because the
workspace runtime provisions a file database automatically.

`schema.postgresql.prisma` is the canonical production datasource. It contains
the same portable application models and points Prisma at PostgreSQL. Production
deployment must provide a managed PostgreSQL `DATABASE_URL` and generate/migrate
with that schema; SQLite must not be used as the Rennova production database.

The account model is intentionally role-based: a `User` can own multiple
`UserRole` rows and selects an `activeRole`. A contractor profile is an optional
capability attached to the same user—not a separate login.

Production setup commands are explicit so deployment cannot silently use the
preview datasource:

```sh
bun run prisma:generate:postgres
bun run prisma:deploy:postgres
```
