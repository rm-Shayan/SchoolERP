import ApiError from "./utils/ApiError.js";

/**
 * Race-safe capacity check for a class+section combination.
 *
 * MUST be called inside an interactive Prisma transaction (`prisma.$transaction`):
 * - `SELECT ... FOR UPDATE` locks the Section row, so do users ek hi waqt students
 *   assign karein to bhi dono ek saath capacity exceed nahi kar sakte — pehla
 *   transaction section par lock rakhta hai, doosra lock release hone tak wait
 *   karta hai.
 * - Count sirf ACTIVE students karta hai (graduated/dropped-out capacity me nahi).
 *
 * @param tx       interactive transaction client
 * @param sectionId target Section (class+section combination)
 * @param opts.excludeStudentId — count se exclude (e.g. same student ke re-assignment me)
 */
export async function assertSectionHasSeat(tx, sectionId, { excludeStudentId } = {}) {
  const rows = await tx.$queryRaw`SELECT id, capacity FROM "Section" WHERE id = ${sectionId} FOR UPDATE`;
  const section = rows[0];
  if (!section) throw ApiError.notFoundError("Section not found");

  // capacity null/0 = unlimited (abhi configure nahi hui).
  const capacity = section.capacity == null ? null : Number(section.capacity);
  if (!capacity || capacity <= 0) return section;

  const where = { sectionId, status: "ACTIVE" };
  if (excludeStudentId) where.id = { not: excludeStudentId };
  const count = await tx.student.count({ where });

  if (count >= capacity) {
    throw ApiError.badRequestError(
      `Section is full — ${count}/${capacity} students enrolled. Pehle capacity badhao ya doosra section select karo.`
    );
  }
  return section;
}

/**
 * Move-aware capacity check for bulk operations (e.g. promote N students into a
 * section): counts current ACTIVE students + the number being moved in.
 * Also row-locked — call inside an interactive transaction.
 */
export async function assertSectionHasSeats(tx, sectionId, incomingCount) {
  const rows = await tx.$queryRaw`SELECT id, capacity FROM "Section" WHERE id = ${sectionId} FOR UPDATE`;
  const section = rows[0];
  if (!section) throw ApiError.notFoundError("Section not found");

  const capacity = section.capacity == null ? null : Number(section.capacity);
  if (!capacity || capacity <= 0) return section;

  const count = await tx.student.count({ where: { sectionId, status: "ACTIVE" } });
  if (count + incomingCount > capacity) {
    throw ApiError.badRequestError(
      `Section capacity exceeded — ${count} enrolled + ${incomingCount} incoming > capacity ${capacity}.`
    );
  }
  return section;
}
