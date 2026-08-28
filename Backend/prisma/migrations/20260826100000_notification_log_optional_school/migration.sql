-- NotificationLog.schoolId optional — platform-level events (e.g. SMTP verify failure) ke liye.
ALTER TABLE "NotificationLog" ALTER COLUMN "schoolId" DROP NOT NULL;
