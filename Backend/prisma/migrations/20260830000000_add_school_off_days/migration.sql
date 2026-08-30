-- School.offDays Json — official off days / holidays for the branch:
-- [{date: "YYYY-MM-DD", reason: string}] — used by attendance reports
-- (monthly working-day count + grid, daily "school off" banner).
ALTER TABLE "School" ADD COLUMN "offDays" JSONB;