/**
 * Demo → Production data migration.
 *
 * Local demo DB (dev.env) se LAS_SMART_School ka complete data production DB
 * (.env) mein copy karta hai — sab records ki IDs preserve hoti hain.
 * OrgSecrets (SMTP/Cloudinary) production key se DOBARA encrypt hoti hain.
 *
 * Usage (production env se chalao):
 *   node --env-file=.env scripts/demo-to-production.js --yes
 *   node --env-file=.env scripts/demo-to-production.js --yes --org <orgId>
 *
 * Flags:
 *   --yes      migration confirm (required; target LOCAL ho to mana karta hai)
 *   --dry-run  sirf plan dikhata hai, likhta kuch nahi
 */
import crypto from "crypto";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const DEV_ENV_FILE = "dev.env";
const DEFAULT_ORG = "4b9316cc-f48b-4967-9ab4-a6f12bf1ccef";

const argv = process.argv.slice(2);
const confirmYes = argv.includes("--yes");
const dryRun = argv.includes("--dry-run");
const orgId = (argv[argv.indexOf("--org") + 1]) || DEFAULT_ORG;

// ─── Env/secrets helpers ────────────────────────────────────────────────────
function kv(file, key) {
  const txt = fs.readFileSync(file, "utf8");
  const m = txt.match(new RegExp("^" + key + "=(.*)$", "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "") : "";
}
function deriveKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}
function decryptSecret(payload, key) {
  const [ivB64, tagB64, dataB64] = String(payload).split(".");
  if (!ivB64 || !tagB64 || !dataB64) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    d.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([d.update(Buffer.from(dataB64, "base64")), d.final()]).toString("utf8");
  } catch { return null; }
}
function encryptSecret(plain, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

const srcURL = kv(DEV_ENV_FILE, "DATABASE_URL");
const srcKey = deriveKey(kv(DEV_ENV_FILE, "JWT_SECRET"));
const dstKey = deriveKey(process.env.MAIL_ENC_KEY || process.env.JWT_SECRET || "school-erp-dev-only");
const dstURL = process.env.DATABASE_URL || "";

function hostOf(url) {
  try { return new URL(url).host; } catch { return url; }
}
const srcHost = hostOf(srcURL);
const dstHost = hostOf(dstURL);

// ─── Safety gates ───────────────────────────────────────────────────────────
if (!/localhost|127\.0\.0\.1/.test(srcHost)) {
  console.error("ABORT: source dev.env ki DB local nahi hai -> " + srcHost);
  process.exit(1);
}
if (/localhost|127\.0\.0\.1/.test(dstHost)) {
  console.error("ABORT: target (.env) LOCAL DB hai — khatarnaak. --yes se bhi nahi chalta.");
  process.exit(1);
}
console.log(`Source: ${srcHost}`);
console.log(`Target: ${dstHost}`);
if (!dstURL) { console.error("ABORT: .env mein DATABASE_URL nahi mili."); process.exit(1); }
if (!confirmYes && !dryRun) {
  console.error('\nConfirmation required: "--yes" pass karo. (--dry-run sirf plan dikhata hai)');
  process.exit(1);
}

// ─── Clients ────────────────────────────────────────────────────────────────
const srcPool = new Pool({ connectionString: srcURL });
const dstPool = new Pool({ connectionString: dstURL });
const src = new PrismaClient({ adapter: new PrismaPg(srcPool) });
const dst = new PrismaClient({ adapter: new PrismaPg(dstPool) });

const many = (data) => ({ data });

async function main() {
  const org = await src.organization.findUnique({ where: { id: orgId } });
  if (!org) { console.error("ABORT: org source DB mein nahi mili -> " + orgId); process.exit(1); }
  console.log(`\nOrg: ${org.name} (${org.slug})\n`);

  const plan = [];
  let tables = [];

  const school = await src.school.findFirst({ where: { organizationId: org.id } });
  const schools = school ? [school] : [];
  const schoolIds = schools.map((s) => s.id);

  const secrets = await src.orgSecrets.findMany({ where: { organizationId: org.id } });
  const users = await src.user.findMany({ where: { OR: [{ organizationId: org.id }, { schoolId: { in: schoolIds } }] } });
  const years = await src.academicYear.findMany({ where: { schoolId: { in: schoolIds } } });
  const yearIds = years.map((y) => y.id);
  const terms = await src.term.findMany({ where: { academicYearId: { in: yearIds } } });
  const classes = await src.class.findMany({ where: { schoolId: { in: schoolIds } } });
  const classIds = classes.map((c) => c.id);
  const sections = await src.section.findMany({ where: { classId: { in: classIds } } });
  const sectionIds = sections.map((s) => s.id);
  const templates = await src.sectionTemplate.findMany({ where: { schoolId: { in: schoolIds } } });
  const subjects = await src.subject.findMany({ where: { classId: { in: classIds } } });
  const assignments = await src.teacherAssignment.findMany({ where: { classId: { in: classIds } } });
  const students = await src.student.findMany({ where: { schoolId: { in: schoolIds } } });
  const studentIds = students.map((s) => s.id);
  const parents = await src.parent.findMany({ where: { id: { in: students.map((s) => s.parentId) } } });
  const fees = await src.feeStructure.findMany({ where: { schoolId: { in: schoolIds } } });
  const feeIds = fees.map((f) => f.id);
  const feeItems = await src.feeLineItem.findMany({ where: { feeStructureId: { in: feeIds } } });
  const dues = await src.feeRecord.findMany({ where: { studentId: { in: studentIds } } });
  const dueIds = dues.map((d) => d.id);
  const payments = await src.feePayment.findMany({ where: { feeRecordId: { in: dueIds } } });
  const exams = await src.exam.findMany({ where: { schoolId: { in: schoolIds } } });
  const examIds = exams.map((e) => e.id);
  const results = await src.examResult.findMany({ where: { examId: { in: examIds } } });
  const slots = await src.timetableSlot.findMany({ where: { sectionId: { in: sectionIds } } });
  const attendance = await src.attendanceRecord.findMany({ where: { studentId: { in: studentIds } } });
  const circulars = await src.circular.findMany({ where: { schoolId: { in: schoolIds } } });
  const activities = await src.activity.findMany({ where: { schoolId: { in: schoolIds } } });
  const ptms = await src.pTMSession.findMany({ where: { schoolId: { in: schoolIds } } });
  const homework = await src.homeworkBroadcast.findMany({ where: { schoolId: { in: schoolIds } } });
  const remarks = await src.conductRemark.findMany({ where: { studentId: { in: studentIds } } });
  const applicants = await src.applicant.findMany({ where: { schoolId: { in: schoolIds } } });
  const joins = feeIds.length
    ? await srcPool.query(`SELECT "A", "B" FROM "_ClassToFeeStructure" WHERE "B" = ANY($1::text[])`, [feeIds])
    : { rows: [] };

  tables = [
    ["Organization", [org]], ["School", schools], ["OrgSecrets", secrets], ["User", users],
    ["AcademicYear", years], ["Term", terms], ["Class", classes], ["Section", sections],
    ["SectionTemplate", templates], ["Subject", subjects], ["TeacherAssignment", assignments],
    ["Parent", parents], ["Student", students], ["FeeStructure", fees], ["FeeLineItem", feeItems],
    ["_ClassToFeeStructure (join)", joins.rows], ["FeeRecord", dues], ["FeePayment", payments],
    ["Exam", exams], ["ExamResult", results], ["TimetableSlot", slots], ["AttendanceRecord", attendance],
    ["Circular", circulars], ["Activity", activities], ["PTMSession", ptms],
    ["HomeworkBroadcast", homework], ["ConductRemark", remarks], ["Applicant", applicants],
  ];
  console.log("PARSE PLAN:");
  for (const [name, rows] of tables) console.log(`  ${name}: ${rows.length}`);
  const total = tables.reduce((s, [, r]) => s + r.length, 0);
  console.log(`  TOTAL rows: ${total}\n`);
  if (dryRun) return;

  const exists = await dst.organization.findUnique({ where: { id: org.id }, select: { id: true } });
  if (exists) { console.error("ABORT: org target mein PEHLE se maujood hai -> " + org.id); return; }

  const secretsOut = secrets.map((r) => {
    const d = { ...r.data };
    if (r.category === "SMTP" && d.passwordEnc) d.passwordEnc = encryptSecret(decryptSecret(d.passwordEnc, srcKey), dstKey);
    if (r.category === "CLOUDINARY" && d.apiSecretEnc) d.apiSecretEnc = encryptSecret(decryptSecret(d.apiSecretEnc, srcKey), dstKey);
    return { id: r.id, organizationId: r.organizationId, schoolId: r.schoolId, category: r.category, tier: r.tier, data: d, isVerified: r.isVerified, lastVerifiedAt: r.lastVerifiedAt, lastError: r.lastError, createdAt: r.createdAt, updatedAt: r.updatedAt };
  });

  await dst.$transaction(async (tx) => {
    for (const r of [org]) await tx.organization.create({ data: r });
    for (const r of schools) await tx.school.create({ data: r });
    for (const r of secretsOut) await tx.orgSecrets.create({ data: r });
    for (const r of users) await tx.user.create({ data: r });
    for (const r of years) await tx.academicYear.create(many(r));
    for (const r of terms) await tx.term.create(many(r));
    for (const r of classes) await tx.class.create(many(r));
    for (const r of sections) await tx.section.create(many(r));
    for (const r of templates) await tx.sectionTemplate.create(many(r));
    for (const r of subjects) await tx.subject.create(many(r));
    for (const r of assignments) await tx.teacherAssignment.create(many(r));
    for (const r of parents) await tx.parent.create(many(r));
    for (const r of students) await tx.student.create(many(r));
    for (const r of fees) await tx.feeStructure.create(many(r));
    for (const r of feeItems) await tx.feeLineItem.create(many(r));
    for (const row of joins.rows) await tx.$executeRawUnsafe('INSERT INTO "_ClassToFeeStructure" ("A","B") VALUES ($1,$2)', row.A, row.B);
    for (const r of dues) await tx.feeRecord.create(many(r));
    for (const r of payments) await tx.feePayment.create(many(r));
    for (const r of exams) await tx.exam.create(many(r));
    for (const r of results) await tx.examResult.create(many(r));
    for (const r of slots) await tx.timetableSlot.create(many(r));
    for (const r of attendance) await tx.attendanceRecord.create(many(r));
    for (const r of circulars) await tx.circular.create(many(r));
    for (const r of activities) await tx.activity.create(many(r));
    for (const r of ptms) await tx.pTMSession.create(many(r));
    for (const r of homework) await tx.homeworkBroadcast.create(many(r));
    for (const r of remarks) await tx.conductRemark.create(many(r));
    for (const r of applicants) await tx.applicant.create(many(r));
  }, { maxWait: 30000, timeout: 300000 });

  console.log(`\nSUCCESS: ${org.name} (${org.id}) production mein copy ho gaya — ${total} rows.`);
  console.log("First admin login pe org SETUP_PENDING -> ACTIVE auto ho jata hai.");
}

main()
  .catch((e) => { console.error("\nMIGRATION FAILED:", e); process.exitCode = 1; })
  .finally(async () => { await srcPool.end(); await dstPool.end(); });