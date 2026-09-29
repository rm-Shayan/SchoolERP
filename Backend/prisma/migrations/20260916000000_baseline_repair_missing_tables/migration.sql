-- Baseline repair: ye 5 tables aur 3 enums kabhi bhi kisi CREATE TABLE/TYPE
-- migration me nahi bane the (schema.prisma me models the, par migrations chain
-- me unka CREATE statement missing tha). Isi wajah se fresh database par
-- `prisma migrate deploy` migration `20260917000000_add_ptm_study_material_academic_year`
-- par FAIL ho jata tha — woh "StudyMaterial" ko ALTER karta hai jabki table kabhi
-- create hi nahi hui.
--
-- Production (Neon) par ye tables pehle se maujood hain (wahan schema `db push`
-- se bana tha), is liye ye migration POORI tarah idempotent hai: `IF NOT EXISTS`
-- ke saath. Migrate deploy production par ise apply karega aur wo no-op rahega.
--
-- Ye `20260917000000` se PEHLE lagna zaroori hai (timestamp 20260916000000).

-- CreateEnum
-- NOTE: Postgres me `CREATE TYPE IF NOT EXISTS` exist nahi karta (unlike
-- CREATE TABLE/INDEX), is liye DO block + catalog check use kiya hai.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SecretCategory') THEN
    CREATE TYPE "SecretCategory" AS ENUM ('SMTP', 'CLOUDINARY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveStatus') THEN
    CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudyMaterialType') THEN
    CREATE TYPE "StudyMaterialType" AS ENUM ('DOCUMENT', 'VIDEO', 'IMAGE', 'LINK');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrgSecrets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schoolId" TEXT,
    "category" "SecretCategory" NOT NULL,
    "tier" "SmtpTier",
    "data" JSONB NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSecrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExamPaper" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "maxMarks" DECIMAL(5,2),
    "roomNumber" TEXT,

    CONSTRAINT "ExamPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- `academicYearId` jaan-boojh kar YAHAN nahi daala: wo column agle migration
-- `20260917000000_add_ptm_study_material_academic_year` ADD karta hai. Agar yahin
-- daal dete to fresh DB par us migration par "column already exists" fail hota.
CREATE TABLE IF NOT EXISTS "StudyMaterial" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "StudyMaterialType" NOT NULL DEFAULT 'DOCUMENT',
    "fileUrl" TEXT,
    "linkUrl" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaveRequest_studentId_idx" ON "LeaveRequest"("studentId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_parentId_idx" ON "LeaveRequest"("parentId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_schoolId_idx" ON "LeaveRequest"("schoolId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_dateFrom_dateTo_idx" ON "LeaveRequest"("dateFrom", "dateTo");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");

CREATE INDEX IF NOT EXISTS "OrgSecrets_organizationId_idx" ON "OrgSecrets"("organizationId");
CREATE INDEX IF NOT EXISTS "OrgSecrets_schoolId_idx" ON "OrgSecrets"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrgSecrets_organizationId_schoolId_category_tier_key" ON "OrgSecrets"("organizationId", "schoolId", "category", "tier");

CREATE INDEX IF NOT EXISTS "ExamPaper_examId_idx" ON "ExamPaper"("examId");
CREATE INDEX IF NOT EXISTS "ExamPaper_classId_idx" ON "ExamPaper"("classId");
CREATE INDEX IF NOT EXISTS "ExamPaper_subjectId_idx" ON "ExamPaper"("subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamPaper_examId_classId_subjectId_key" ON "ExamPaper"("examId", "classId", "subjectId");

CREATE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_classId_idx" ON "TeacherAssignment"("classId");
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_classId_subjectId_sectionId_key" ON "TeacherAssignment"("teacherId", "classId", "subjectId", "sectionId");

CREATE INDEX IF NOT EXISTS "StudyMaterial_schoolId_idx" ON "StudyMaterial"("schoolId");
CREATE INDEX IF NOT EXISTS "StudyMaterial_sectionId_idx" ON "StudyMaterial"("sectionId");
CREATE INDEX IF NOT EXISTS "StudyMaterial_subjectId_idx" ON "StudyMaterial"("subjectId");
CREATE INDEX IF NOT EXISTS "StudyMaterial_createdById_idx" ON "StudyMaterial"("createdById");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_studentId_fkey') THEN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_parentId_fkey') THEN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_schoolId_fkey') THEN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrgSecrets_organizationId_fkey') THEN
    ALTER TABLE "OrgSecrets" ADD CONSTRAINT "OrgSecrets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrgSecrets_schoolId_fkey') THEN
    ALTER TABLE "OrgSecrets" ADD CONSTRAINT "OrgSecrets_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamPaper_examId_fkey') THEN
    ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamPaper_classId_fkey') THEN
    ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamPaper_sectionId_fkey') THEN
    ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamPaper_subjectId_fkey') THEN
    ALTER TABLE "ExamPaper" ADD CONSTRAINT "ExamPaper_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAssignment_teacherId_fkey') THEN
    ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAssignment_classId_fkey') THEN
    ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAssignment_subjectId_fkey') THEN
    ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAssignment_sectionId_fkey') THEN
    ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyMaterial_schoolId_fkey') THEN
    ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyMaterial_sectionId_fkey') THEN
    ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyMaterial_subjectId_fkey') THEN
    ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyMaterial_createdById_fkey') THEN
    ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  -- `StudyMaterial_academicYearId_fkey` yahin nahi banti — wo
  -- `20260917000000_add_ptm_study_material_academic_year` ka kaam hai.
END $$;
