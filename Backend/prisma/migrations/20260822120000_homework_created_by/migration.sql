-- Homework tracking: attribute broadcasts to the teacher/staff who posted them
ALTER TABLE "HomeworkBroadcast" ADD COLUMN "createdById" TEXT;

ALTER TABLE "HomeworkBroadcast" ADD CONSTRAINT "HomeworkBroadcast_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "HomeworkBroadcast_createdById_idx" ON "HomeworkBroadcast"("createdById");
