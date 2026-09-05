-- Half-day attendance support (student + staff):
-- Admin/teacher bulk marking, manual override aur staff marking me ek din
-- ka status HALF_DAY ho sakta hai (e.g. student/staff ne aadha din attend kiya).
ALTER TYPE "AttendanceStatus" ADD VALUE 'HALF_DAY';
