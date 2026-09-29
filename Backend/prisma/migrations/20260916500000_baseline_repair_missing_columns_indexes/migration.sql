-- Baseline repair (part 2): 20 columns + 30 indexes jo schema.prisma me hain par
-- migrations chain kabhi create nahi hua. Production (Neon) par ye sab pehle se
-- maujood hain (wahan schema `prisma db push` se bana tha), is liye ye migration
-- POORI tarah idempotent hai (`ADD COLUMN IF NOT EXISTS` / `INDEX IF NOT EXISTS`)
-- aur production par no-op rahegi.
--
-- SQL `prisma migrate diff --from-empty --to-schema prisma/schema.prisma` se
-- generate ki gayi thi — yaani canonical schema se derive, haath se nahi.
--
-- Timestamp `20260917000000` se PEHLE hona zaroori hai kyunke us migration ke
-- baad aane wale indexes in columns par depend karte hain.
-- AUTO-GENERATED from prisma/schema.prisma (canonical DDL diff)
-- missing columns: 20, missing indexes: 30

ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "scanDevices" JSONB;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "scanLog" JSONB;
ALTER TABLE "StaffAttendance" ADD COLUMN IF NOT EXISTS "dateTo" DATE;
ALTER TABLE "StaffAttendance" ADD COLUMN IF NOT EXISTS "leaveType" TEXT;
ALTER TABLE "StaffAttendance" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "StaffAttendance" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "StaffAttendance" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "senderId" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "refType" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "refId" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "link" TEXT;
ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Circular" ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3);
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "dueCharges" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "FeeRecord" ADD COLUMN IF NOT EXISTS "periods" JSONB;

CREATE INDEX IF NOT EXISTS "Organization_createdAt_idx" ON "Organization"("createdAt");
CREATE INDEX IF NOT EXISTS "School_organizationId_name_idx" ON "School"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "User_schoolId_role_isActive_idx" ON "User"("schoolId", "role", "isActive");
CREATE INDEX IF NOT EXISTS "User_role_isActive_schoolId_idx" ON "User"("role", "isActive", "schoolId");
CREATE INDEX IF NOT EXISTS "User_organizationId_role_idx" ON "User"("organizationId", "role");
CREATE INDEX IF NOT EXISTS "Student_schoolId_status_idx" ON "Student"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "Student_schoolId_sectionId_idx" ON "Student"("schoolId", "sectionId");
CREATE INDEX IF NOT EXISTS "Student_schoolId_sectionId_status_idx" ON "Student"("schoolId", "sectionId", "status");
CREATE INDEX IF NOT EXISTS "Student_parentId_status_idx" ON "Student"("parentId", "status");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_date_studentId_idx" ON "AttendanceRecord"("date", "studentId");
CREATE INDEX IF NOT EXISTS "StaffAttendance_status_idx" ON "StaffAttendance"("status");
CREATE INDEX IF NOT EXISTS "NotificationLog_organizationId_idx" ON "NotificationLog"("organizationId");
CREATE INDEX IF NOT EXISTS "NotificationLog_recipientId_idx" ON "NotificationLog"("recipientId");
CREATE INDEX IF NOT EXISTS "NotificationLog_senderId_idx" ON "NotificationLog"("senderId");
CREATE INDEX IF NOT EXISTS "NotificationLog_channel_idx" ON "NotificationLog"("channel");
CREATE INDEX IF NOT EXISTS "NotificationLog_category_idx" ON "NotificationLog"("category");
CREATE INDEX IF NOT EXISTS "NotificationLog_isRead_idx" ON "NotificationLog"("isRead");
CREATE INDEX IF NOT EXISTS "NotificationLog_isRead_schoolId_idx" ON "NotificationLog"("isRead", "schoolId");
CREATE INDEX IF NOT EXISTS "NotificationLog_isRead_organizationId_idx" ON "NotificationLog"("isRead", "organizationId");
CREATE INDEX IF NOT EXISTS "NotificationLog_isRead_recipientId_idx" ON "NotificationLog"("isRead", "recipientId");
CREATE INDEX IF NOT EXISTS "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");
CREATE INDEX IF NOT EXISTS "FeeRecord_studentId_status_idx" ON "FeeRecord"("studentId", "status");
CREATE INDEX IF NOT EXISTS "FeeRecord_status_dueDate_idx" ON "FeeRecord"("status", "dueDate");
CREATE INDEX IF NOT EXISTS "FeeRecord_dueDate_status_idx" ON "FeeRecord"("dueDate", "status");
CREATE INDEX IF NOT EXISTS "FeePayment_feeRecordId_paidAt_idx" ON "FeePayment"("feeRecordId", "paidAt");
CREATE INDEX IF NOT EXISTS "ExamResult_examId_idx" ON "ExamResult"("examId");
CREATE INDEX IF NOT EXISTS "ExamResult_examId_studentId_idx" ON "ExamResult"("examId", "studentId");
CREATE INDEX IF NOT EXISTS "TimetableSlot_sectionId_dayOfWeek_startTime_endTime_idx" ON "TimetableSlot"("sectionId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "TimetableSlot_teacherId_dayOfWeek_startTime_endTime_idx" ON "TimetableSlot"("teacherId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_action_idx" ON "AuditLog"("createdAt", "action");
