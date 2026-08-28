-- SMTP tier: tenant PRIMARY ke saath SECONDARY (failover) creds bhi de sakta hai.
-- Transport chain: Branch Primary -> Org Primary -> Org Secondary -> Platform.
CREATE TYPE "SmtpTier" AS ENUM ('PRIMARY', 'SECONDARY');

ALTER TABLE "SmtpSetting" ADD COLUMN "tier" "SmtpTier" NOT NULL DEFAULT 'PRIMARY';

CREATE INDEX "SmtpSetting_org_school_tier_idx" ON "SmtpSetting"("organizationId", "schoolId", "tier");
