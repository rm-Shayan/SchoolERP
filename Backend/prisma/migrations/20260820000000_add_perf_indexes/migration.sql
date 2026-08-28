-- Add missing performance indexes (flagged in the backend latency audit).
-- FeeRecord.dueDate — used in due/overdue sweeps & reminder jobs.
-- FeeLineItem.feeStructureId — used by late-fee structure lookups.
-- ExamResult.studentId — used by result queries grouped by student.

CREATE INDEX "FeeRecord_dueDate_idx" ON "FeeRecord"("dueDate");

CREATE INDEX "FeeLineItem_feeStructureId_idx" ON "FeeLineItem"("feeStructureId");

CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult"("studentId");
