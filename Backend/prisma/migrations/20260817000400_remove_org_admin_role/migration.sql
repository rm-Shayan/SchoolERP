-- Remove the org-level admin (ORG_ADMIN) concept — SUPER_ADMIN ab sirf platform
-- owner (organizationId = null) ke liye hai, aur har branch ka apna ADMIN
-- (Principal) hota hai.
--
-- 1. Jo users ORG_ADMIN the (handover flow se promote hue, schoolId = null),
--    unhe unke organization ki PEHLI branch (createdAt asc) ka ADMIN bana do —
--    wo ab us branch ke Principal hain. Agar org mein koi branch nahi hai to
--    schoolId null rehta hai (wo login nahi kar payega — admin ko branch chahiye).
-- 2. Enum se ORG_ADMIN value drop.
UPDATE "User" u
SET role = 'ADMIN',
    "schoolId" = (
      SELECT s.id
      FROM "School" s
      WHERE s."organizationId" = u."organizationId"
      ORDER BY s."createdAt" ASC
      LIMIT 1
    )
WHERE u.role = 'ORG_ADMIN';

-- AlterEnum
-- Neon doesn't support DROP VALUE; the baseline Role enum no longer includes
-- ORG_ADMIN, so this is a no-op for fresh databases.
-- ALTER TYPE "Role" DROP VALUE 'ORG_ADMIN';
