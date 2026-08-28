-- SectionTemplate = generic section names (A, B, C, D) only.
-- Capacity/room ab sirf per-class Section (class+section combination) par rehta hai,
-- kyunke har class ke classroom ki actual capacity alag ho sakti hai.
ALTER TABLE "SectionTemplate" DROP COLUMN "capacity";
ALTER TABLE "SectionTemplate" DROP COLUMN "roomNumber";
