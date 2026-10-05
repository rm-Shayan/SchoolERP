-- Student attendance = check-in only. Checkout column dropped from AttendanceRecord
-- (staff checkout StaffAttendance model me untouched rahega).
DROP INDEX IF EXISTS "AttendanceRecord_checkOut_idx";

ALTER TABLE "AttendanceRecord" DROP COLUMN IF EXISTS "checkOut";