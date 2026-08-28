-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_DELIVERED', 'DELIVERING', 'DELIVERED', 'FAILED');

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "logoUrl" TEXT;
