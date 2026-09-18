/**
 * One-command DEMO tenant seeder — client demo ke liye.
 *
 * School ke pass ja kar sirf uska NAAM do — script apne aap:
 *   1. naam se code/slug derive karta hai (thori si modification ke saath)
 *   2. demo organization + "Main Campus" branch bana/ reuse karta hai
 *   3. har CRUD module ka basic sample data seed karta hai
 *   4. LOCAL info file likhta hai (Backend/demo-info/<code>.md + .json)
 *      — us se aap saare portal logins + URLs dekh kar login kar sakte ho.
 * Real client data kabhi touch nahi hota (sirf is code ka tenant).
 *
 * Usage:
 *   npm run demo -- --name "ABC School"                       # naam diya, code auto
 *   npm run demo -- --name "ABC School" --code ABC            # ya code khud do
 *   npm run demo -- --name "ABC School" --students 10 --teachers 3 --months 2
 *   npm run demo -- --name "ABC School" --reset --yes         # wipe + fresh reseed
 *   npm run demo -- --no-file                                 # info file mat likho
 *
 * Info file: Backend/demo-info/<code>.md  (human-readable credentials + URLs)
 *            Backend/demo-info/<code>.json (structured — scripts/automation ke liye)
 *
 * Flags:
 *   --name <text>       School/org ke saath ka naam (default: Demo Academy)
 *   --code <code>       Org ka unique code (default: naam se auto-derive).
 *                       Same code dobara → wahi tenant reuse hota hai.
 *   --students <n>      Kitne students banane hain (default: 6)
 *   --teachers <n>      Teachers ki count (default: 2, + 1 branch ADMIN)
 *   --months <n>        Fee records kitne mahine (default: 2)
 *   --reset             Demo tenant (saara data) delete karke naye se banta hai
 *   --yes               --reset ka confirmation
 *   --no-file           Info file generation band (sirf console output)
 *   --out <dir>         Info file folder (default: Backend/demo-info)
 *
 * Seed data (per branch) seed-data.js se reuse hoti hai:
 *   academic year/terms, classes 1-5 + sections A/B, subjects, teachers,
 *   fee structure + PAID/PARTIAL/UNPAID/OVERDUE records, students + parents,
 *   exams/results, timetable, attendance (last 5 school days), circulars,
 *   activities, PTM, homework, conduct remarks, applicants.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import prisma from '../src/config/db.js';
import { seedBranch } from './seed-data.js';

const DEFAULT_OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'demo-info');

const USAGE = `node --env-file=.env scripts/demo-data.js [--name "ABC School"] [--code ABC]
       [--students 6] [--teachers 2] [--months 2] [--reset --yes] [--no-file]`;

function parseArgs() {
  const args = {
    name: 'Demo Academy',
    code: '',
    students: 6,
    teachers: 2,
    months: 2,
    reset: false,
    yes: false,
    writeFile: true,
    outDir: DEFAULT_OUT_DIR,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--name') args.name = argv[++i];
    else if (k === '--code') args.code = argv[++i].trim().toUpperCase();
    else if (k === '--students') args.students = parseInt(argv[++i], 10);
    else if (k === '--teachers') args.teachers = parseInt(argv[++i], 10);
    else if (k === '--months') args.months = parseInt(argv[++i], 10);
    else if (k === '--out') args.outDir = argv[++i];
    else if (k === '--reset') args.reset = true;
    else if (k === '--yes') args.yes = true;
    else if (k === '--no-file') args.writeFile = false;
    else if (k === '--help' || k === '-h') { console.log(USAGE); process.exit(0); }
  }
  return args;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'demo';
}

// School ka naam → unique org code (slight modification: upper, max 10 chars).
async function deriveCode(name) {
  const base = (slugify(name).replace(/[^a-z0-9]/g, '').slice(0, 10).toUpperCase()) || 'DEMO';
  let candidate = base;
  let i = 2;
  while (candidate.length <= 12 && await prisma.organization.findUnique({ where: { code: candidate } })) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

// Unique slug (org.slug unique hai).
async function uniqueSlug(base) {
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

// Branch code bhi globally unique hai (School.code) — base + numeric suffix.
async function uniqueSchoolCode(base) {
  let candidate = base;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.school.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${String(suffix).padStart(2, '0')}`;
  }
}

async function createDemoOrganization(args) {
  const slug = await uniqueSlug(slugify(args.code));
  console.log(`Creating demo organization: "${args.name}" (code: ${args.code}, slug: ${slug})`);
  return prisma.organization.create({
    data: {
      name: args.name,
      slug,
      code: args.code,
      themeColor: '#2563eb',
      status: 'ACTIVE', // demo tenant direct ACTIVE hai — login pe SETUP_PENDING flip ka wait nahi
    },
  });
}

async function findOrCreateBranch(org) {
  const branches = await prisma.school.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'asc' },
  });
  if (branches.length) return branches[0];
  const code = await uniqueSchoolCode(`${org.code}-01`);
  console.log(`Creating demo branch: "${org.name} Main Campus" (code: ${code})`);
  return prisma.school.create({
    data: { organizationId: org.id, name: `${org.name} Main Campus`, code },
  });
}

// ─── Reset: sirf demo tenant wipe karta hai (org code match pe) ────────────
async function wipeDemoTenant(org) {
  console.log(`Resetting demo tenant "${org.name}" (${org.code}) — data delete ho raha hai...`);
  const branches = await prisma.school.findMany({
    where: { organizationId: org.id },
    select: { id: true },
  });
  const schoolIds = branches.map((b) => b.id);
  const parentIds = (await prisma.student.findMany({
    where: { schoolId: { in: schoolIds } },
    select: { parentId: true },
  })).map((s) => s.parentId);

  await prisma.$transaction(async (tx) => {
    await tx.student.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await tx.timetableSlot.deleteMany({ where: { section: { class: { schoolId: { in: schoolIds } } } } });
    await tx.user.deleteMany({ where: { schoolId: { in: schoolIds } } });
    if (parentIds.length) await tx.parent.deleteMany({ where: { id: { in: parentIds } } });
    await tx.school.deleteMany({ where: { id: { in: schoolIds } } });
    await tx.organization.deleteMany({ where: { id: org.id } });
  });
  console.log('Demo tenant wiped. Fresh seeding start hota hai...\n');
}

// Super Admin dashboard cache clear — best-effort (redis band ho to ignore).
async function invalidateOrgCaches(orgId) {
  try {
    const { default: redis } = await import('../src/config/redis.js');
    await redis.del(['orgs:all', 'superadmin:overview', 'schools:all', `schools:org:${orgId}`, `org:${orgId}`]);
  } catch (err) { /* redis unavailable — cache khud expire ho jayega */ }
}

