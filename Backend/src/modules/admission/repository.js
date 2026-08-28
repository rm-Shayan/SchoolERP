import prisma from "../../config/db.js";

class AdmissionRepository {
  async classExists(classId) {
    return prisma.class.findUnique({
      where: { id: classId },
      include: { school: { select: { id: true, name: true } } },
    });
  }

  async sectionExists(sectionId) {
    return prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
  }

  async createApplicant(data) {
    return prisma.applicant.create({ data });
  }

  async findApplicantById(id) {
    return prisma.applicant.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            // Org branding — slips/emails theme-wise banane ke liye
            organization: { select: { id: true, name: true, logoUrl: true, themeColor: true } },
          },
        },
        class: true,
        documents: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async deleteApplicant(id) {
    return prisma.applicant.delete({ where: { id } });
  }

  // ── Documents (B-form / birth certificate) ─────────────────────
  async createDocument(data) {
    return prisma.applicantDocument.create({ data });
  }

  async findDocumentById(id) {
    return prisma.applicantDocument.findUnique({ where: { id } });
  }

  async deleteDocument(id) {
    return prisma.applicantDocument.delete({ where: { id } });
  }

  async listApplicants({ schoolId, status, classId, search, from, to, page, pageSize }) {
    const where = { schoolId };
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { parentPhone: { contains: search, mode: "insensitive" } },
        { parentWhatsappNo: { contains: search, mode: "insensitive" } },
      ];
    }
    // Date-range filter (createdAt) — From/To dates (inclusive end-of-day)
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        include: {
          class: true,
          documents: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.applicant.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /**
   * All matching applicants (no pagination) — CSV export ke liye.
   */
  async findAllApplicants({ schoolId, status, classId, search, from, to }) {
    const where = { schoolId };
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { parentPhone: { contains: search, mode: "insensitive" } },
        { parentWhatsappNo: { contains: search, mode: "insensitive" } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    return prisma.applicant.findMany({
      where,
      include: { class: true },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });
  }

  // ── Pipeline statistics (PRD §8 — admission funnel) ───────────
  async getFunnel(schoolId) {
    const groups = await prisma.applicant.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { _all: true },
    });

    const counts = groups.reduce((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});
    counts.total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return counts;
  }

  // ── Enroll → duplicate checks ──────────────────────────────────
  // NOTE: `client = prisma` param — interactive transaction ke andar capacity
  // check + insert ek saath ho (race-safe), nahi to do users ek saath enroll
  // kar ke capacity exceed kar sakte hain.
  async findRollNumberInSchool(schoolId, rollNumber, excludeId, client = prisma) {
    return client.student.findFirst({
      where: {
        schoolId,
        rollNumber,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }

  /**
   * Next auto roll number for a school — existing numeric rolls ka max + 1
   * (transaction ke andar call karo taake do enrolls ek saath same number na
   * paayein; duplicate check bhi transaction mein hi hota hai).
   */
  async findNextRollNumber(schoolId, client = prisma) {
    const students = await client.student.findMany({
      where: { schoolId },
      select: { rollNumber: true },
    });
    const nums = students
      .map((s) => s.rollNumber)
      .filter((r) => r && /^\d+$/.test(r))
      .map(Number);
    return String(nums.length ? Math.max(...nums) + 1 : 1);
  }

  async upsertParent(data, client = prisma) {
    return client.parent.upsert({
      where: { whatsappNo: data.whatsappNo },
      update: {
        name: data.name || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      },
      create: data,
    });
  }

  async createStudent(data, client = prisma) {
    return client.student.create({ data });
  }

  async updateApplicant(id, data, client = prisma) {
    return client.applicant.update({ where: { id }, data });
  }
}

export default new AdmissionRepository();
