import prisma from "../../config/db.js";

class ModerationRepository {
  // ── Organization ──────────────────────────────────────────────
  async findOrgById(id) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { branches: true } },
      },
    });
  }

  async updateOrg(id, data) {
    return prisma.organization.update({ where: { id }, data });
  }

  async updateSchoolsByOrg(organizationId, data) {
    return prisma.school.updateMany({ where: { organizationId }, data });
  }

  async countBlockedSchools(organizationId) {
    return prisma.school.count({ where: { organizationId, status: "BLOCKED" } });
  }

  // ── School ───────────────────────────────────────────────────
  async findSchoolIdsByOrg(organizationId) {
    return prisma.school.findMany({
      where: { organizationId },
      select: { id: true },
    });
  }

  async findSchoolById(id) {
    return prisma.school.findUnique({
      where: { id },
      include: { organization: { select: { id: true, name: true, status: true } } },
    });
  }

  async updateSchool(id, data) {
    return prisma.school.update({ where: { id }, data });
  }

  // ── User ─────────────────────────────────────────────────────
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async updateUser(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  // ── Student ──────────────────────────────────────────────────
  async findStudentById(id) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true, organizationId: true } },
      },
    });
  }

  async updateStudent(id, data) {
    return prisma.student.update({ where: { id }, data });
  }

  // ── Parent ───────────────────────────────────────────────────
  async findParentById(id) {
    return prisma.parent.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            schoolId: true,
            school: { select: { id: true, name: true, organizationId: true } },
          },
        },
      },
    });
  }

  async updateParent(id, data) {
    return prisma.parent.update({ where: { id }, data });
  }

  // ── Refresh token revocation (active sessions) ───────────────
  async revokeTokensByOrganization(organizationId) {
    return prisma.refreshToken.updateMany({
      where: { user: { organizationId } },
      data: { isRevoked: true },
    });
  }

  async revokeTokensBySchool(schoolId) {
    return prisma.refreshToken.updateMany({
      where: { user: { schoolId } },
      data: { isRevoked: true },
    });
  }

  async revokeTokensByUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // ── Auth-cache invalidation lookups ──────────────────────────
  async findUserIdsBySchool(schoolId) {
    return prisma.user.findMany({ where: { schoolId }, select: { id: true } });
  }

  async findUserIdsByOrganization(organizationId) {
    return prisma.user.findMany({ where: { organizationId }, select: { id: true } });
  }

  // ── Admin notification recipients (moderation emails) ──────────
  // Block/unblock par sirf org/branch ke ADMIN ko mail jata hai —
  // SUPER_ADMIN (platform credential holder) ko nahi.
  async findAdminEmailsByOrganization(organizationId) {
    const users = await prisma.user.findMany({
      where: { organizationId, role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true },
    });
    return users.filter((u) => u.email);
  }

  async findAdminEmailsBySchool(schoolId) {
    const users = await prisma.user.findMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true },
    });
    return users.filter((u) => u.email);
  }
}

export default new ModerationRepository();
