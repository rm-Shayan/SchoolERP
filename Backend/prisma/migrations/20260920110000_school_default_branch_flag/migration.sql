-- 1) A branch can now be flagged as the organization's main campus.
--    This is an explicit business decision ("this is our head branch"), NOT a
--    derived value any more. It holds the data seeded at organization
--    creation (SMTP + Cloudinary credentials).
--    Nothing here moves it automatically - a deleted default branch leaves the
--    flag unset until a Super Admin picks a new one.
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "isDefaultBranch" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: flag the earliest branch of each organization, matching the branch
-- whose credentials were already seeded and whose principal became the owner.
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "School"
)
UPDATE "School" s
SET "isDefaultBranch" = true
FROM ranked r
WHERE r.id = s."id" AND r.rn = 1;

-- At most one default branch per organization (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS "School_one_default_branch_per_org_key"
  ON "School"("organizationId") WHERE "isDefaultBranch" = true;

CREATE INDEX IF NOT EXISTS "School_isDefaultBranch_idx" ON "School"("isDefaultBranch");