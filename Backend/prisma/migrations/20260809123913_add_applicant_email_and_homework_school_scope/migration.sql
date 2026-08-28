/*
  Warnings:

  - Added the required column `schoolId` to the `HomeworkBroadcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "parentEmail" TEXT;

-- AlterTable
ALTER TABLE "HomeworkBroadcast" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "HomeworkBroadcast_schoolId_idx" ON "HomeworkBroadcast"("schoolId");

-- CreateIndex
CREATE INDEX "HomeworkBroadcast_sectionId_idx" ON "HomeworkBroadcast"("sectionId");

-- AddForeignKey
ALTER TABLE "HomeworkBroadcast" ADD CONSTRAINT "HomeworkBroadcast_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkBroadcast" ADD CONSTRAINT "HomeworkBroadcast_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
