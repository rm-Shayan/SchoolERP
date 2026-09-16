-- Exam publish flag — duplicate "publish results" clicks must not fire duplicate
-- portal notifications / websocket events. Marks the exam as already published.

ALTER TABLE "Exam" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN "publishedAt" TIMESTAMP(3);