import documentsService from './documents.service.js';
import ApiResponse from '../../lib/utils/ApiResponse.js';

const sendPdf = (res, buf, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buf);
};

const wrap = (fn, filename) => async (req, res, next) => {
  try {
    const buf = await fn(req);
    sendPdf(res, buf, filename);
  } catch (e) {
    next(e);
  }
};

export default {
  feeVoucher: wrap(
    (req) => documentsService.getFeeVoucher(
      req.user,
      req.params.id,
      req.query.size === 'a5' ? 'a5' : 'a4',
      req.query.merge === '1',
      req.query.recordIds ? String(req.query.recordIds).split(',').filter(Boolean) : null,
    ),
    'fee-voucher.pdf'
  ),
  admissionSlip: wrap(
    (req) => documentsService.getAdmissionSlip(req.user, req.params.id),
    'admission-slip.pdf'
  ),
  studentIdCard: wrap(
    (req) => documentsService.getStudentIdCard(req.user, req.params.id),
    'student-id-card.pdf'
  ),
  staffIdCard: wrap(
    (req) => documentsService.getStaffIdCard(req.user, req.params.id),
    'staff-id-card.pdf'
  ),
  staffQr: async (req, res, next) => {
    try {
      const dataUrl = await documentsService.getStaffQr(req.user, req.params.id);
      return res.status(200).json({ success: true, statusCode: 200, message: 'QR generated', data: { qr: dataUrl } });
    } catch (e) {
      next(e);
    }
  },
  issueTc: async (req, res, next) => {
    try {
      const { tc, tcNumber, studentId, status } = await documentsService.issueTc(req.user, req.params.id, req.body);
      sendPdf(res, tc, `TC-${tcNumber}.pdf`);
    } catch (e) {
      next(e);
    }
  },
};
