-- Per-tenant Cloudinary credentials (media storage).
-- Row mojood = org apne cloudinary account par upload karta hai;
-- row absent = platform (Super Admin env) creds fallback.
CREATE TABLE "OrgStorageSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CLOUDINARY',
    "cloudName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecretEnc" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgStorageSetting_pkey" PRIMARY KEY ("id")
);

-- Ek org ka ek hi storage setting ho sakta hai (1:1).
CREATE UNIQUE INDEX "OrgStorageSetting_organizationId_key" ON "OrgStorageSetting"("organizationId");

ALTER TABLE "OrgStorageSetting" ADD CONSTRAINT "OrgStorageSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
