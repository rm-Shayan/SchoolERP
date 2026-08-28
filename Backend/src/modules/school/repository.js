import prisma from "../../config/db.js";

class SchoolRepository {
  async organizationExists(organizationId) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    });
  }

  async userEmailExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return Boolean(user);
  }

  async create(data) {
    return prisma.school.create({ data });
  }

  async findById(id) {
    return prisma.school.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        // Dedicated branch admins (Principal) — `users` is renamed to `admins` in the service
        users: {
          where: { role: "ADMIN" },
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { students: true, classes: true, users: true } },
      },
    });
  }

  /**
   * Soft-disable every dedicated ADMIN user on a branch (used when the
   * branch admin is re-assigned — the old principal loses access).
   */
  async deactivateBranchAdmins(schoolId) {
    return prisma.user.updateMany({
      where: { schoolId, role: "ADMIN", isActive: true },
      data: { isActive: false },
    });
  }

  async findByCode(code) {
    return prisma.school.findUnique({ where: { code } });
  }

  /**
   * Count the branches (Schools) belonging to an organization.
   * Used by the image sync rule: a single-branch org keeps its org image in
   * sync with the branch; multi-branch orgs leave the org image untouched.
   */
  async countByOrganization(organizationId) {
    return prisma.school.count({ where: { organizationId } });
  }

  async findByCodeWithOrg(code) {
    return prisma.school.findUnique({
      where: { code },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
    });
  }

  async findByOrgSlug(slug) {
    return prisma.school.findFirst({
      where: { organization: { slug } },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true, themeColor: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(id, data) {
    return prisma.school.update({ where: { id }, data });
  }

  async listByOrganization(organizationId) {
    return prisma.school.findMany({
      where: { organizationId },
      include: { _count: { select: { students: true, classes: true, users: true } } },
      orderBy: { name: "asc" },
    });
  }

  async listAll() {
    return prisma.school.findMany({
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: { select: { students: true, classes: true, users: true } },
      },
      orderBy: { name: "asc" },
    });
  }
}

export default new SchoolRepository();
