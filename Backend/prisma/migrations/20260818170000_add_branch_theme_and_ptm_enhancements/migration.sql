-- CreateEnum
CREATE TYPE "PtmStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable: Add branch-level theme color to School
ALTER TABLE "School" ADD COLUMN "themeColor" TEXT;

-- AlterTable: Enhance PTMSession with description, status, teacher, sections, createdAt
ALTER TABLE "PTMSession" ADD COLUMN "description" TEXT;
ALTER TABLE "PTMSession" ADD COLUMN "status" "PtmStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "PTMSession" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "PTMSession" ADD COLUMN "sectionIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "PTMSession" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PTMSession_teacherId_idx" ON "PTMSession"("teacherId");

-- AddForeignKey
ALTER TABLE "PTMSession" ADD CONSTRAINT "PTMSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