// ─── Info collect + file write ──────────────────────────────────────────────
async function collectInfo(org, branch, seeded) {
  const staff = await prisma.user.findMany({
    where: { schoolId: branch.id },
    select: { name: true, email: true, role: true },
    orderBy: { role: 'asc' },
  });
  const sample = await prisma.student.findFirst({
    where: { schoolId: branch.id },
    select: { rollNumber: true, firstName: true, lastName: true, parent: { select: { whatsappNo: true } } },
  });
  const counts = {
    students: await prisma.student.count({ where: { schoolId: branch.id } }),
    teachers: staff.filter((u) => u.role === 'TEACHER').length,
    users: staff.length,
  };
  const base = process.env.CLIENT_URL || 'http://localhost:3000';
  const portalPass = branch.portalPassword ? '(custom portal password)' : branch.code;

  // Salo-alpha: login password har role ka fixed hi hai (seed-data.js se).
  const credentials = staff.map((u) => ({
    role: u.role,
    name: u.name,
    email: u.email,
    password: u.role === 'ADMIN' ? 'Admin@123' : 'Teacher@123',
  }));
  if (sample) {
    credentials.push({ role: 'PARENT', name: 'Parent Portal', login: sample.parent.whatsappNo, password: portalPass });
    credentials.push({ role: 'STUDENT', name: `${sample.firstName} ${sample.lastName}`, login: `roll ${sample.rollNumber}`, password: portalPass });
  }

  return {
    generatedAt: new Date().toISOString(),
    organization: { name: org.name, code: org.code, slug: org.slug, id: org.id },
    branch: { name: branch.name, code: branch.code, id: branch.id },
    seeded,
    counts,
    urls: {
      publicOrgPage: `${base}/o/${org.slug}`,
      branchLogin: `${base}/login?code=${branch.code}`,
      parentStudentPortal: `${base}/parent/login`,
      superAdminConsole: `${base}/admin/login`,
    },
    credentials,
  };
}

