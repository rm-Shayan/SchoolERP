-- Bank details for fee vouchers: org-level default + branch-level override.
ALTER TABLE "Organization" ADD COLUMN     "bankName" TEXT,
  ADD COLUMN     "bankAccountTitle" TEXT,
  ADD COLUMN     "bankAccountNumber" TEXT;

ALTER TABLE "School" ADD COLUMN     "bankName" TEXT,
  ADD COLUMN     "bankAccountTitle" TEXT,
  ADD COLUMN     "bankAccountNumber" TEXT;
