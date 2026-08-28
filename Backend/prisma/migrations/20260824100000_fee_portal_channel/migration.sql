-- Fee PAID alerts are in-app only (no email) — new portal channel.
-- Transaction-safe enum extend (ALTER TYPE ADD VALUE transaction block me
-- allowed nahi hai / shadow DB par fail hota hai) — isliye recreate:
BEGIN;
CREATE TYPE "MessageChannel__new" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'PORTAL');
ALTER TABLE "NotificationLog"
  ALTER COLUMN "channel" DROP DEFAULT,
  ALTER COLUMN "channel" TYPE "MessageChannel__new" USING ("channel"::text::"MessageChannel__new"),
  ALTER COLUMN "channel" SET DEFAULT 'WHATSAPP';
DROP TYPE "MessageChannel";
ALTER TYPE "MessageChannel__new" RENAME TO "MessageChannel";
COMMIT;
