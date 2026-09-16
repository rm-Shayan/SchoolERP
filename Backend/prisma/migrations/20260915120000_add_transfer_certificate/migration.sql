-- Transfer Certificate storage. One row per student (unique studentId) so TC
-- issuance is idempotent: issued once, re-downloadable forever, never duplicated.

CREATE TABLE "TransferCertificate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tcNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedById" TEXT,
    "issuedByName" TEXT,
    CONSTRAINT "TransferCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransferCertificate_studentId_key" ON "TransferCertificate"("studentId");
CREATE UNIQUE INDEX "TransferCertificate_tcNumber_key" ON "TransferCertificate"("tcNumber");
CREATE INDEX "TransferCertificate_schoolId_idx" ON "TransferCertificate"("schoolId");

ALTER TABLE "TransferCertificate" ADD CONSTRAINT "TransferCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;