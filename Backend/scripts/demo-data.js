/**
 * One-command DEMO tenant seeder — client demo ke liye.
 *
 * Jab aap client ke paas demo karne jate hain, to ek hi command mein ek naya
 * demo organization + branch bana deta hai (ya existing demo code wala tenant
 * reuse karta hai) aur har CRUD module ke liye basic sample data bhar deta hai
 * — classes, students, fee records, attendance, teachers, timetable, etc.
 * Real client data kabhi touch nahi hota (default: sirf DEMO code ka tenant).
 *
 * Usage:
 *   npm run demo                                        # default demo tenant + basic data
 *   npm run demo -- --name "ABC School" --code ABC       # apni branding/code
 *   npm run demo -- --students 10 --teachers 3 --months 2
 *   npm run demo -- --reset --yes                       # demo tenant wipe + fresh reseed
 *
 * Flags:
 *   --name <text>     Demo organization ka display name (default: Demo Academy)
 *   --code <code>     Demo organization ka unique code/slug base (default: DEMO).
 *                     Same code dobara run karo → wahi demo tenant reuse hota hai.
 *   --students <n>    Kitne students banane hain (default: 6 — small demo set)
 *   --teachers <n>    Teachers ki count (default: 2, + 1 branch ADMIN)
 *   --months <n>      Fee records kitne mahine (default: 2)
 *   --reset           Demo tenant (saara data) delete karke naye se banta hai
 *   --yes             --reset ka confirmation (clean-org-data wala hi pattern)
 *
 * Seed data (per branch) seed-data.js se reuse hoti hai:
 *   academic year/terms, classes 1-5 + sections A/B, subjects, teachers,
 *   fee structure + PAID/PARTIAL/UNPAID/OVERDUE records, students + parents,
 *   exams/results, timetable, attendance (last 5 school days), circulars,
 *   activities, PTM, homework, conduct remarks, applicants.
 */
import prisma from '../src/config/db.js';
import { pathToFileURL } from 'url';
import { seedBranch } from './seed-data.js';

const USAGE = `node --env-file=.env scripts/demo-data.js [--name "Demo Academy"] [--code DEMO]
       [--students 6] [--teachers 2] [--months 2] [--reset --yes]`;

function parseArgs() {
  const args = {
    name: 'Demo Academy',
    code: 'DEMO',
    students: 6,
    teachers: 2,
    months: 2,
    reset: false,
    yes: false,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--name') args.name = argv[++i];
    else if (k === '--code') args.code = argv[++i].trim().toUpperCase();
    else if (k === '--students') args.students = parseInt(argv[++i], 10);
    else if (k === '--teachers') args.teachers = parseInt(argv[++i], 10);
    else if (k === '--months') args.months = parseInt(argv[++i], 10);
    else if (k === '--reset') args.reset = true;
    else if (k === '--yes') args.yes = true;
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

// Unique slug (org.slug unique hai) — code ke pehle se ek alag org ho to suffix.
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

async function printCredentials(org, branch, seeded) {
  const staff = await prisma.user.findMany({
    where: { schoolId: branch.id },
    select: { name: true, email: true, role: true },
    orderBy: { role: 'asc' },
  });
  const admin = staff.find((u) => u.role === 'ADMIN');
  const teachers = staff.filter((u) => u.role === 'TEACHER');

  console.log('\n================ DEMO TENANT READY ================');
  console.log(`Organization : ${org.name}  (code: ${org.code}, slug: ${org.slug})`);
  console.log(`Branch       : ${branch.name}  (code: ${branch.code})`);
  if (seeded) console.log('Data         : basic CRUD data seeded ✔');
  else console.log('Data         : demo data already exists (--reset --yes for fresh)');
  console.log('\nLogin credentials:');
  if (admin) console.log(`  ADMIN    : ${admin.email} / Admin@123`);
  teachers.forEach((t, idx) => console.log(`  TEACHER  : ${t.email} / Teacher@123`));
  console.log('\nLogin URL options: school code login (code + email + password) ya direct email + password.');
  console.log('====================================================');
}

async function main() {
  const args = parseArgs();
  console.log('=== School ERP — Demo Data Seeder ===\n');

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

  await printCredentials(org, branch, seeded);
  await invalidateOrgCaches(org.id);
  console.log('\n✔ Demo done! Dobara chahie to: npm run demo -- --reset --yes');
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main()
    .catch((err) => { console.error('DEMO SEED FAILED:', err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
