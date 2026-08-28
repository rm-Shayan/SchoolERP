-- AlterTable — admission ↔ student pipeline link
ALTER TABLE "Applicant" ADD COLUMN "studentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_studentId_key" ON "Applicant"("studentId");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
