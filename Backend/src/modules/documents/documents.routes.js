import { Router } from 'express';
import documentsController from './documents.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLE_GROUPS } from '../../constants.js';

const router = Router();
router.use(authenticate);

// All document endpoints require at least staff-level access; the service layer
// enforces per-resource school scoping via assertSchoolAccess.
router.get('/fee-voucher/:id', authorize(ROLE_GROUPS.ALL_STAFF), documentsController.feeVoucher);
router.get('/admission-slip/:id', authorize(ROLE_GROUPS.ALL_STAFF), documentsController.admissionSlip);
router.get('/student-id-card/:id', authorize(ROLE_GROUPS.ALL_STAFF), documentsController.studentIdCard);
router.get('/staff-id-card/:id', authorize(ROLE_GROUPS.ALL_STAFF), documentsController.staffIdCard);
router.get('/staff/:id/qr', authorize(ROLE_GROUPS.ALL_STAFF), documentsController.staffQr);

// Transfer Certificate — issues TC, changes student status, deactivates portal
router.post('/tc/:id', authorize(ROLE_GROUPS.MANAGEMENT), documentsController.issueTc);

export default router;
