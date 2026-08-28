-- Applicant documents (B-form / birth certificate / other) — admission file
CREATE TABLE "ApplicantDocument" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicantDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicantDocument_applicantId_idx" ON "ApplicantDocument"("applicantId");

ALTER TABLE "ApplicantDocument" ADD CONSTRAINT "ApplicantDocument_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
