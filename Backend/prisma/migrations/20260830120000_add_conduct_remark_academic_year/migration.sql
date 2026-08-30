-- AlterTable: Add academicYearId to ConductRemark
ALTER TABLE "ConductRemark" ADD COLUMN "academicYearId" TEXT;

-- CreateIndex
CREATE INDEX "ConductRemark_teacherId_idx" ON "ConductRemark"("teacherId");
CREATE INDEX "ConductRemark_academicYearId_idx" ON "ConductRemark"("academicYearId");

-- AddForeignKey
ALTER TABLE "ConductRemark" ADD CONSTRAINT "ConductRemark_academicYearId_fkey"
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
