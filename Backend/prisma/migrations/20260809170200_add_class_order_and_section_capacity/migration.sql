-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "roomNumber" TEXT;
