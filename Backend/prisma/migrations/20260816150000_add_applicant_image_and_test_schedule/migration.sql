-- Applicant: student photo (carried to Student on enroll) + admission test slot fields
ALTER TABLE "Applicant" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "testDate" TIMESTAMP(3);
ALTER TABLE "Applicant" ADD COLUMN "testTime" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "testVenue" TEXT;
ALTER TABLE "Applicant" ADD COLUMN "testMarks" TEXT;
