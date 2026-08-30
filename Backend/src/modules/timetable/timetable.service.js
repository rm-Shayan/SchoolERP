import xlsx from "xlsx";
import timetableRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { assertOwnSchool, assertSchoolAccess } from "../../lib/scope.js";
import { timetableImportQueue } from "../../jobs/queues/timetableImport.queue.js";
import { buildCsv } from "../../lib/utils/csv.js";
import { emitToRoom } from "../../config/websocket.js";

class TimetableService {
  async createSlot(user, sectionId, data) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);

    if (data.startTime >= data.endTime) {
      throw ApiError.badRequestError("End time must be after start time");
    }

    // Run overlap + teacher-conflict checks in parallel (saves ~1 DB round-trip)
    const [overlap, teacherConflict] = await Promise.all([
      timetableRepository.findOverlappingSlot(sectionId, data.dayOfWeek, data.startTime, data.endTime),
      timetableRepository.findTeacherConflict(data.teacherId, data.dayOfWeek, data.startTime, data.endTime),
    ]);
    if (overlap) {
      throw ApiError.badRequestError(
        `Overlaps with existing slot (${overlap.startTime}–${overlap.endTime}, ${overlap.subject?.name || ""})`
      );
    }
    if (teacherConflict) {
      const sec = teacherConflict.section;
      throw ApiError.badRequestError(
        `Teacher is already assigned at ${teacherConflict.startTime}–${teacherConflict.endTime} on ${sec?.class?.name || ""} ${sec?.name || ""} (${teacherConflict.subject?.name || ""})`
      );
    }

    const slot = await timetableRepository.createSlot({
      sectionId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const schoolId = section.class.schoolId;
    emitToRoom(`school:${schoolId}`, "timetable_slot_created", { ...slot, schoolId });
    return slot;
  }

  async listSlotsBySection(user, sectionId) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertSchoolAccess(user, section.class.schoolId);
    return timetableRepository.listSlotsBySection(sectionId);
  }

  async getSlot(user, id) {
    const slot = await timetableRepository.findSlotById(id);
    if (!slot) throw ApiError.notFoundError("Timetable slot not found");
    assertSchoolAccess(user, slot.section.class.schoolId);
    return slot;
  }

  async updateSlot(user, id, data) {
    const slot = await this.getSlot(user, id);
    assertOwnSchool(user, slot.section.class.schoolId);

    const updateData = {};
    if (data.subjectId) updateData.subjectId = data.subjectId;
    if (data.teacherId) updateData.teacherId = data.teacherId;
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;

    const finalDay = updateData.dayOfWeek ?? slot.dayOfWeek;
    const finalStart = updateData.startTime ?? slot.startTime;
    const finalEnd = updateData.endTime ?? slot.endTime;

    if (finalStart >= finalEnd) {
      throw ApiError.badRequestError("End time must be after start time");
    }

    const finalTeacherId = updateData.teacherId ?? slot.teacherId;
    const [overlap, teacherConflict] = await Promise.all([
      timetableRepository.findOverlappingSlot(slot.sectionId, finalDay, finalStart, finalEnd, id),
      timetableRepository.findTeacherConflict(finalTeacherId, finalDay, finalStart, finalEnd, id),
    ]);
    if (overlap) {
      throw ApiError.badRequestError(
        `Overlaps with existing slot (${overlap.startTime}–${overlap.endTime}, ${overlap.subject?.name || ""})`
      );
    }
    if (teacherConflict) {
      const sec = teacherConflict.section;
      throw ApiError.badRequestError(
        `Teacher is already assigned at ${teacherConflict.startTime}–${teacherConflict.endTime} on ${sec?.class?.name || ""} ${sec?.name || ""} (${teacherConflict.subject?.name || ""})`
      );
    }

    const updated = await timetableRepository.updateSlot(id, updateData);
    const schoolId = slot.section.class.schoolId;
    emitToRoom(`school:${schoolId}`, "timetable_slot_updated", { ...updated, schoolId });
    return updated;
  }

  async deleteSlot(user, id) {
    const slot = await this.getSlot(user, id);
    assertOwnSchool(user, slot.section.class.schoolId);
    await timetableRepository.deleteSlot(id);
    const schoolId = slot.section.class.schoolId;
    emitToRoom(`school:${schoolId}`, "timetable_slot_deleted", { id, sectionId: slot.sectionId, schoolId });
    return true;
  }

  /**
   * Delete timetable slots for a section — optional dayOfWeek filter.
   * If dayOfWeek is provided, only that day's slots are cleared.
   */
  async clearTimetable(user, sectionId, dayOfWeek) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);
    const { count } = await timetableRepository.deleteBySectionAndDay(sectionId, dayOfWeek);
    const schoolId = section.class.schoolId;
    emitToRoom(`school:${schoolId}`, "timetable_cleared", { sectionId, dayOfWeek: dayOfWeek ?? null, deletedCount: count, schoolId });
    return { deletedCount: count };
  }

  async reorderSlots(user, sectionId, { dayOfWeek, slotIds }) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);
    return timetableRepository.reorderSlots(sectionId, dayOfWeek, slotIds);
  }

  async listSlotsByTeacher(user, teacherId, { dayOfWeek }) {
    return timetableRepository.listSlotsByTeacher(teacherId, { dayOfWeek });
  }

  /**
   * Bulk import timetable from Excel file.
   * Each row = Day, Subject, Teacher, Start Time, End Time.
   * Subject & teacher are matched by name within the school.
   */
  async importTimetable(user, sectionId, fileBuffer) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertOwnSchool(user, section.class.schoolId);

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = xlsx.utils.sheet_to_json(sheet);
    if (rawRows.length === 0) {
      throw ApiError.badRequestError("Excel sheet is empty");
    }

    const rows = rawRows
      .map((row) => ({
        day: row.Day || row.day || row["Day of Week"] || row["Day"],
        subject: row.Subject || row.subject || row["Subject Name"] || row["Subject"],
        teacher: row.Teacher || row.teacher || row["Teacher Name"] || row["Teacher"],
        startTime: row.StartTime || row.startTime || row["Start Time"] || row["Start"],
        endTime: row.EndTime || row.endTime || row["End Time"] || row["End"],
        section: row.Section || row.section || row["Section Name"] || row["Section"] || null,
      }))
      .filter((r) => r.day && r.subject && r.teacher);

    if (rows.length === 0) {
      throw ApiError.badRequestError(
        "No valid timetable rows found. Ensure columns like 'Day', 'Subject', 'Teacher', 'Start Time', 'End Time' exist."
      );
    }

    const job = await timetableImportQueue.add("import-timetable", {
      rows,
      sectionId,
      schoolId: section.class.schoolId,
    });

    return { jobId: job.id, totalRows: rows.length };
  }

  /**
   * CSV export — section ka timetable, import-compatible format.
   * Day names in full (Monday..Sunday) so the CSV can be re-imported directly.
   */
  async exportTimetable(user, sectionId) {
    const section = await timetableRepository.sectionExists(sectionId);
    if (!section) throw ApiError.notFoundError("Section not found");
    assertSchoolAccess(user, section.class.schoolId);

    const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const slots = await timetableRepository.listSlotsBySection(sectionId);

    return buildCsv(
      ["Day", "Subject", "Teacher", "Start Time", "End Time"],
      slots.map((s) => [
        DAY_NAMES[s.dayOfWeek] || s.dayOfWeek,
        s.subject?.name || "",
        s.teacher?.name || "",
        s.startTime,
        s.endTime,
      ])
    );
  }
}

export default new TimetableService();
