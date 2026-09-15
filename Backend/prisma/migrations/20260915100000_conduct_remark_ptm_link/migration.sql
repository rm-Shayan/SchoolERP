-- 1. Saare purane remarks hatao (user request: "remarks db se delete krdena").
--    Naye remarks ab academic year + PTM session ke saath create honge.
DELETE FROM "ConductRemark";

-- 2. PTM session link column (kis PTM me ye remark likha gaya).
--    Remark delete hone par PTM kuch nahi hota; PTM delete hone par remarks
--    bachte hain (SET NULL) — conduct history kabhi data-loss nahi karti.
ALTER TABLE "ConductRemark" ADD COLUMN "ptmSessionId" TEXT;

CREATE INDEX "ConductRemark_ptmSessionId_idx" ON "ConductRemark"("ptmSessionId");

ALTER TABLE "ConductRemark"
  ADD CONSTRAINT "ConductRemark_ptmSessionId_fkey"
  FOREIGN KEY ("ptmSessionId") REFERENCES "PTMSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;