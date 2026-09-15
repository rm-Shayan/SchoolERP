-- Monthly attendance matrix + student directory sort by roll number within a
-- school on the largest table. Single composite index — no index bloat on
-- other tables, so write amplification stays minimal.

CREATE INDEX "Student_schoolId_rollNumber_idx" ON "Student"("schoolId", "rollNumber");