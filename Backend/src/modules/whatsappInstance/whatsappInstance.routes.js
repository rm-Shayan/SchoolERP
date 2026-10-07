import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import controller from "./whatsappInstance.controller.js";

const router = Router();

// Branch WhatsApp (Evolution API) connection management.
// SUPER_ADMIN: kisi bhi org/branch ke liye; ADMIN: sirf apni org ke branches.
router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN"));

// GET  /api/v1/whatsapp/status?organizationId=&schoolId=
router.get("/status", controller.getStatus);

// GET  /api/v1/whatsapp/instances?organizationId=   (org view list)
router.get("/instances", controller.listByOrg);

// POST /api/v1/whatsapp/connect   { organizationId?, schoolId? }
router.post("/connect", controller.connect);

// POST /api/v1/whatsapp/refresh-qr   { organizationId?, schoolId? }
router.post("/refresh-qr", controller.refreshQr);

// POST /api/v1/whatsapp/sync   { organizationId?, schoolId? }
router.post("/sync", controller.sync);

// PATCH /api/v1/whatsapp/enabled   { organizationId?, schoolId?, isEnabled }
router.patch("/enabled", controller.setEnabled);

// DELETE /api/v1/whatsapp?organizationId=&schoolId=
router.delete("/", controller.remove);

export default router;
