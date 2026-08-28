-- Per-tenant SMTP credentials (org-level default + branch-level override).
-- Password AES-256-GCM encrypted at rest (passwordEnc), plain kabhi store nahi hota.
CREATE TYPE "EmailPriority" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW');

CREATE TABLE "SmtpSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "fromName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmtpSetting_organizationId_idx" ON "SmtpSetting"("organizationId");

ALTER TABLE "SmtpSetting" ADD CONSTRAINT "SmtpSetting_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmtpSetting" ADD CONSTRAINT "SmtpSetting_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Durable email outbox — Gmail daily limit (550-5.4.5) ya temporary SMTP
-- failure par email PENDING save hoti hai, cron agle din retry karta hai.
CREATE TABLE "PendingEmail" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "schoolId" TEXT,
    "payload" TEXT NOT NULL,
    "priority" "EmailPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingEmail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PendingEmail_status_scheduledFor_idx" ON "PendingEmail"("status", "scheduledFor");
CREATE INDEX "PendingEmail_organizationId_idx" ON "PendingEmail"("organizationId");
