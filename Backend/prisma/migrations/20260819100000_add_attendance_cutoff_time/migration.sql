-- AlterTable: Add attendance cutoff time to School
ALTER TABLE "School" ADD COLUMN "attendanceCutoffTime" TEXT NOT NULL DEFAULT '08:30';
