-- AlterTable: due date se 3 din pehle ka reminder sirf EK dafa jaye (once-only marker)
ALTER TABLE "FeeRecord" ADD COLUMN "preDueReminderSentAt" TIMESTAMP(3);
