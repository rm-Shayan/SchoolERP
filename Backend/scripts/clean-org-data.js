/**
 * Organization/branch ka saara data DB se clean karne wala script.
 *
 *   Dry-run (sirf counts dikhata hai, kuch delete nahi karta):
 *     node --env-file=.env scripts/clean-org-data.js --org <orgId>
 *     node --env-file=.env scripts/clean-org-data.js --branch <schoolId[,id2]>
 *
 *   Actual deletion (--yes zaroori):
 *     node --env-file=.env scripts/clean-org-data.js --org <orgId> --yes
 *     node --env-file=.env scripts/clean-org-data.js --branch <schoolId> --yes
 *
 * Flags:
 *   --org <id[,id]>       poore organizations (saari branches + org row)
 *   --branch <id[,id]>    sirf ye branches (organization row rehti hai)
 *   --prune-parents       jin parents ke saare bache delete ho chuke unhe bhi hata do
 *   --yes                 bina iske sirf dry-run hota hai
 *
 * Images/files: delete hone wali rows (org/branch logos, avatars, student/applicant
 * photos, documents) ki local `/uploads/...` files bhi disk se hatti hain.
 * Cloudinary URLs yahan skip hoti hain — wo global sweep dekhta hai:
 *   npm run cleanup:orphans            (dry-run)  /  npm run cleanup:orphans:apply
 *
 * Delete order (FK-safe): students -> timetableSlots -> users -> schools -> organization.
 * Baqi sab (attendance/fees/results/classes/sections/academicYears...) cascade se
 * apne aap saaf ho jata hai.
 */
import prisma from '../src/config/db.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const UPLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const USAGE = 'node --env-file=.env scripts/clean-org-data.js --org <id> | --branch <id[,id]> [--prune-parents] [--yes]';

function parseArgs() {
  const args = { orgIds: [], branchIds: [], pruneParents: false, yes: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--org') args.orgIds.push(...argv[++i].split(','));
    else if (k === '--branch') args.branchIds.push(...argv[++i].split(','));
    else if (k === '--prune-parents') args.pruneParents = true;
    else if (k === '--yes') args.yes = true;
    else if (k === '--help' || k === '-h') { console.log(USAGE); process.exit(0); }
  }
  if (!args.orgIds.length && !args.branchIds.length) {
    console.error('ERROR: --org ya --branch required hai.\n' + USAGE);
    process.exit(1);
  }
  return args;
}

async function resolveSchoolIds(args) {
  const where = [];
  if (args.branchIds.length) where.push({ id: { in: args.branchIds } });
  if (args.orgIds.length) where.push({ organizationId: { in: args.orgIds } });
  const schools = await prisma.school.findMany({ where: { OR: where }, select: { id: true, name: true, code: true, organizationId: true } });
  const missingBranches = args.branchIds.filter((id) => !schools.some((s) => s.id === id));
  if (missingBranches.length) console.warn('WARN: ye branch IDs nahi mile:', missingBranches.join(', '));
  return schools;
}

async function collectCounts(schoolIds) {
  return {
    students: await prisma.student.count({ where: { schoolId: { in: schoolIds } } }),
    timetableSlots: await prisma.timetableSlot.count({ where: { section: { class: { schoolId: { in: schoolIds } } } } }),
    users: await prisma.user.count({ where: { schoolId: { in: schoolIds } } }),
    classes: await prisma.class.count({ where: { schoolId: { in: schoolIds } } }),
    academicYears: await prisma.academicYear.count({ where: { schoolId: { in: schoolIds } } }),
    feeStructures: await prisma.feeStructure.count({ where: { schoolId: { in: schoolIds } } }),
  };
}

// ─── Image/file cleanup ─────────────────────────────────────────────────────
// Wipe hone wali rows ki image URLs collect karo (DB delete se PEHLE).
function localUploadPath(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  const p = path.resolve(UPLOAD_ROOT, url.replace('/uploads/', ''));
  if (!p.startsWith(UPLOAD_ROOT + path.sep)) return null; // path traversal guard
  return p;
}

