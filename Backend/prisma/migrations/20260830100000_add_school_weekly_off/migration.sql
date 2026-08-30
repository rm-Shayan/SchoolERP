-- School.weeklyOff Json — per-school weekly off weekdays.
-- Array of ints 0..6 (0=Sun .. 6=Sat). null = [0,6] (Sun+Sat).
-- Some schools only have Sunday off, others run Saturday too.
ALTER TABLE "School" ADD COLUMN "weeklyOff" JSONB;