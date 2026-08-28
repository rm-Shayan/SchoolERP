-- School-level section pool (A, B, Morning, Evening...) — assigned to classes later
CREATE TABLE "SectionTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "roomNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SectionTemplate_schoolId_idx" ON "SectionTemplate"("schoolId");

ALTER TABLE "SectionTemplate" ADD CONSTRAINT "SectionTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
