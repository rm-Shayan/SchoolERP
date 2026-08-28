-- AlterTable: Add late fee fields to FeeLineItem
ALTER TABLE "FeeLineItem" ADD COLUMN "isLateFee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FeeLineItem" ADD COLUMN "lateFeeDays" INTEGER NOT NULL DEFAULT 0;
