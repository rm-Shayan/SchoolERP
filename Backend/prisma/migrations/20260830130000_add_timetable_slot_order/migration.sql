-- AlterTable
ALTER TABLE "TimetableSlot" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- UpdateIndex
CREATE INDEX IF NOT EXISTS "TimetableSlot_sectionId_dayOfWeek_order_idx" ON "TimetableSlot"("sectionId", "dayOfWeek", "order");
