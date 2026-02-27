# Database Migration to MySQL

This plan outlines the steps required to migrate the project's database from PostgreSQL to MySQL.

## User Review Required

> [!IMPORTANT]
> **Schema Breaking Change**: MySQL does not support native string arrays (`String[]`). All 21 occurrences in the schema must be converted to `Json` columns or relational tables. I recommend converting to `Json` as it is the most efficient path for migration.

> [!WARNING]
> **Backup System Impact**: The current automated backup system (`lib/backup-system.ts`) is hardcoded to use `pg_dump` and `psql`. These will be replaced with `mysqldump` and `mysql` respectively.

## Proposed Changes

### Database Configuration

#### [MODIFY] [schema.prisma](file:///Users/sanket/Documents/Kidokool-LMS/prisma/schema.prisma)
- Change `datasource db` provider from `postgresql` to `mysql`.
- Convert all `String[]` fields to `Json` (e.g., `tags String[]` -> `tags Json`).

### Library Updates

#### [MODIFY] [auth.ts](file:///Users/sanket/Documents/Kidokool-LMS/lib/auth.ts)
- Change `prismaAdapter` provider from `postgresql` to `mysql`.

#### [MODIFY] [backup-system.ts](file:///Users/sanket/Documents/Kidokool-LMS/lib/backup-system.ts)
- Update `backupDatabase` method to use `mysqldump`.
- Update `restoreDatabase` method to use `mysql`.

### Environment Configuration

#### [MODIFY] [.env](file:///Users/sanket/Documents/Kidokool-LMS/.env)
- Update `DATABASE_URL` to use `mysql://` protocol.

## Verification Plan

### Automated Tests
- Run `npx prisma validate` to ensure the new schema is correct.
- Run `npx prisma generate` to verify the MySQL client generation.

### Manual Verification
- **Prisma Studio**: Run `npx prisma studio` to verify data can be read/written to the MySQL instance.
- **Backup Test**: Trigger a manual backup and verify the generated `.sql` file is valid MySQL.
- **Login Flow**: Verify `better-auth` functions correctly with the MySQL adapter.

## Data Migration Recommendation
Since the project has no migrations yet, the easiest path is:
1. Export PostgreSQL data.
2. Update schema and generate MySQL client.
3. Import data into MySQL (using a tool like `pg2mysql` or a custom script to handle Json conversion).
