-- AlterTable: Add academicYearId to PTMSession and StudyMaterial
ALTER TABLE "PTMSession" ADD COLUMN "academicYearId" TEXT;
ALTER TABLE "StudyMaterial" ADD COLUMN "academicYearId" TEXT;

-- CreateIndex
CREATE INDEX "PTMSession_academicYearId_idx" ON "PTMSession"("academicYearId");
CREATE INDEX "StudyMaterial_academicYearId_idx" ON "StudyMaterial"("academicYearId");

-- AddForeignKey
ALTER TABLE "PTMSession" ADD CONSTRAINT "PTMSession_academicYearId_fkey"
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_academicYearId_fkey"
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;