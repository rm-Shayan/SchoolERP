-- Shared parent/student portal password (hashed). NULL = default behaviour
-- where the school CODE itself acts as the shared portal password.
ALTER TABLE "School" ADD COLUMN "portalPassword" TEXT;
