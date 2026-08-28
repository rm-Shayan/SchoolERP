-- Per-tenant configurable daily send limit.
-- Gmail free accounts ~500/day; Google Workspace 2000+/day. Admin khud apne
-- account ke hisaab se set karta hai — outbox isse PEHLE hi transport skip
-- karta hai (reactive 550-5.4.5 detection ka pehlu ab bhi backstop hai).
ALTER TABLE "SmtpSetting" ADD COLUMN "dailyLimit" INTEGER NOT NULL DEFAULT 500;