function mdFormat(info) {
  const L = [];
  L.push(`# ${info.organization.name} — Demo Access`);
  L.push('');
  L.push(`- **Org**: ${info.organization.name} (code: \`${info.organization.code}\`, slug: \`${info.organization.slug}\`)`);
  L.push(`- **Branch**: ${info.branch.name} (code: \`${info.branch.code}\`)`);
  L.push(`- **Data**: ${info.seeded ? 'freshly seeded' : 'already existed'} — students: ${info.counts.students}, teachers: ${info.counts.teachers}, staff users: ${info.counts.users}`);
  L.push('');
  L.push('## Login credentials');
  L.push('');
  L.push('| Role | Login (email / phone / roll) | Password |');
  L.push('|------|------------------------------|----------|');
  for (const c of info.credentials) {
    L.push(`| ${c.role} | ${c.login || c.email} | ${c.password} |`);
  }
  L.push('');
  L.push('## Portal URLs');
  L.push('');
  L.push(`| Portal | URL |`);
  L.push(`|--------|-----|`);
  L.push(`| Public org page + admission | ${info.urls.publicOrgPage} |`);
  L.push(`| Branch dashboard login | ${info.urls.branchLogin} |`);
  L.push(`| Parent / Student portal | ${info.urls.parentStudentPortal} (code: ${info.branch.code}) |`);
  L.push(`| Super Admin console | ${info.urls.superAdminConsole} |`);
  L.push('');
  L.push('> Portal shared password = school code (`' + info.branch.code + '`), jab tak admin custom set na kare.');
  return L.join('\n');
}

function writeInfoFiles(args, info) {
  const jsonPath = path.join(args.outDir, `${info.organization.code}.json`);
  const mdPath = path.join(args.outDir, `${info.organization.code}.md`);
  fs.mkdirSync(args.outDir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(info, null, 2));
  fs.writeFileSync(mdPath, mdFormat(info));
  return { jsonPath, mdPath };
}

async function printCredentials(args, org, branch, seeded) {
  const info = await collectInfo(org, branch, seeded);
  const base = process.env.CLIENT_URL || 'http://localhost:3000';

  console.log('\n================ DEMO TENANT READY ================');
  console.log(`Organization : ${org.name}  (code: ${org.code}, slug: ${org.slug})`);
  console.log(`Branch       : ${branch.name}  (code: ${branch.code})`);
  if (seeded) console.log('Data         : basic CRUD data seeded ✔');
  else console.log('Data         : demo data already exists (--reset --yes for fresh)');
  console.log('\nLogin credentials:');
  info.credentials.forEach((c) => console.log(`  ${c.role.padEnd(9)}: ${c.login || c.email} / ${c.password}`));
  console.log('\nDemo URLs:');
  console.log(`  Public org page + admission : ${base}/o/${org.slug}`);
  console.log(`  Branch dashboard            : ${base}/login?code=${branch.code}`);
  console.log(`  Parent/student portal       : ${base}/parent/login (code: ${branch.code})`);

  if (args.writeFile) {
    const { jsonPath, mdPath } = writeInfoFiles(args, info);
    console.log('\nInfo files written:');
    console.log(`  ${mdPath}`);
    console.log(`  ${jsonPath}`);
  }
  console.log('====================================================');
  return info;
}

async function main() {
  const args = parseArgs();
  console.log('=== School ERP — Demo Data Seeder ===\n');

  if (!args.code) {
    args.code = await deriveCode(args.name);
    console.log(`Code auto-derived from name: "${args.code}"`);
  }

  let org = await prisma.organization.findUnique({ where: { code: args.code } });

  if (org && args.reset) {
    if (!args.yes) {
      console.error(`--reset se demo tenant "${org.name}" (${org.code}) ka SARA data delete hoga.`);
      console.error('Confirm karne ke liye --yes bhi lagao: npm run demo -- --reset --yes');
      process.exit(1);
    }
    await wipeDemoTenant(org);
    org = null;
  }

  if (!org) org = await createDemoOrganization(args);
  const branch = await findOrCreateBranch(org);

  const existingStudents = await prisma.student.count({ where: { schoolId: branch.id } });
  let seeded = false;
  if (existingStudents > 0 && !args.reset) {
    console.log(`\n"${branch.name}" mein demo data pehle se maujood hai (${existingStudents} students) — skip.`);
  } else {
    await seedBranch(branch, {
      students: args.students,
      teachers: args.teachers,
      months: args.months,
    });
    seeded = true;
  }

  await printCredentials(args, org, branch, seeded);
  await invalidateOrgCaches(org.id);
  console.log('\n✔ Demo done! Dobara chahie to: npm run demo -- --name "' + args.name + '" --reset --yes');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((err) => { console.error('DEMO SEED FAILED:', err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}