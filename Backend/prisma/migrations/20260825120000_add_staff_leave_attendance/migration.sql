-- CreateEnum
CREATE TYPE "StaffLeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "StaffLeaveRequest" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "leaveType" TEXT NOT NULL DEFAULT 'CASUAL',
    "reason" TEXT NOT NULL,
    "status" "StaffLeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_staffId_date_key" ON "StaffAttendance"("staffId", "date");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_staffId_idx" ON "StaffLeaveRequest"("staffId");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_schoolId_idx" ON "StaffLeaveRequest"("schoolId");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_status_idx" ON "StaffLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "StaffLeaveRequest_dateFrom_dateTo_idx" ON "StaffLeaveRequest"("dateFrom", "dateTo");

-- CreateIndex
CREATE INDEX "StaffAttendance_schoolId_idx" ON "StaffAttendance"("schoolId");

-- CreateIndex
CREATE INDEX "StaffAttendance_date_idx" ON "StaffAttendance"("date");

-- CreateIndex
CREATE INDEX "StaffAttendance_staffId_date_idx" ON "StaffAttendance"("staffId", "date");

-- AddForeignKey
ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLeaveRequest" ADD CONSTRAINT "StaffLeaveRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
