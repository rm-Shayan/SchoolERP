-- Additional performance indexes for hot query paths (backend latency audit).
-- FeePayment.paidAt — revenue dashboards & payment lists filter/sort by paid date.
-- SubstituteRecord.date / teacherId — substitute list & availability-overlap queries.

CREATE INDEX "FeePayment_paidAt_idx" ON "FeePayment"("paidAt");

CREATE INDEX "SubstituteRecord_date_idx" ON "SubstituteRecord"("date");

CREATE INDEX "SubstituteRecord_teacherId_idx" ON "SubstituteRecord"("teacherId");