-- CreateTable
CREATE TABLE "AttendanceYearSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "daysPresent" INTEGER NOT NULL DEFAULT 0,
    "daysLate" INTEGER NOT NULL DEFAULT 0,
    "daysAbsent" INTEGER NOT NULL DEFAULT 0,
    "daysLeave" INTEGER NOT NULL DEFAULT 0,
    "daysManual" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceYearSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceYearSummary_studentId_yearLabel_key" ON "AttendanceYearSummary"("studentId", "yearLabel");

-- CreateIndex
CREATE INDEX "AttendanceYearSummary_schoolId_idx" ON "AttendanceYearSummary"("schoolId");

-- CreateIndex
CREATE INDEX "AttendanceYearSummary_studentId_idx" ON "AttendanceYearSummary"("studentId");

-- AddForeignKey
ALTER TABLE "AttendanceYearSummary" ADD CONSTRAINT "AttendanceYearSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
