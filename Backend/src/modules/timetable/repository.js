import prisma from "../../config/db.js";

class TimetableRepository {
  async sectionExists(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  async createSlot(data) {
    return prisma.timetableSlot.create({ data });
  }

  async findSlotById(id) {
    return prisma.timetableSlot.findUnique({
      where: { id },
      include: {
        section: { include: { class: true } },
        subject: true,
        teacher: { select: { id: true, name: true } },
      },
    });
  }

  async updateSlot(id, data) {
    return prisma.timetableSlot.update({ where: { id }, data });
  }

  async deleteSlot(id) {
    return prisma.timetableSlot.delete({ where: { id } });
  }

  async deleteAllBySection(sectionId) {
    return prisma.timetableSlot.deleteMany({ where: { sectionId } });
  }

  /** Delete slots for a section, optionally filtered by dayOfWeek. */
  async deleteBySectionAndDay(sectionId, dayOfWeek) {
    const where = { sectionId };
    if (dayOfWeek !== undefined && dayOfWeek !== null) where.dayOfWeek = dayOfWeek;
    return prisma.timetableSlot.deleteMany({ where });
  }

  async listSlotsBySection(sectionId) {
    return prisma.timetableSlot.findMany({
      where: { sectionId },
      include: { subject: true, teacher: { select: { id: true, name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async listSlotsByTeacher(teacherId, { dayOfWeek }) {
    const where = { teacherId };
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    return prisma.timetableSlot.findMany({
      where,
      include: { section: { include: { class: true } }, subject: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  /**
   * Find any slot that overlaps the given time range on the same day & section.
   * Two ranges overlap when: existingStart < newEnd AND newStart < existingEnd.
   * `excludeId` skips the current slot (for updates).
   */
  async findOverlappingSlot(sectionId, dayOfWeek, startTime, endTime, excludeId) {
    const where = {
      sectionId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };
    if (excludeId) where.id = { not: excludeId };
    return prisma.timetableSlot.findFirst({ where, select: { id: true, startTime: true, endTime: true, subject: { select: { name: true } } } });
  }

  /**
   * Find any slot where this teacher is already assigned at overlapping times
   * across ALL sections (not just one). Used to prevent double-booking a teacher.
   */
  async findTeacherConflict(teacherId, dayOfWeek, startTime, endTime, excludeId) {
    const where = {
      teacherId,
      dayOfWeek,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };
    if (excludeId) where.id = { not: excludeId };
    return prisma.timetableSlot.findFirst({
      where,
      select: {
        id: true, startTime: true, endTime: true,
        section: { select: { name: true, class: { select: { name: true } } } },
        subject: { select: { name: true } },
      },
    });
  }
}

export default new TimetableRepository();
