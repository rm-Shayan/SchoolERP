-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('SETUP_PENDING', 'ACTIVE', 'PARTIALLY_BLOCKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedByName" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "status" "OrgStatus" NOT NULL DEFAULT 'SETUP_PENDING';

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedByName" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedByName" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedByName" TEXT,
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "blockedByName" TEXT,
ADD COLUMN     "blockedReason" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "organizationId" TEXT,
    "schoolId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_idx" ON "AuditLog"("schoolId");
