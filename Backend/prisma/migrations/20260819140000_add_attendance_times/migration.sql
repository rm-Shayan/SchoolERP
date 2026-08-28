-- AlterTable
ALTER TABLE "School" ADD COLUMN "attendanceStartTime" TEXT NOT NULL DEFAULT '07:45';
ALTER TABLE "School" ADD COLUMN "attendanceAlertTime" TEXT NOT NULL DEFAULT '09:30';