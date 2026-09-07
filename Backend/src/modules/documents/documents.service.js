import prisma from '../../config/db.js';
import QRCode from 'qrcode';
import pdfService from '../../services/pdf.service.js';
import ApiError from '../../lib/utils/ApiError.js';
import { assertSchoolAccess } from '../../lib/scope.js';
import { signAttendanceToken } from '../../lib/utils/attendanceToken.js';
import storageService from '../../services/storage.service.js';
import { emitToRoom } from '../../config/websocket.js';

const monthYear = (d) => (d ? new Date(d).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '—');
const endOfYear = () => new Date(new Date().getFullYear(), 11, 31);

class DocumentsService {
  // FEE VOUCHER (A4 or A5) — fee record + student + school
  async getFeeVoucher(user, feeRecordId, size = 'a4', merge = false, recordIds = null) {
    const fr = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId },
      include: {
        student: {
          include: { section: { include: { class: true } }, parent: true, school: { include: { organization: true } } },
        },
      },
    });
    if (!fr) throw ApiError.notFoundError('Fee record not found');
    const s = fr.student;
    assertSchoolAccess(user, s.school.id);

    // Custom voucher: user ne specific months (recordIds) pick kiye hain.
    // Warna merge=true par saare open months, nahi toh sirf ye record.
    let records;
    if (Array.isArray(recordIds) && recordIds.length) {
      records = await prisma.feeRecord.findMany({ where: { id: { in: recordIds }, studentId: s.id }, orderBy: { dueDate: 'asc' } });
    } else if (merge) {
      records = await prisma.feeRecord.findMany({ where: { studentId: s.id, status: { not: 'PAID' } }, orderBy: { dueDate: 'asc' } });
    } else {
      records = [fr];
    }
    const total = records.reduce((sum, r) => sum + Number(r.totalAmount) + Number(r.dueCharges || 0), 0);
    const paid = records.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);
    const due = Math.max(0, total - paid);
    const params = {
      schoolName: s.school.name,
      studentName: `${s.firstName} ${s.lastName}`,
      className: s.section?.class?.name || 'N/A',
      rollNumber: s.rollNumber,
      monthLabel: records.length > 1 ? `${monthYear(records[0].dueDate)} - ${monthYear(records.at(-1).dueDate)}` : monthYear(fr.dueDate),
      lineItems: records.map((r) => ({ title: `${monthYear(r.dueDate)} Fee${Number(r.dueCharges || 0) ? ' + Due Charges' : ''}`, amount: Number(r.totalAmount) + Number(r.dueCharges || 0) })),
      totalAmount: total,
      paidAmount: paid,
      totalDue: due,
      dueDate: fr.dueDate,
      issuedDate: new Date(),
      refNo: fr.id.slice(0, 8).toUpperCase(),
      themeColor: s.school.themeColor || s.school.organization?.themeColor,
      // Prefer a branch-specific mark, then fall back to the organization mark.
      // This keeps vouchers branded even when a branch has no separate logo.
      logoUrl: s.school.logoUrl || s.school.organization?.logoUrl,
      qrData: `FEE:${fr.id}`,
      status: fr.status,
      bank: {
        bankName: s.school.bankName || s.school.organization?.bankName,
        accountTitle: s.school.bankAccountTitle || s.school.organization?.bankAccountTitle,
        accountNumber: s.school.bankAccountNumber || s.school.organization?.bankAccountNumber,
      },
    };
    return size === 'a5' ? pdfService.feeVoucherA5(params) : pdfService.feeVoucher(params);
  }

  // ADMISSION SLIP — applicant + class + school
  async getAdmissionSlip(user, applicantId) {
    const a = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { class: true, school: { include: { organization: true } } },
    });
    if (!a) throw ApiError.notFoundError('Applicant not found');
    assertSchoolAccess(user, a.school.id);
    return pdfService.admissionSlip({
      schoolName: a.school.name,
      applicant: {
        firstName: a.firstName || '',
        lastName: a.lastName || '',
        className: a.class?.name || 'Not assigned',
        parentName: a.parentName || a.fatherName || a.guardianName || 'Not provided',
        parentWhatsappNo: a.parentWhatsappNo || a.parentPhone || a.phone || '',
        status: a.status || 'APPROVED',
      },
      refNo: a.id.slice(0, 8).toUpperCase(),
      amount: a.advanceFeeAmount ? Number(a.advanceFeeAmount) : 0,
      dueDate: a.testDate || a.createdAt,
      themeColor: a.school.themeColor,
      logoUrl: a.school.logoUrl,
      schoolAddress: a.school.address,
      schoolPhone: a.school.phone,
    });
  }

  // STUDENT ID CARD — single card on A4 sheet
  async getStudentIdCard(user, studentId) {
    const st = await prisma.student.findUnique({
      where: { id: studentId },
      include: { section: { include: { class: true } }, parent: true, school: { include: { organization: true } } },
    });
    if (!st) throw ApiError.notFoundError('Student not found');
    assertSchoolAccess(user, st.school.id);
    const card = {
      studentName: `${st.firstName} ${st.lastName}`,
      fatherName: st.parent?.name || 'Not provided',
      className: st.section?.class?.name || 'Not assigned',
      sectionName: st.section?.name || 'Not assigned',
      rollNumber: st.rollNumber || 'Not assigned',
      identifierCode: st.identifierCode || st.id,
      refNo: st.identifierCode || st.id,
      validUntil: endOfYear(),
      gender: st.gender,
      contactPhone: st.parent?.whatsappNo || st.parent?.phone || 'Not provided',
      emergencyPhone: st.parent?.phone || 'Not provided',
      photoUrl: st.imageUrl,
    };
    return pdfService.studentIdSlip({
      ...card,
      schoolName: st.school.name,
      campusName: '',
      themeColor: st.school.themeColor,
      logoUrl: st.school.logoUrl,
      schoolAddress: st.school.address,
      schoolPhone: st.school.phone,
    });
  }

  // STAFF ID CARD — QR encodes a signed check-in token (gate scanner)
  async getStaffIdCard(user, staffId) {
    const u = await prisma.user.findUnique({
      where: { id: staffId },
      include: { school: true },
    });
    if (!u) throw ApiError.notFoundError('Staff not found');
    if (u.schoolId) assertSchoolAccess(user, u.schoolId);
    const qr = await QRCode.toBuffer(
      signAttendanceToken({ staffId: u.id, organizationId: u.organizationId, schoolId: u.schoolId }),
      { margin: 1, scale: 6, color: { dark: '#000000', light: '#ffffff' } }
    );
    const card = {
      name: u.name || u.username || 'Staff Member',
      designation: u.role || 'Staff',
      employeeId: u.username || u.id,
      department: u.school?.name || 'Administration',
      phone: u.phone || 'Not provided',
      validTill: endOfYear(),
      refNo: u.username || u.id,
      photoUrl: u.avatarUrl,
      qr,
    };
    return pdfService.staffIdCard({
      cards: [card],
      schoolName: u.school?.name || 'School',
      campusName: '',
      themeColor: u.school?.themeColor,
      logoUrl: u.school?.logoUrl,
    });
  }

  // STAFF ID CARD QR (data URL) — same signed token as the printed card,
  // so the on-screen preview is scannable by the gate scanner.
  async getStaffQr(user, staffId) {
    const u = await prisma.user.findUnique({ where: { id: staffId } });
    if (!u) throw ApiError.notFoundError('Staff not found');
    if (u.schoolId) assertSchoolAccess(user, u.schoolId);
    const buf = await QRCode.toBuffer(
      signAttendanceToken({ staffId: u.id, organizationId: u.organizationId, schoolId: u.schoolId }),
      { margin: 1, scale: 6, color: { dark: '#000000', light: '#ffffff' } }
    );
    return `data:image/png;base64,${buf.toString('base64')}`;
  }

  // TRANSFER CERTIFICATE (TC) — generates TC PDF, changes student status,
  // deactivates student/parent portal, creates PromotionRecord.
  async issueTc(user, studentId, { reason, remarks }) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        section: { include: { class: true } },
        parent: true,
        school: { include: { organization: true } },
      },
    });
    if (!student) throw ApiError.notFoundError('Student not found');
    assertSchoolAccess(user, student.school.id);
    if (student.status !== 'ACTIVE') throw ApiError.badRequestError(`Student is already ${student.status}`);

    // Status map
    const statusMap = {
      GRADUATED: 'GRADUATED',
      DROPPED_OUT: 'DROPPED_OUT',
      TRANSFERRED_OUT: 'TRANSFERRED_OUT',
    };
    const newStatus = statusMap[reason];
    if (!newStatus) throw ApiError.badRequestError('Invalid reason. Must be GRADUATED, DROPPED_OUT, or TRANSFERRED_OUT');

    // 1. Move photo to archive
    let imageUrl = student.imageUrl;
    if (student.imageUrl) {
      const moved = await storageService.moveToArchive({ url: student.imageUrl }).catch(() => null);
      if (moved?.url) imageUrl = moved.url;
    }

    // 2. Generate TC number
    const tcNumber = `TC-${Date.now().toString(36).toUpperCase()}`;

    // 3. Update student status + generate TC in transaction
    const tcDate = new Date();
    const [updatedStudent] = await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { status: newStatus, imageUrl },
      }),
      prisma.promotionRecord.create({
        data: {
          studentId: student.id,
          academicYearId: (await prisma.academicYear.findFirst({ where: { schoolId: student.schoolId, isCurrent: true } }))?.id || '',
          fromSectionId: student.sectionId,
          toSectionId: null,
          action: newStatus,
          remarks: `TC issued: ${tcNumber}. ${reason === 'TRANSFERRED_OUT' ? 'Transferred' : reason === 'GRADUATED' ? 'Graduated' : 'Dropped out'}. ${remarks || ''}`.trim(),
        },
      }),
    ]);

    // 4. Deactivate student portal (student + parent)
    // Student portal deactivation: set status already handles this (ACTIVE check in portal auth)
    // Parent portal: mark parent as inactive if no other active children
    if (student.parentId) {
      const otherActiveChildren = await prisma.student.count({
        where: { parentId: student.parentId, status: 'ACTIVE', id: { not: studentId } },
      });
      if (otherActiveChildren === 0) {
        await prisma.parent.update({ where: { id: student.parentId }, data: { isActive: false } }).catch(() => {});
      }
    }

    // 5. Emit socket event
    emitToRoom(`school:${student.schoolId}`, 'student_status_changed', {
      studentId: student.id,
      status: newStatus,
    });

    // 6. Generate TC PDF
    const tc = await pdfService.transferCertificate({
      schoolName: student.school.name,
      schoolAddress: student.school.address,
      schoolPhone: student.school.phone,
      studentName: `${student.firstName} ${student.lastName}`,
      fatherName: student.parent?.name || 'N/A',
      className: student.section?.class?.name || 'N/A',
      sectionName: student.section?.name || 'N/A',
      rollNumber: student.rollNumber,
      admissionDate: student.createdAt,
      leavingDate: tcDate,
      reason: newStatus,
      remarks,
      feeCleared: true,
      tcNumber,
      themeColor: student.school.themeColor || student.school.organization?.themeColor,
      logoUrl: student.school.logoUrl || student.school.organization?.logoUrl,
    });

    return { tc, tcNumber, studentId: student.id, status: newStatus };
  }
}

export default new DocumentsService();
