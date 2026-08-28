import { Router } from "express";
import staffLeaveController from "./staffLeave.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/request",
  authorize("ADMIN", "TEACHER", "RECEPTIONIST", "SUPER_ADMIN"),
  staffLeaveController.requestLeave
);

router.get(
  "/my",
  authorize("ADMIN", "TEACHER", "RECEPTIONIST", "SUPER_ADMIN"),
  staffLeaveController.getMyLeaves
);

router.get(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffLeaveController.listAll
);

router.post(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffLeaveController.create
);

router.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffLeaveController.remove
);

router.patch(
  "/:id/review",
  authorize("ADMIN", "SUPER_ADMIN"),
  staffLeaveController.review
);

export default router;
