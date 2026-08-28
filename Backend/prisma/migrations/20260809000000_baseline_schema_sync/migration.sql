-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'GATE_STAFF', 'ACCOUNTANT', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "RemarkType" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('INQUIRY', 'TEST_SCHEDULED', 'TEST_PASSED', 'TEST_FAILED', 'FORM_SUBMITTED', 'APPROVED', 'FEE_PENDING', 'ENROLLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('PARENT_LOGIN', 'STUDENT_LOGIN');

-- CreateEnum
CREATE TYPE "ScanMethod" AS ENUM ('QR', 'RFID', 'MANUAL');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('QR_WEB_CAMERA', 'QR_HANDHELD_SCANNER', 'RFID_READER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'DROPPED_OUT', 'TRANSFERRED_OUT');

-- CreateEnum
CREATE TYPE "PromotionAction" AS ENUM ('PROMOTED', 'REPEATED', 'TRANSFERRED_SECTION', 'GRADUATED', 'DROPPED_OUT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentialsEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otpType" "OtpType" NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsappNo" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "identifierCode" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "fromSectionId" TEXT,
    "toSectionId" TEXT,
    "action" "PromotionAction" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanDevice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL DEFAULT 'QR_WEB_CAMERA',
    "deviceMac" TEXT,
    "location" TEXT,

    CONSTRAINT "ScanDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceScan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "deviceId" TEXT,
    "method" "ScanMethod" NOT NULL DEFAULT 'QR',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AttendanceScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "errorReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkBroadcast" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeworkBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeLineItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "FeeLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "FeeStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "marksObtained" DECIMAL(5,2) NOT NULL,
    "maxMarks" DECIMAL(5,2) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConductRemark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "RemarkType" NOT NULL DEFAULT 'NEUTRAL',
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConductRemark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PTMSession" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,

    CONSTRAINT "PTMSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituteRecord" (
    "id" TEXT NOT NULL,
    "timetableSlotId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "SubstituteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentWhatsappNo" TEXT NOT NULL,
    "parentAddress" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'INQUIRY',
    "advanceFeeAmount" DECIMAL(10,2),
    "advanceFeeStatus" "FeeStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE INDEX "School_organizationId_idx" ON "School"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear"("schoolId");

-- CreateIndex
CREATE INDEX "Term_academicYearId_idx" ON "Term"("academicYearId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "Section"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OtpCode_identifier_otpType_idx" ON "OtpCode"("identifier", "otpType");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_whatsappNo_key" ON "Parent"("whatsappNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_identifierCode_key" ON "Student"("identifierCode");

-- CreateIndex
CREATE INDEX "Student_identifierCode_idx" ON "Student"("identifierCode");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");

-- CreateIndex
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "PromotionRecord_studentId_idx" ON "PromotionRecord"("studentId");

-- CreateIndex
CREATE INDEX "PromotionRecord_academicYearId_idx" ON "PromotionRecord"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanDevice_deviceMac_key" ON "ScanDevice"("deviceMac");

-- CreateIndex
CREATE INDEX "ScanDevice_schoolId_idx" ON "ScanDevice"("schoolId");

-- CreateIndex
CREATE INDEX "AttendanceScan_studentId_idx" ON "AttendanceScan"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceScan_scannedAt_idx" ON "AttendanceScan"("scannedAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_key" ON "AttendanceRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "NotificationLog_schoolId_idx" ON "NotificationLog"("schoolId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "Circular_schoolId_idx" ON "Circular"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_idx" ON "FeeStructure"("schoolId");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "FeeStructure"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeRecord_studentId_idx" ON "FeeRecord"("studentId");

-- CreateIndex
CREATE INDEX "FeeRecord_status_idx" ON "FeeRecord"("status");

-- CreateIndex
CREATE INDEX "FeePayment_feeRecordId_idx" ON "FeePayment"("feeRecordId");

-- CreateIndex
CREATE INDEX "Subject_classId_idx" ON "Subject"("classId");

-- CreateIndex
CREATE INDEX "Exam_schoolId_idx" ON "Exam"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_subjectId_key" ON "ExamResult"("examId", "studentId", "subjectId");

-- CreateIndex
CREATE INDEX "ConductRemark_studentId_idx" ON "ConductRemark"("studentId");

-- CreateIndex
CREATE INDEX "PTMSession_schoolId_idx" ON "PTMSession"("schoolId");

-- CreateIndex
CREATE INDEX "TimetableSlot_sectionId_idx" ON "TimetableSlot"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstituteRecord_timetableSlotId_date_key" ON "SubstituteRecord"("timetableSlotId", "date");

-- CreateIndex
CREATE INDEX "Activity_schoolId_idx" ON "Activity"("schoolId");

-- CreateIndex
CREATE INDEX "Applicant_schoolId_idx" ON "Applicant"("schoolId");

-- CreateIndex
CREATE INDEX "Applicant_classId_idx" ON "Applicant"("classId");

-- CreateIndex
CREATE INDEX "Applicant_status_idx" ON "Applicant"("status");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanDevice" ADD CONSTRAINT "ScanDevice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceScan" ADD CONSTRAINT "AttendanceScan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceScan" ADD CONSTRAINT "AttendanceScan_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "ScanDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circular" ADD CONSTRAINT "Circular_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLineItem" ADD CONSTRAINT "FeeLineItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeRecordId_fkey" FOREIGN KEY ("feeRecordId") REFERENCES "FeeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductRemark" ADD CONSTRAINT "ConductRemark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConductRemark" ADD CONSTRAINT "ConductRemark_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTMSession" ADD CONSTRAINT "PTMSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteRecord" ADD CONSTRAINT "SubstituteRecord_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteRecord" ADD CONSTRAINT "SubstituteRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
