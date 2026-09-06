import xlsx from "xlsx";
import prisma from "../../config/db.js";
import ApiError from "../../lib/utils/ApiError.js";
import { verifyAttendanceToken } from "../../lib/utils/attendanceToken.js";
import { emitToRoom } from "../../config/websocket.js";
import redis from "../../config/redis.js";
import notificationService from "../../services/notification.service.js";
import portalNotificationService from "../notification/notification.portalService.js";

class StaffAttendanceService {
  /**
   * Admin: Mark staff attendance (single or bulk)
   */
  async markAttendance(schoolId, { staffId, date, status, remarks, checkIn }) {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, schoolId, isActive: true, role: { notIn: ["SUPER_ADMIN"] } },
    });
    if (!staff) throw ApiError.notFoundError("Staff member not found in this branch");

    const day = new Date(date || new Date());
    day.setHours(0, 0, 0, 0);

    const record = await prisma.staffAttendance.upsert({
      where: { staffId_date: { staffId, date: day } },
      update: {
        status: status || "PRESENT",
        remarks: remarks || null,
        checkIn: checkIn ? new Date(checkIn) : status !== "ABSENT" ? new Date() : null,
      },
      create: {
        staffId,
        schoolId,
        date: day,
        status: status || "PRESENT",
        remarks: remarks || null,
        checkIn: status !== "ABSENT" ? new Date(checkIn || Date.now()) : null,
      },
    });

    // Invalidate daily cache
    try {
      const dateKey = day.toISOString().split("T")[0];
      await redis.del(`staff-attendance:daily:${schoolId}:${dateKey}`);
    } catch (_) {}

    emitToRoom(`school:${schoolId}`, "staff_attendance_marked", {
      staffId,
      staffName: staff.name,
      status: record.status,
      date: day,
    });

    // Portal notification — branch feed me staff absence dikhe.
    if (record.status === "ABSENT") {
      portalNotificationService.create({
        schoolId,
        senderName: "Staff Attendance",
        title: "STAFF_ATTENDANCE",
        body: `${staff.name} was marked ABSENT on ${day.toLocaleDateString("en-PK")}.`,
        category: "STAFF",
        refType: "STAFF_ATTENDANCE",
        refId: staff.id,
        link: "/staff-attendance",
      }).catch(() => {});

      // Absent ho jane par STAFF ko khud email — uski branch ke SMTP
      // credentials se (schoolId scoping se tenant transport pehle try hota hai,
      // platform sirf fallback). Email na ho to silently skip.
      if (staff.email) {
        notificationService
          ._sendEmail({
            schoolId,
            to: staff.email,
            title: "Attendance Alert — Absent",
            message: `Dear ${staff.name}, you were marked ABSENT on ${day.toLocaleDateString("en-PK")}. If this is a mistake, please contact your branch office.`,
            details: [
              ["Staff", staff.name],
              ["Role", staff.role],
              ["Date", day.toLocaleDateString("en-PK")],
              ["Status", "Absent"],
            ],
          })
          .catch(() => {});
      }
    }

    return record;
  }

  /**
   * Gate scanner: staff ID-card QR se check-in.
   * Token HMAC-signed hai (forgery-proof); card pe printed staffId/org/school
   * verify hota hai. Already PRESENT ho to duplicate entry nahi — same record
   * wapis with alreadyCheckedIn flag (scanner ko pata chale card dobara scan
   * hua tha).
   */
  async scanCheckIn(user, token) {
    const data = verifyAttendanceToken(token);
    if (!data) throw ApiError.badRequestError("Invalid or tampered QR code");

    // Access: SUPER_ADMIN sab scan kar sakta hai; baqi sirf apne org/branch.
    if (user.role !== "SUPER_ADMIN") {
      if (
        (data.organizationId && user.organizationId && data.organizationId !== user.organizationId) ||
        (data.schoolId && user.schoolId && data.schoolId !== user.schoolId)
      ) {
        throw ApiError.forbiddenError("This ID card belongs to another branch/organization");
      }
    }

    const staff = await prisma.user.findFirst({
      where: {
        id: data.staffId,
        isActive: true,
        role: { notIn: ["SUPER_ADMIN"] },
      },
    });
    if (!staff) throw ApiError.notFoundError("Staff member not found or inactive");
    if (!staff.schoolId) throw ApiError.badRequestError("Staff has no branch assigned");

    // Duplicate-scan guard: aaj already PRESENT?
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const existing = await prisma.staffAttendance.findUnique({
      where: { staffId_date: { staffId: staff.id, date: day } },
    });
    if (existing && existing.status === "PRESENT") {
      return { alreadyCheckedIn: true, record: existing, staffName: staff.name };
    }

    const record = await this.markAttendance(staff.schoolId, {
      staffId: staff.id,
      status: "PRESENT",
    });
    return { alreadyCheckedIn: false, record, staffName: staff.name };
  }

  /**
   * Admin: Bulk mark attendance for all staff
   */
  async bulkMark(schoolId, { date, records }) {
    // records = [{ staffId, status, remarks?, checkIn? }]
    const day = new Date(date || new Date());
    day.setHours(0, 0, 0, 0);

    const results = await Promise.allSettled(
      records.map((r) =>
        this.markAttendance(schoolId, {
          staffId: r.staffId,
          date: day,
          status: r.status,
          remarks: r.remarks,
          checkIn: r.checkIn,
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");

    // Errors logged silently — caller gets failed count.

    return { succeeded, failed: failed.length, total: records.length };
  }

  /**
   * Admin: Delete a single staff attendance record
   */
  async deleteAttendance(schoolId, recordId) {
    const record = await prisma.staffAttendance.findFirst({
      where: { id: recordId, schoolId },
    });
    if (!record) throw ApiError.notFoundError("Attendance record not found");

    await prisma.staffAttendance.delete({ where: { id: recordId } });

    try {
      const dateKey = record.date.toISOString().split("T")[0];
      await redis.del(`staff-attendance:daily:${schoolId}:${dateKey}`);
    } catch (_) {}

    return { deleted: true, id: recordId };
  }

  async updateAttendance(schoolId, recordId, { status, remarks, checkIn }) {
    const record = await prisma.staffAttendance.findFirst({
      where: { id: recordId, schoolId },
    });
    if (!record) throw ApiError.notFoundError("Attendance record not found");

    const updated = await prisma.staffAttendance.update({
      where: { id: recordId },
      data: {
        ...(status && { status }),
        ...(remarks !== undefined && { remarks }),
        ...(checkIn && { checkIn: new Date(checkIn) }),
      },
    });

    try {
      const dateKey = record.date.toISOString().split("T")[0];
      await redis.del(`staff-attendance:daily:${schoolId}:${dateKey}`);
    } catch (_) {}

    emitToRoom(`school:${schoolId}`, "staff_attendance_marked", {
      staffId: record.staffId,
      status: updated.status,
      date: updated.date,
      action: "update",
    });

    return updated;
  }

  /**
   * Admin: Export staff attendance as Excel buffer
   */
  async exportAttendance(schoolId, { startDate, endDate, format, staffId }) {
    const where = { schoolId };
    if (staffId) where.staffId = staffId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.staffAttendance.findMany({
      where,
      include: { staff: { select: { id: true, name: true, role: true, email: true } } },
      orderBy: [{ date: "asc" }, { staff: { name: "asc" } }],
    });

    const rows = records.map((r) => ({
      Name: r.staff?.name || "",
      Email: r.staff?.email || "",
      Role: r.staff?.role || "",
      Date: r.date.toISOString().split("T")[0],
      Status: r.status,
      "Check In": r.checkIn ? new Date(r.checkIn).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "",
      Remarks: r.remarks || "",
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Staff Attendance");
    const bookType = format === "csv" ? "csv" : "xlsx";
    return xlsx.write(wb, { type: "buffer", bookType });
  }

  /**
   * Admin: Import staff attendance from Excel buffer
   * Expected columns: Staff Name or Email (to match), Date, Status, Remarks (optional)
   */
  async importAttendance(schoolId, fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet);

    if (!rawRows.length) throw ApiError.badRequestError("Excel file has no data rows");

    // Build lookup: name/email → staff
    const allStaff = await prisma.user.findMany({
      where: { schoolId, isActive: true, role: { notIn: ["SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true },
    });
    const byEmail = {};
    const byName = {};
    allStaff.forEach((s) => {
      if (s.email) byEmail[s.email.toLowerCase()] = s;
      byName[s.name.toLowerCase()] = s;
    });

    const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE", "HALF_DAY"];
    let succeeded = 0;
    let failed = 0;
    const errors = [];
    const upserts = [];

    for (const row of rawRows) {
      try {
        const email = (row["Email"] || row["email"] || "").toString().trim().toLowerCase();
        const name = (row["Staff Name"] || row["Name"] || row["name"] || "").toString().trim().toLowerCase();
        const staff = (email && byEmail[email]) || (name && byName[name]);
        if (!staff) { failed++; errors.push(`Staff not found: ${email || name}`); continue; }

        const dateStr = (row["Date"] || row["date"] || "").toString().trim();
        if (!dateStr) { failed++; errors.push(`Missing date for ${staff.name}`); continue; }
        const day = new Date(dateStr);
        day.setHours(0, 0, 0, 0);

        let status = (row["Status"] || row["status"] || "PRESENT").toString().trim().toUpperCase();
        if (!VALID_STATUSES.includes(status)) status = "PRESENT";
        const remarks = (row["Remarks"] || row["remarks"] || "").toString().trim() || null;

        upserts.push(prisma.staffAttendance.upsert({
          where: { staffId_date: { staffId: staff.id, date: day } },
          update: { status, remarks },
          create: { staffId: staff.id, schoolId, date: day, status, remarks },
        }).then(() => succeeded++).catch((err) => { failed++; errors.push(err.message); }));
      } catch (err) { failed++; errors.push(err.message); }
    }

    await Promise.all(upserts);
    return { succeeded, failed, total: rawRows.length, errors: errors.slice(0, 20) };
  }
}

export default new StaffAttendanceService();
