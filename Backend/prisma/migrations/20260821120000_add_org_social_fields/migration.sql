-- AlterTable: Add social & contact columns to Organization
ALTER TABLE "Organization" ADD COLUMN "phone" TEXT;
ALTER TABLE "Organization" ADD COLUMN "email" TEXT;
ALTER TABLE "Organization" ADD COLUMN "website" TEXT;
ALTER TABLE "Organization" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "twitterUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "youtubeUrl" TEXT;
