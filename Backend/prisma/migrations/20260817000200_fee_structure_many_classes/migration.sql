-- CreateTable (implicit m2m: Class <-> FeeStructure — ek structure kai classes par apply)
CREATE TABLE "_ClassToFeeStructure" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClassToFeeStructure_AB_pk" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClassToFeeStructure_B_index" ON "_ClassToFeeStructure"("B");

-- AddForeignKey
ALTER TABLE "_ClassToFeeStructure" ADD CONSTRAINT "_ClassToFeeStructure_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassToFeeStructure" ADD CONSTRAINT "_ClassToFeeStructure_B_fkey" FOREIGN KEY ("B") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing single-class structures apni class se link ho jati hain
INSERT INTO "_ClassToFeeStructure" ("A", "B")
SELECT "classId", id FROM "FeeStructure" WHERE "classId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "FeeStructure" DROP CONSTRAINT "FeeStructure_classId_fkey";

-- DropIndex
DROP INDEX "FeeStructure_classId_idx";

-- AlterTable
ALTER TABLE "FeeStructure" DROP COLUMN "classId";
