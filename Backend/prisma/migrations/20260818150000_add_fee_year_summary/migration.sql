-- CreateTable
CREATE TABLE "FeeYearSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "totalCharged" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "totalPaid" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "paidRecords" INTEGER NOT NULL DEFAULT 0,
    "partialRecords" INTEGER NOT NULL DEFAULT 0,
    "unpaidRecords" INTEGER NOT NULL DEFAULT 0,
    "overdueRecords" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeYearSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeYearSummary_studentId_yearLabel_key" ON "FeeYearSummary"("studentId", "yearLabel");

-- CreateIndex
CREATE INDEX "FeeYearSummary_schoolId_idx" ON "FeeYearSummary"("schoolId");

-- CreateIndex
CREATE INDEX "FeeYearSummary_studentId_idx" ON "FeeYearSummary"("studentId");

-- AddForeignKey
ALTER TABLE "FeeYearSummary" ADD CONSTRAINT "FeeYearSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
