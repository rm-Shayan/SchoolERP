import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import attendanceService from "./attendance.service.js";
import auditService from "../audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../audit/actions.js";

/**
 * Phantom Attendance Cleanup Service
 *
 * The old manualOverride / markSectionBulkAttendance parsed "YYYY-MM-DD" with
 * `new Date(date).setHours(0,0,0,0)` — on a UTC+5 (PKT) server that stored the
 * PREVIOUS day. Overrides therefore created/updated a record the UI never
 * queried. This service finds those records and deletes them by explicit ID.
 *
 * Phantom signature (best-effort, admin reviews before deleting):
 *  - never scanned:  checkIn IS NULL and scanLog empty/absent (manual-only row)
 *  - created the calendar day AFTER its stored date (the bug's fingerprint —
 *    overriding day D landed on D-1 while createdAt kept the real moment)
 *
 * Note: a legitimate back-dated manual mark (marking yesterday's absence
 * today) has the same shape — that is why deletion always goes through an
 * admin-reviewed preview + explicit IDs, re-verified server-side.
 */

const DEFAULT_RANGE_DAYS = 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const utcDayKey = (d) => d.toISOString().slice(0, 10);
const midnight = (key) => new Date(`${key}T00:00:00.000Z`);
const addDays = (date, n) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** Bug fingerprint — see class doc. Pure data check, no DB access. */
function isPhantomShaped(r) {
  if (r.checkIn) return false;
  const hasScanLog = Array.isArray(r.scanLog) ? r.scanLog.length > 0 : r.scanLog != null;
  if (hasScanLog) return false;
  return utcDayKey(r.createdAt) === utcDayKey(addDays(r.date, 1));
}

function assertBranchScope(actor, schoolId) {
  if (actor?.role === "ADMIN" && actor.schoolId && actor.schoolId !== schoolId) {
    throw ApiError.forbiddenError("Cannot access another branch's attendance records");
  }
}

function parseRange(dateFrom, dateTo) {
  if (dateFrom && !DATE_RE.test(dateFrom)) throw ApiError.badRequestError("dateFrom must be YYYY-MM-DD");
  if (dateTo && !DATE_RE.test(dateTo)) throw ApiError.badRequestError("dateTo must be YYYY-MM-DD");
  const endExclusive = addDays(midnight(dateTo || utcDayKey(new Date())), 1);
  const start = dateFrom ? midnight(dateFrom) : addDays(endExclusive, -DEFAULT_RANGE_DAYS);
  return { start, endExclusive };
}

class AttendancePhantomService {
  /**
   * GET /attendance/phantoms — preview only, deletes nothing.
   * @returns {{ range: {dateFrom, dateTo}, totalCandidates: number, records: Array }}
   */
  async findPhantoms(schoolId, { dateFrom, dateTo } = {}, actor = null) {
    assertBranchScope(actor, schoolId);
    const { start, endExclusive } = parseRange(dateFrom, dateTo);

    const rows = await prisma.attendanceRecord.findMany({
      where: {
        student: { schoolId },
        checkIn: null,
        date: { gte: start, lt: endExclusive },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            section: { select: { name: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const candidates = rows.filter(isPhantomShaped);

    // Smoking-gun flag: did the student actually SCAN on the day after the
    // phantom's date (i.e. the day the override was really meant for)?
    const scannedKeys = new Set();
    if (candidates.length > 0) {
      const scanned = await prisma.attendanceRecord.findMany({
        where: {
          studentId: { in: [...new Set(candidates.map((c) => c.studentId))] },
          checkIn: { not: null },
          date: { gte: addDays(start, 1), lt: addDays(endExclusive, 1) },
        },
        select: { studentId: true, date: true },
      });
      for (const s of scanned) scannedKeys.add(`${s.studentId}:${utcDayKey(s.date)}`);
    }

    return {
      range: { dateFrom: utcDayKey(start), dateTo: utcDayKey(addDays(endExclusive, -1)) },
      totalCandidates: candidates.length,
      records: candidates.map((r) => ({
        id: r.id,
        date: utcDayKey(r.date),
        status: r.status,
        remarks: r.remarks,
        createdAt: r.createdAt,
        student: r.student
          ? {
              id: r.student.id,
              name: `${r.student.firstName} ${r.student.lastName}`,
              rollNumber: r.student.rollNumber,
              section: r.student.section
                ? `${r.student.section.class?.name ?? ""} ${r.student.section.name}`.trim()
                : null,
            }
          : null,
        dayAfterScanned: scannedKeys.has(`${r.studentId}:${utcDayKey(addDays(r.date, 1))}`),
      })),
    };
  }

  /**
   * POST /attendance/phantoms/cleanup — delete ONLY explicitly selected IDs,
   * re-verified against the phantom signature at delete time (a stale preview
   * can never delete a record that has since gained real scan data).
   * @returns {{ deleted: number, skipped: string[] }}
   */
  async deletePhantoms(schoolId, ids, actor = null) {
    assertBranchScope(actor, schoolId);
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequestError("ids array with at least one record ID is required");
    }

    const rows = await prisma.attendanceRecord.findMany({
      where: { id: { in: ids }, student: { schoolId } },
    });
    const deletable = rows.filter(isPhantomShaped);
    const skipped = rows.filter((r) => !isPhantomShaped(r)).map((r) => r.id);

    let deleted = 0;
    if (deletable.length > 0) {
      const result = await prisma.attendanceRecord.deleteMany({
        where: { id: { in: deletable.map((r) => r.id) } },
      });
      deleted = result.count;

      const dates = [...new Set(deletable.map((r) => utcDayKey(r.date)))];
      for (const d of dates) {
        try { await attendanceService._invalidateDailyCache(schoolId, midnight(d)); } catch (_) {}
      }
    }

    auditService.record({
      actorId: actor?.id,
      actorName: actor?.name,
      actorRole: actor?.role,
      action: AUDIT_ACTIONS.CLEANUP_ATTENDANCE,
      entityType: AUDIT_ENTITY_TYPES.SCHOOL,
      entityId: schoolId,
      schoolId,
      details: JSON.stringify({ deleted, skippedCount: skipped.length, recordIds: deletable.map((r) => r.id) }),
    });

    return { deleted, skipped };
  }
}

export default new AttendancePhantomService();
