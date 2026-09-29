-- C6: ek student ka ek due-date pe sirf EK fee voucher ho sakta hai.
--
-- Pehle `generateMonthlyFees` sirf `findExistingRecordsForDate` se existence
-- check karta tha aur phir bulk insert karta tha. Do concurrent runs (manual
-- generate + scheduled `autoGenerateMonthlyFees`) dono ko "no existing record"
-- mil jata tha aur dono insert kar dete the → same month ke DUPLICATE vouchers.
-- Application level check hi DB level guarantee ko replace nahi kar sakti.
--
-- Ye unique constraint `createFeeRecords()` ke `skipDuplicates: true` ko asli
-- protection deta hai: race jeetne wala insert hota hai, doosra silently skip.

-- Safety: duplicate rows hain to INSTEAD OF karke loud failure — financial rows
-- apne aap delete karna galat hota hai, isliye operator manually resolve kare.
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT 1 FROM "FeeRecord" GROUP BY "studentId", "dueDate" HAVING COUNT(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'FeeRecord me % duplicate (studentId, dueDate) group(s) hain. Unique index banane se pehle inhe manually resolve karo: SELECT "studentId", "dueDate", COUNT(*) FROM "FeeRecord" GROUP BY 1,2 HAVING COUNT(*) > 1;', dup_count;
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "FeeRecord_studentId_dueDate_key" ON "FeeRecord"("studentId", "dueDate");
