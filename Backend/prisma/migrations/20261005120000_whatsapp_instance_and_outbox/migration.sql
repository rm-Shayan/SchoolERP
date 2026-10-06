-- CreateEnum
CREATE TYPE "WhatsAppConnectionState" AS ENUM ('DISCONNECTED', 'AWAITING_QR', 'CONNECTED', 'FAILED');

-- AlterEnum
-- WHATSAPP credentials branch ke OWN number ke liye hain (same rule as SMTP).
ALTER TYPE "SecretCategory" ADD VALUE 'WHATSAPP';

-- CreateTable
-- Branch ka WhatsApp number. NUMBER BRANCH KA ASSET HAI, admin ka nahi —
-- is liye FK `schoolId` par hai. Admin deactivate/delete hone par instance
-- zinda rehti hai; instance sirf BRANCH delete hone par jaati hai
-- (school.service.js remove() me explicit post-commit hook).
CREATE TABLE "WhatsAppInstance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "integration" TEXT NOT NULL DEFAULT 'WHATSAPP_BAILEYS',
    "state" "WhatsAppConnectionState" NOT NULL DEFAULT 'DISCONNECTED',
    "phoneNumber" TEXT,
    "displayName" TEXT,
    "profilePicUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "qrCode" TEXT,
    "qrExpiresAt" TIMESTAMP(3),
    "lastConnectedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "dailyQuotaUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInstance_instanceName_key" ON "WhatsAppInstance"("instanceName");

-- CreateIndex
CREATE INDEX "WhatsAppInstance_schoolId_idx" ON "WhatsAppInstance"("schoolId");

-- CreateIndex
CREATE INDEX "WhatsAppInstance_organizationId_idx" ON "WhatsAppInstance"("organizationId");

-- CreateIndex
CREATE INDEX "WhatsAppInstance_state_idx" ON "WhatsAppInstance"("state");

-- AddForeignKey
ALTER TABLE "WhatsAppInstance" ADD CONSTRAINT "WhatsAppInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppInstance" ADD CONSTRAINT "WhatsAppInstance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
-- Generic outbox — PendingEmail ka sibling, lekin `channel` ke saath
-- (WHATSAPP aaj, SMS kal). Atomic-claim retry semantics wahi hain:
-- `scheduledFor` claim lock ki tarah kaam karta hai, `status` PENDING rehta hai.
CREATE TABLE "PendingMessage" (
    "id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "organizationId" TEXT,
    "schoolId" TEXT,
    "recipientAddr" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "priority" "EmailPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingMessage_status_scheduledFor_idx" ON "PendingMessage"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "PendingMessage_schoolId_idx" ON "PendingMessage"("schoolId");

-- CreateIndex
CREATE INDEX "PendingMessage_organizationId_idx" ON "PendingMessage"("organizationId");

-- CreateIndex
CREATE INDEX "PendingMessage_channel_idx" ON "PendingMessage"("channel");
