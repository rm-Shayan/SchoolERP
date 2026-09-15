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
const replace = argv.includes("--replace");
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

// ─── Org wipe (reverse dependency order) ─────────────────────────────────────
async function wipeOrg(dst, org, schoolIds) {
  const none = { in: ["00000000-0000-0000-0000-000000000000"] };
  const pick = (arr) => (arr.length ? { in: arr } : none);
  const map = (rows) => rows.map((r) => r.id);

  const schools = await dst.school.findMany({ where: { organizationId: org.id } });
  const sc = {};
  const yearIds = map(await dst.academicYear.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.termIds = map(await dst.term.findMany({ where: { academicYearId: pick(yearIds) }, select: { id: true } }));
  const classIds = map(await dst.class.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.sectionIds = map(await dst.section.findMany({ where: { classId: pick(classIds) }, select: { id: true } }));
  sc.templateIds = map(await dst.sectionTemplate.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.subjectIds = map(await dst.subject.findMany({ where: { classId: pick(classIds) }, select: { id: true } }));
  sc.assignmentIds = map(await dst.teacherAssignment.findMany({ where: { classId: pick(classIds) }, select: { id: true } }));
  const studentIds = map(await dst.student.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.parentIds = (await dst.student.findMany({ where: { schoolId: { in: schoolIds } }, select: { parentId: true } })).map((r) => r.parentId).filter(Boolean);
  const feeIds = map(await dst.feeStructure.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.lineIds = map(await dst.feeLineItem.findMany({ where: { feeStructureId: pick(feeIds) }, select: { id: true } }));
  sc.dueIds = map(await dst.feeRecord.findMany({ where: { studentId: { in: studentIds } }, select: { id: true } }));
  sc.payIds = map(await dst.feePayment.findMany({ where: { feeRecordId: { in: sc.dueIds } }, select: { id: true } }));
  const examIds = map(await dst.exam.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.resultIds = map(await dst.examResult.findMany({ where: { examId: pick(examIds) }, select: { id: true } }));
  sc.slotIds = map(await dst.timetableSlot.findMany({ where: { sectionId: pick(sc.sectionIds) }, select: { id: true } }));
  sc.attIds = map(await dst.attendanceRecord.findMany({ where: { studentId: { in: studentIds } }, select: { id: true } }));
  sc.circIds = map(await dst.circular.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.actIds = map(await dst.activity.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.ptmIds = map(await dst.pTMSession.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.hwIds = map(await dst.homeworkBroadcast.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.remIds = map(await dst.conductRemark.findMany({ where: { studentId: { in: studentIds } }, select: { id: true } }));
  sc.appIds = map(await dst.applicant.findMany({ where: { schoolId: { in: schoolIds } }, select: { id: true } }));
  sc.userIds = map(await dst.user.findMany({ where: { OR: [{ organizationId: org.id }, { schoolId: { in: schoolIds } }] }, select: { id: true } }));

  const del = async (tx, model, where) => { const c = await tx[model].deleteMany({ where }); if (c.count) console.log(`  deleted ${model}: ${c.count}`); };
  await dst.$transaction(async (tx) => {
    const delJoin = async () => {
      if (feeIds.length) {
        const c = await tx.$executeRawUnsafe('DELETE FROM "_ClassToFeeStructure" WHERE "B" = ANY($1::text[])', feeIds);
        if (c) console.log(`  deleted _ClassToFeeStructure: ${c}`);
      }
    };
    await delJoin();
    await del(tx, "conductRemark", { id: pick(sc.remIds) });
    await del(tx, "attendanceRecord", { id: pick(sc.attIds) });
    await del(tx, "feePayment", { id: pick(sc.payIds) });
    await del(tx, "timetableSlot", { id: pick(sc.slotIds) });
    await del(tx, "examResult", { id: pick(sc.resultIds) });
    await del(tx, "teacherAssignment", { id: pick(sc.assignmentIds) });
    await del(tx, "homeworkBroadcast", { id: pick(sc.hwIds) });
    await del(tx, "circular", { id: pick(sc.circIds) });
    await del(tx, "activity", { id: pick(sc.actIds) });
    await del(tx, "pTMSession", { id: pick(sc.ptmIds) });
    await del(tx, "applicant", { id: pick(sc.appIds) });
    await del(tx, "feeRecord", { id: pick(sc.dueIds) });
    await del(tx, "feeLineItem", { id: pick(sc.lineIds) });
    await del(tx, "student", { id: { in: studentIds } });
    await del(tx, "feeStructure", { id: pick(feeIds) });
    await del(tx, "parent", { id: pick(sc.parentIds) });
    await del(tx, "subject", { id: pick(sc.subjectIds) });
    await del(tx, "sectionTemplate", { id: pick(sc.templateIds) });
    await del(tx, "section", { id: pick(sc.sectionIds) });
    await del(tx, "exam", { id: pick(examIds) });
    await del(tx, "class", { id: pick(classIds) });
    await del(tx, "term", { id: pick(sc.termIds) });
    await del(tx, "academicYear", { id: pick(yearIds) });
    await del(tx, "user", { id: pick(sc.userIds) });
    await del(tx, "orgSecrets", { organizationId: org.id });
    await del(tx, "school", { id: pick(map(schools)) });
    await del(tx, "organization", { id: org.id });
  }, { maxWait: 30000, timeout: 300000 });
}

async function main() {
  const org = await src.organization.findUnique({ where: { id: orgId } });
  if (!org) { console.error("ABORT: org source DB mein nahi mili -> " + orgId); process.exit(1); }
  console.log(`\nOrg: ${org.name} (${org.slug})\n`);

  const plan = [];
  let tables = [];

  const schools = await src.school.findMany({ where: { organizationId: org.id } });
  const schoolIds = schools.map((s) => s.id);
  if (!schoolIds.length) { console.error("ABORT: org ke koi school nahi mile source mein."); process.exit(1); }

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
  if (exists && !replace) { console.error("ABORT: org target mein PEHLE se maujood hai -> " + org.id + " --replace ke saath dobara chalao."); return; }
  if (exists && replace) {
    await wipeOrg(dst, org, schoolIds);
    console.log(`WIPE done: target ka purana ${org.name} data delete ho gaya.`);
  }

  const secretsOut = secrets.map((r) => {
    const d = { ...r.data };
    if (r.category === "SMTP" && d.passwordEnc) d.passwordEnc = encryptSecret(decryptSecret(d.passwordEnc, srcKey), dstKey);
    if (r.category === "CLOUDINARY" && d.apiSecretEnc) d.apiSecretEnc = encryptSecret(decryptSecret(d.apiSecretEnc, srcKey), dstKey);
    return { id: r.id, organizationId: r.organizationId, schoolId: r.schoolId, category: r.category, tier: r.tier, data: d, isVerified: r.isVerified, lastVerifiedAt: r.lastVerifiedAt, lastError: r.lastError, createdAt: r.createdAt, updatedAt: r.updatedAt };
  });

  await dst.$transaction(async (tx) => {
    const manyCreate = async (model, rows) => {
      if (!rows.length) return;
      await tx[model].createMany({ data: rows });
    };
    await manyCreate("organization", [org]);
    await manyCreate("school", schools);
    await manyCreate("orgSecrets", secretsOut);
    await manyCreate("user", users);
    await manyCreate("academicYear", years);
    await manyCreate("term", terms);
    await manyCreate("class", classes);
    await manyCreate("section", sections);
    await manyCreate("sectionTemplate", templates);
    await manyCreate("subject", subjects);
    await manyCreate("teacherAssignment", assignments);
    await manyCreate("parent", parents);
    await manyCreate("student", students);
    await manyCreate("feeStructure", fees);
    await manyCreate("feeLineItem", feeItems);
    if (joins.rows.length) {
      await tx.$executeRawUnsafe(
        'INSERT INTO "_ClassToFeeStructure" ("A","B") SELECT * FROM unnest($1::text[], $2::text[])',
        joins.rows.map((r) => r.A), joins.rows.map((r) => r.B),
      );
    }
    await manyCreate("feeRecord", dues);
    await manyCreate("feePayment", payments);
    await manyCreate("exam", exams);
    await manyCreate("examResult", results);
    await manyCreate("timetableSlot", slots);
    await manyCreate("attendanceRecord", attendance);
    await manyCreate("circular", circulars);
    await manyCreate("activity", activities);
    await manyCreate("pTMSession", ptms);
    await manyCreate("homeworkBroadcast", homework);
    await manyCreate("conductRemark", remarks);
    await manyCreate("applicant", applicants);
  }, { maxWait: 30000, timeout: 480000 });

  console.log(`\nSUCCESS: ${org.name} (${org.id}) production mein copy ho gaya — ${total} rows.`);
  console.log("First admin login pe org SETUP_PENDING -> ACTIVE auto ho jata hai.");
}

main()
  .catch((e) => { console.error("\nMIGRATION FAILED:", e); process.exitCode = 1; })
  .finally(async () => { await srcPool.end(); await dstPool.end(); });