async function collectImageUrls(schoolIds, args) {
  const urls = [];
  const push = (u) => { if (u) urls.push(u); };
  const [schools, users, students, applicants] = await Promise.all([
    prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { logoUrl: true } }),
    prisma.user.findMany({ where: { schoolId: { in: schoolIds } }, select: { avatarUrl: true } }),
    prisma.student.findMany({ where: { schoolId: { in: schoolIds } }, select: { imageUrl: true } }),
    prisma.applicant.findMany({ where: { schoolId: { in: schoolIds } }, select: { imageUrl: true } }),
  ]);
  schools.forEach((s) => push(s.logoUrl));
  users.forEach((u) => push(u.avatarUrl));
  students.forEach((s) => push(s.imageUrl));
  applicants.forEach((a) => push(a.imageUrl));
  if (args.orgIds.length) {
    const orgs = await prisma.organization.findMany({ where: { id: { in: args.orgIds } }, select: { logoUrl: true } });
    orgs.forEach((o) => push(o.logoUrl));
  }
  return urls;
}

async function deleteLocalFiles(urls) {
  let deleted = 0, missing = 0, cloud = 0;
  const seen = new Set();
  for (const url of urls) {
    if (/^https?:\/\//.test(url)) { cloud++; continue; } // Cloudinary — global sweep handle karta hai
    const p = localUploadPath(url);
    if (!p || seen.has(p)) continue;
    seen.add(p);
    try { await fs.unlink(p); deleted++; }
    catch (e) { if (e.code === 'ENOENT') missing++; else throw e; }
  }
  return { deleted, missing, cloud };
}

async function wipe(schoolIds, args) {
  const results = await prisma.$transaction(async (tx) => {
    // 1. Students pehle — Student.section FK cascade nahi hai
    const students = await tx.student.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // 2. Timetable slots/substitutes users se pehle — teacher FK cascade nahi hai
    const timetableSlots = await tx.timetableSlot.deleteMany({ where: { section: { class: { schoolId: { in: schoolIds } } } } });
    // 3. Staff accounts
    const users = await tx.user.deleteMany({ where: { schoolId: { in: schoolIds } } });
    // 4. Schools — baqi sab data (classes/sections/years/fees/circulars/etc.) cascade se jata hai
    const schoolsDeleted = await tx.school.deleteMany({ where: { id: { in: schoolIds } } });

    let parents = null;
    let organizations = null;
    if (args.pruneParents) {
      parents = await tx.parent.deleteMany({ where: { students: { none: {} } } });
    }
    if (args.orgIds.length) {
      organizations = await tx.organization.deleteMany({ where: { id: { in: args.orgIds } } });
    }
    return { students, timetableSlots, users, schoolsDeleted, parents, organizations };
  });
  return results;
}

async function main() {
  const args = parseArgs();
  const schools = await resolveSchoolIds(args);
  if (!schools.length) { console.error('Koi target school nahi mila — kuch nahi kiya.'); process.exit(1); }

  const schoolIds = schools.map((s) => s.id);
  console.log('Target branches:');
  for (const s of schools) console.log(`  - ${s.name} (${s.code}) [${s.id}]`);
  if (args.orgIds.length) console.log(`Organizations: ${args.orgIds.join(', ')}`);

  const counts = await collectCounts(schoolIds);
  const imageUrls = await collectImageUrls(schoolIds, args);
  const cloudCount = imageUrls.filter((u) => /^https?:\/\//.test(u)).length;
  console.log('\nDelete hone wala data:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(16)} ${v}`);
  if (args.pruneParents) console.log('  parents          (orphans — --prune-parents)');
  if (args.orgIds.length) console.log('  organizations    (+ smtp/storage settings, cascade)');
  console.log(`  images/files     ${imageUrls.length} (local: ${imageUrls.length - cloudCount}, cloudinary-skip: ${cloudCount})`);

  if (!args.yes) {
    console.log('\nDRY-RUN — kuch delete nahi hua. Confirm ke liye --yes lagao.');
    return;
  }

  console.log('\nDeleting...');
  const r = await wipe(schoolIds, args);
  const files = await deleteLocalFiles(imageUrls);
  console.log('Deleted:');
  console.log(`  students        ${r.students.count}`);
  console.log(`  timetableSlots  ${r.timetableSlots.count}`);
  console.log(`  users           ${r.users.count}`);
  console.log(`  schools         ${r.schoolsDeleted.count}`);
  if (r.parents) console.log(`  parents         ${r.parents.count}`);
  if (r.organizations) console.log(`  organizations   ${r.organizations.count}`);
  console.log(`  local files     ${files.deleted} (already-missing: ${files.missing}, cloudinary-skipped: ${files.cloud})`);
  console.log('\nDone ✔');
}

main()
  .catch((err) => { console.error('CLEANUP FAILED:', err?.message ?? err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
