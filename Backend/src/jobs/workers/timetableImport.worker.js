import { Worker } from "bullmq";
import { createRedisConnection } from "../../lib/redis.connection.js";
import prisma from "../../config/db.js";
import Logger from "../../lib/utils/logger.js";
import { emitToRoom } from "../../config/websocket.js";

const logger = new Logger("timetable-import");

const DAY_MAP = {
  sunday: 7, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
  sun: 7, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};
const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function resolveDay(raw) {
  if (!raw) return null;
  const n = Number(raw);
  if (n >= 1 && n <= 7) return n;
  return DAY_MAP[String(raw).trim().toLowerCase()] ?? null;
}

function parseTime(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2}):?(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (m[3]) {
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
  }
  return `${String(h).padStart(2, "0")}:${min}`;
}

/** Check if two time ranges overlap (same day). */
function timesOverlap(dayA, sA, eA, dayB, sB, eB) {
  return dayA === dayB && sA < eB && sB < eA;
}

export const timetableImportWorker = new Worker(
  "timetable-import",
  async (job) => {
    logger.logger.info(`Starting Timetable Bulk Import Job ${job.id}`);
    const { rows, sectionId: defaultSectionId, schoolId } = job.data;

    // ── Pre-load all sections for this school (for Section column resolution) ──
    const allSections = await prisma.section.findMany({
      where: { class: { schoolId } },
      select: { id: true, name: true, class: { select: { name: true } } },
    });
    // Key: "class name|section name" or just "section name" (case-insensitive)
    const sectionMap = new Map();
    for (const s of allSections) {
      const byFullName = `${s.class.name}|${s.name}`.toLowerCase().trim();
      const byName = s.name.toLowerCase().trim();
      sectionMap.set(byFullName, s.id);
      sectionMap.set(byName, s.id);
    }

    // Resolve default section
    const defaultSection = allSections.find((s) => s.id === defaultSectionId);
    if (!defaultSection) throw new Error("Default section not found");

    // ── Pre-load subjects for EACH class (multi-section needs per-class subjects) ──
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: { subjects: { select: { id: true, name: true } } },
    });
    // classId → Map<subjectName, subjectId>
    const subjectsByClass = new Map();
    for (const c of classes) {
      const m = new Map();
      c.subjects.forEach((s) => m.set(s.name.toLowerCase().trim(), s.id));
      subjectsByClass.set(c.id, m);
    }

    // ── Pre-load all teachers for this school ──
    const teachers = await prisma.user.findMany({
      where: { schoolId, role: "TEACHER" },
      select: { id: true, name: true },
    });
    const teacherMap = new Map();
    teachers.forEach((t) => teacherMap.set(t.name.toLowerCase().trim(), t.id));

    // ── Pre-scan: detect overlapping rows WITHIN the Excel file itself ──
    const errors = [];
    const parsed = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;
      const dayOfWeek = resolveDay(row.day);
      const startTime = parseTime(row.startTime);
      const endTime = parseTime(row.endTime);
      if (dayOfWeek && startTime && endTime) {
        parsed.push({ rowIndex, dayOfWeek, startTime, endTime, section: row.section });
      }
    }
    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const a = parsed[i], b = parsed[j];
        // Same section? (both blank = same default, or same name)
        const secA = a.section || "_default";
        const secB = b.section || "_default";
        if (secA === secB && timesOverlap(a.dayOfWeek, a.startTime, a.endTime, b.dayOfWeek, b.startTime, b.endTime)) {
          errors.push({ row: a.rowIndex, error: `Overlaps with row ${b.rowIndex} (${a.startTime}–${a.endTime} vs ${b.startTime}–${b.endTime})` });
          break;
        }
      }
    }
    const errorRows = new Set(errors.map((e) => e.row));

    // ── Load existing slots per section for DB overlap check ──
    const sectionIds = new Set([defaultSectionId]);
    for (const row of rows) {
      if (row.section) {
        const key = row.section.toLowerCase().trim();
        const sid = sectionMap.get(key);
        if (sid) sectionIds.add(sid);
      }
    }
    const existingSlotsBySection = new Map();
    const allExisting = await prisma.timetableSlot.findMany({
      where: { sectionId: { in: [...sectionIds] } },
      select: { sectionId: true, dayOfWeek: true, startTime: true, endTime: true },
    });
    for (const s of allExisting) {
      if (!existingSlotsBySection.has(s.sectionId)) existingSlotsBySection.set(s.sectionId, []);
      existingSlotsBySection.get(s.sectionId).push(s);
    }

    // Track slots created in THIS batch per section
    const createdInBatch = new Map();
    for (const sid of sectionIds) {
      createdInBatch.set(sid, [...(existingSlotsBySection.get(sid) || [])]);
    }

    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;
      try {
        // ── Resolve target section ──
        let targetSectionId = defaultSectionId;
        if (row.section) {
          const secKey = String(row.section).toLowerCase().trim();
          const found = sectionMap.get(secKey);
          if (!found) {
            errors.push({ row: rowIndex, error: `Section not found: '${row.section}'` });
            continue;
          }
          targetSectionId = found;
        }
        const targetSection = allSections.find((s) => s.id === targetSectionId);

        const dayOfWeek = resolveDay(row.day);
        if (!dayOfWeek) {
          errors.push({ row: rowIndex, error: `Invalid day: '${row.day || ""}'` });
          continue;
        }

        // Resolve subject for the TARGET section's class
        const classSubjects = subjectsByClass.get(targetSection?.class?.id ?? "");
        const subjectName = (row.subject || "").trim().toLowerCase();
        const subjectId = classSubjects?.get(subjectName);
        if (!subjectId) {
          errors.push({ row: rowIndex, error: `Subject not found: '${row.subject || ""}' (check class "${targetSection?.class?.name || "?"}")` });
          continue;
        }

        const teacherName = (row.teacher || "").trim().toLowerCase();
        const teacherId = teacherMap.get(teacherName);
        if (!teacherId) {
          errors.push({ row: rowIndex, error: `Teacher not found: '${row.teacher || ""}'` });
          continue;
        }

        const startTime = parseTime(row.startTime);
        const endTime = parseTime(row.endTime);
        if (!startTime || !endTime) {
          errors.push({ row: rowIndex, error: `Invalid time: '${row.startTime || ""}' / '${row.endTime || ""}'` });
          continue;
        }

        if (errorRows.has(rowIndex)) continue;

        if (startTime >= endTime) {
          errors.push({ row: rowIndex, error: `End time (${endTime}) must be after start time (${startTime})` });
          continue;
        }

        // Check overlap against existing + batch-created slots for THIS section
        const batch = createdInBatch.get(targetSectionId) || [];
        const hasOverlap = batch.some((s) => timesOverlap(s.dayOfWeek, s.startTime, s.endTime, dayOfWeek, startTime, endTime));
        if (hasOverlap) {
          errors.push({ row: rowIndex, error: `Overlaps with existing slot on ${DAY_NAMES[dayOfWeek]} ${startTime}–${endTime} in section "${targetSection?.name || "?"}"` });
          continue;
        }

        await prisma.timetableSlot.create({
          data: { sectionId: targetSectionId, subjectId, teacherId, dayOfWeek, startTime, endTime },
        });

        successCount++;
        batch.push({ dayOfWeek, startTime, endTime });

        if ((i + 1) % 20 === 0 || i + 1 === rows.length) {
          emitToRoom(`job:${job.id}`, "timetable_import_progress", {
            jobId: job.id, current: i + 1, total: rows.length,
            progress: Math.round(((i + 1) / rows.length) * 100),
          });
        }
      } catch (err) {
        logger.logger.error(`[Timetable Import] Row error: ${err.message}`);
        errors.push({ row: rowIndex, error: err.message });
      }
    }

    logger.logger.info(`Timetable Import Job ${job.id} done. Success: ${successCount}, Failed: ${errors.length}`);
    return { successCount, failedCount: errors.length, errors };
  },
  { connection: createRedisConnection(), concurrency: 1, drainDelay: 60, stalledInterval: 5 * 60 * 1000 }
);

timetableImportWorker.on("error", (err) =>
  logger.logger.error(`[bullmq] Worker 'timetable-import' error: ${err.message}`)
);
timetableImportWorker.on("completed", (job) => {
  logger.logger.info(`[timetable-import] Job completed: ${job.id}`);
  emitToRoom(`job:${job.id}`, "timetable_import_completed", { jobId: job.id, result: job.returnvalue });
});
timetableImportWorker.on("failed", (job, err) => {
  logger.logger.error(`[timetable-import] Job failed: ${job?.id || "unknown"} — ${err.message}`);
  emitToRoom(`job:${job?.id}`, "timetable_import_failed", { jobId: job?.id, error: err.message });
});
