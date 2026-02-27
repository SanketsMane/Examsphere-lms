# Deep Analysis: Migrating to MySQL

## Summary
The project currently uses PostgreSQL. Migrating to MySQL is technically possible but requires refactoring several schema elements and configurations.

## Critical Technical Hurdles

### 1. Scalar Arrays
PostgreSQL's `String[]` columns are heavily used (e.g., tags, expertise). MySQL does not support these. They must be migrated to child tables or JSON columns.

### 2. Provider Configuration
The authentication system (BetterAuth) has a hardcoded reference to "postgresql" in `lib/auth.ts`.

### 3. Data Migration
Schema migrations from PG to MySQL involve syntax changes (different index definitions, auto-increment vs serial, etc.).

## Recommendation
If there is no strict requirement for MySQL, PostgreSQL is recommended as it natively supports the current data structures. If MySQL is required, allow 3-5 days for careful refactoring and testing.
