// ==========================================
// DATA TRANSFER OBJECTS — Auth Module
// ==========================================

/**
 * Staff User response DTO.
 * Strips sensitive fields (password, etc.) before sending to client.
 */
export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username || null;
    this.email = user.email;
    this.phone = user.phone || null;
    this.avatarUrl = user.avatarUrl || null;
    this.role = user.role;
    this.isActive = user.isActive;
    this.schoolId = user.schoolId || null;
    this.organizationId = user.organizationId || null;
    this.createdAt = user.createdAt;

    // Extra branches this same account can open (home branch = schoolId).
    this.branchAccess = Array.isArray(user.branchAccess) ? user.branchAccess : [];

    // Block info (populated by moderation actions) — powers the profile
    // view + blocked-reason filter on the Super Admin users page.
    this.blockedReason = user.blockedReason || null;
    this.blockedAt = user.blockedAt || null;
    this.blockedByName = user.blockedByName || null;

    // Include branch/org info if available (status powers the realtime
    // portal status pill — spec §5 badges on the branch admin side).
    if (user.school) {
      this.school = {
        id: user.school.id,
        name: user.school.name,
        code: user.school.code,
        status: user.school.status || "ACTIVE",
        logoUrl: user.school.logoUrl || null,
        themeColor: user.school.themeColor || null,
        // Attendance timing rules — needed by Branch Profile settings + gate
        // rules panel so the UI can render the saved times back correctly.
        attendanceStartTime: user.school.attendanceStartTime || "07:45",
        attendanceCutoffTime: user.school.attendanceCutoffTime || "08:30",
        attendanceAbsentTime: user.school.attendanceAbsentTime || "10:00",
        attendanceAlertTime: user.school.attendanceAlertTime || "09:30",
      };
    }

    if (user.organization) {
      this.organization = {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
        slug: user.organization.slug,
        status: user.organization.status || "SETUP_PENDING",
        themeColor: user.organization.themeColor || null,
        logoUrl: user.organization.logoUrl || null,
      };
    }

    // Accessible branches — session-scoped. `user._accessible` is set by the
    // service (multi-branch) else the branch nested on the session user.
    this.schools = (user._accessible ?? (user.school ? [user.school] : [])).map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      status: s.status || "ACTIVE",
    }));
  }

  static toDTO(user) {
    if (!user) return null;
    return new UserResponseDTO(user);
  }
}

/**
 * Parent Portal response DTO.
 * Shows parent info and their linked children.
 */
export class ParentPortalDTO {
  constructor(parent) {
    this.id = parent.id;
    this.name = parent.name;
    this.whatsappNo = parent.whatsappNo;
    this.phone = parent.phone || null;
    this.email = parent.email || null;
    this.imageUrl = parent.imageUrl || null;
    this.createdAt = parent.createdAt;

    // Include linked children (read-only portal view)
    if (parent.students && parent.students.length > 0) {
      this.children = parent.students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber,
        imageUrl: s.imageUrl || null,
        gender: s.gender || null,
        status: s.status || "ACTIVE",
        isActive: s.status === "ACTIVE",
        school: s.school
          ? { id: s.school.id, name: s.school.name, slug: s.school.organization?.slug || null, themeColor: s.school.organization?.themeColor || null, logoUrl: s.school.organization?.logoUrl || null }
          : null,
        class: s.section?.class
          ? { id: s.section.class.id, name: s.section.class.name }
          : null,
        section: s.section
          ? { id: s.section.id, name: s.section.name }
          : null,
      }));
    } else {
      this.children = [];
    }
  }

  static toDTO(parent) {
    if (!parent) return null;
    return new ParentPortalDTO(parent);
  }
}

/**
 * Student Portal response DTO.
 * Read-only view for the student themselves.
 */
export class StudentPortalDTO {
  constructor(student) {
    this.id = student.id;
    this.firstName = student.firstName;
    this.lastName = student.lastName;
    this.rollNumber = student.rollNumber;
    this.imageUrl = student.imageUrl || null;
    this.status = student.status || "ACTIVE";
    this.isActive = student.status === "ACTIVE";
    this.school = student.school
      ? { id: student.school.id, name: student.school.name, slug: student.school.organization?.slug || null, themeColor: student.school.organization?.themeColor || null, logoUrl: student.school.organization?.logoUrl || null }
      : null;
    this.class = student.section?.class
      ? { id: student.section.class.id, name: student.section.class.name }
      : null;
    this.section = student.section
      ? { id: student.section.id, name: student.section.name }
      : null;
    // Show parent contact (masked for privacy)
    this.parentWhatsapp = student.parent?.whatsappNo
      ? `****${student.parent.whatsappNo.slice(-4)}`
      : null;
  }

  static toDTO(student) {
    if (!student) return null;
    return new StudentPortalDTO(student);
  }
}
