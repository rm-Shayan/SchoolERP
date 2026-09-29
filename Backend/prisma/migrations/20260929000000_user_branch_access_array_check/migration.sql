-- branchAccess must be either SQL NULL or a JSON array of school ids.
-- Scalar values (e.g. JSON null / string) broke raw SQL that expands the array
-- (GET /organizations/health → 22023 "cannot extract elements from a scalar").

-- 1. Normalize existing non-array values to SQL NULL.
UPDATE "User"
SET "branchAccess" = NULL
WHERE "branchAccess" IS NOT NULL
  AND jsonb_typeof("branchAccess") <> 'array';

-- 2. Prevent non-array values from being stored again.
ALTER TABLE "User"
  ADD CONSTRAINT "User_branchAccess_array_check"
  CHECK ("branchAccess" IS NULL OR jsonb_typeof("branchAccess") = 'array');
