-- CreateEnum
CREATE TYPE "CircularAudience" AS ENUM ('PARENTS', 'TEACHERS', 'ALL');

-- AlterTable
ALTER TABLE "Circular" ADD COLUMN "audience" "CircularAudience" NOT NULL DEFAULT 'PARENTS';