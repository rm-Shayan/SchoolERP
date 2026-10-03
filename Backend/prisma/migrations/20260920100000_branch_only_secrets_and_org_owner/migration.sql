-- 1) Org owner flag: the ADMIN account created together with the organization
--    (i.e. the principal of the organization's default/earliest branch) is the
--    only account allowed to edit organization-level settings.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isOrganizationOwner" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: owner = the oldest active ADMIN of the organization's earliest
-- branch. Exactly ONE account per organization gets the flag - the principal
-- that was created together with the organization. (Legacy data cannot tell us
-- which account that was, so oldest wins, and the tie is broken by id.)
WITH ranked_branches AS (
  SELECT DISTINCT ON ("organizationId") "id" AS school_id, "organizationId"
  FROM "School"
  ORDER BY "organizationId", "createdAt" ASC, "id" ASC
), ranked_admins AS (
  SELECT DISTINCT ON (u."organizationId") u."id"
  FROM "User" u
  JOIN ranked_branches rb
    ON rb.school_id = u."schoolId" AND rb."organizationId" = u."organizationId"
  WHERE u."role" = 'ADMIN' AND u."isActive" = true
  ORDER BY u."organizationId", u."createdAt" ASC, u."id" ASC
)
UPDATE "User" u
SET "isOrganizationOwner" = true
WHERE u."id" IN (SELECT "id" FROM ranked_admins);

-- 2) Secrets become strictly per-branch. Org-level rows (schoolId IS NULL) are
--    re-homed onto the organization's default branch, but ONLY when that branch
--    has no row for the same (category, tier) - a branch's own credentials always
--    win so nothing is silently overwritten. Leftover org rows are deleted
--    because they would otherwise bleed into every branch of the organization.
WITH ranked_branches AS (
  SELECT DISTINCT ON ("organizationId") "id" AS school_id, "organizationId"
  FROM "School"
  ORDER BY "organizationId", "createdAt" ASC, "id" ASC
)
UPDATE "OrgSecrets" os
SET "schoolId" = rb.school_id
FROM ranked_branches rb
WHERE os."schoolId" IS NULL
  AND rb."organizationId" = os."organizationId"
  AND NOT EXISTS (
    SELECT 1 FROM "OrgSecrets" existing
    WHERE existing."schoolId" = rb.school_id
      AND existing."organizationId" = os."organizationId"
      AND existing."category" = os."category"
      AND existing."tier" IS NOT DISTINCT FROM os."tier"
  );

-- Orgs with no branch at all cannot own credentials.
DELETE FROM "OrgSecrets" WHERE "schoolId" IS NULL;

ALTER TABLE "OrgSecrets" ALTER COLUMN "schoolId" SET NOT NULL;

-- Unique index with a NOT NULL schoolId is now a real per-branch guard.
CREATE UNIQUE INDEX IF NOT EXISTS "OrgSecrets_organizationId_schoolId_category_tier_key"
  ON "OrgSecrets"("organizationId", "schoolId", "category", "tier");

CREATE INDEX IF NOT EXISTS "User_isOrganizationOwner_idx" ON "User"("isOrganizationOwner");
