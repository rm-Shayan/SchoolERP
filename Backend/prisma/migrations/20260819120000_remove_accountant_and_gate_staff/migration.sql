-- Remove ACCOUNTANT and GATE_STAFF roles.
-- Gate scanning is now done by RECEPTIONIST; finance is handled by branch ADMIN.
-- Neon does not support DROP VALUE on enums, so the DB enum values are kept
-- but no longer referenced in the Prisma schema (same pattern as ORG_ADMIN).

UPDATE "User" SET "role" = 'RECEPTIONIST' WHERE "role" = 'GATE_STAFF';
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'ACCOUNTANT';