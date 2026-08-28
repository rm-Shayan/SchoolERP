-- Promoted org-level admins (organizationId != null) ab ORG_ADMIN role rakhenge —
-- SUPER_ADMIN sirf platform owner (organizationId = null) ke liye reserved hai.
-- (Platform owner seed se banta hai: superadmin@schoolerp.com — organizationId null,
--  isliye ye UPDATE usay kabhi touch nahi karta.)
UPDATE "User"
SET role = 'ORG_ADMIN'
WHERE role = 'SUPER_ADMIN' AND "organizationId" IS NOT NULL;
