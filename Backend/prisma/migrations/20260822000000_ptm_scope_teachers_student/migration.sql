-- PtmScope enum: audience of a PTM session
-- WHOLE_SCHOOL = all classes/sections, CLASS_RANGE = class span (e.g. 1..4) all sections,
-- SECTIONS = specific section(s), STUDENT = a single child.
CREATE TYPE "PtmScope" AS ENUM ('WHOLE_SCHOOL', 'CLASS_RANGE', 'SECTIONS', 'STUDENT');

ALTER TABLE "PTMSession" ADD COLUMN "scope" "PtmScope" NOT NULL DEFAULT 'WHOLE_SCHOOL';
ALTER TABLE "PTMSession" ADD COLUMN "classIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "PTMSession" ADD COLUMN "studentId" TEXT;
ALTER TABLE "PTMSession" ADD COLUMN "teacherIds" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: old rows with explicit sectionIds were section-scoped, rest whole-school
UPDATE "PTMSession" SET "scope" = CASE
  WHEN array_length("sectionIds", 1) > 0 THEN 'SECTIONS'::"PtmScope"
  ELSE 'WHOLE_SCHOOL'::"PtmScope" END;

-- Backfill: move the single attending teacher into the new list
UPDATE "PTMSession" SET "teacherIds" = ARRAY["teacherId"] WHERE "teacherId" IS NOT NULL;

-- Replace single-teacher FK with the teacherIds list
ALTER TABLE "PTMSession" DROP CONSTRAINT IF EXISTS "PTMSession_teacherId_fkey";
DROP INDEX IF EXISTS "PTMSession_teacherId_idx";
ALTER TABLE "PTMSession" DROP COLUMN IF EXISTS "teacherId";
