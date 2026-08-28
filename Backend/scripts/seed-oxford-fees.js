/**
 * Create fee structures for Oxford org — all branches, all classes.
 *
 * Usage: node --env-file=.env scripts/seed-oxford-fees.js
 *
 * Each class gets its own fee structure with monthly tuition breakdown.
 * Default fee items (configurable below):
 *   - Tuition Fee: 5000
 *   - Lab Fee: 500
 *   - Exam Fee: 300
 *   - Stationery: 200
 * Total per class: 6000/month
 */
import prisma from '../src/config/db.js';

// ── Configurable fee items ────────────────────────────────────────
const FEE_ITEMS = [
  { title: 'Tuition Fee', amount: 5000 },
  { title: 'Lab Fee', amount: 500 },
  { title: 'Exam Fee', amount: 300 },
  { title: 'Stationery', amount: 200 },
];

async function main() {
  console.log('=== Oxford Fee Structures Seeding ===\n');

  // 1. Find the Oxford organization
  const org = await prisma.organization.findFirst({
    where: { slug: 'oxford' },
    select: { id: true, name: true, slug: true },
  });

  if (!org) {
    console.error('ERROR: Organization with slug "oxford" not found');
    process.exit(1);
  }
  console.log(`Organization: ${org.name} (${org.slug}) — ID: ${org.id}\n`);

  // 2. Find all branches of Oxford
  const schools = await prisma.school.findMany({
    where: { organizationId: org.id, status: 'ACTIVE' },
    select: { id: true, name: true, code: true },
  });

  if (!schools.length) {
    console.error('ERROR: No active branches found for Oxford org');
    process.exit(1);
  }
  console.log(`Found ${schools.length} branch(es):`);
  for (const s of schools) {
    console.log(`  - ${s.name} (${s.code}) — ${s.id}`);
  }
  console.log('');

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const school of schools) {
    console.log(`--- Branch: ${school.name} (${school.code}) ---`);

    // 3. Get current academic year
    const year = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
    });
    if (!year) {
      console.log(`  ⚠ No current academic year found — skipping`);
      continue;
    }
    console.log(`  Academic year: ${year.name}`);

    // 4. Get all classes for this branch
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      select: { id: true, name: true },
      orderBy: { order: 'asc' },
    });

    if (!classes.length) {
      console.log(`  ⚠ No classes found — skipping`);
      continue;
    }
    console.log(`  Classes found: ${classes.length}`);

    // 5. Create fee structure for each class
    for (const cls of classes) {
      const structureName = `Monthly Fee ${year.name} - ${cls.name}`;

      const existing = await prisma.feeStructure.findFirst({
        where: {
          schoolId: school.id,
          academicYearId: year.id,
          classes: { some: { id: cls.id } },
        },
      });

      if (existing) {
        console.log(`  ⏭ ${cls.name}: Fee structure already exists (${existing.name}) — skipping`);
        totalSkipped++;
        continue;
      }

      const structure = await prisma.feeStructure.create({
        data: {
          schoolId: school.id,
          academicYearId: year.id,
          name: structureName,
          classes: { connect: [{ id: cls.id }] },
          lineItems: {
            create: FEE_ITEMS.map((item) => ({
              title: item.title,
              amount: item.amount,
              isLateFee: false,
              lateFeeDays: 0,
            })),
          },
        },
        include: { lineItems: true, classes: { select: { name: true } } },
      });

      const total = structure.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
      console.log(`  ✅ ${cls.name}: "${structure.name}" — Rs ${total}/month (${structure.lineItems.length} items)`);
      totalCreated++;
    }

    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`  Created: ${totalCreated}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log('✔ Done!');
}

main()
  .catch((err) => { console.error('FAILED:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
