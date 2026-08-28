-- AlterTable: har school ka monthly voucher due day (default 10 = 10th)
ALTER TABLE "School" ADD COLUMN "monthlyFeeDueDay" INTEGER NOT NULL DEFAULT 10;

-- AlterTable: overdue reminder sirf EK dafa jaye (once-only dedup marker)
ALTER TABLE "FeeRecord" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
