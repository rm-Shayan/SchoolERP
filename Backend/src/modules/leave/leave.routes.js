import { Router } from "express";
import leaveController from "./leave.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Parent: apne bachay ke liye leave request
router.post(
  "/request",
  authenticate,
  authorize("ADMIN", "TEACHER", "PARENT", "SUPER_ADMIN"),
  leaveController.requestLeave
);

// Admin: saari leave requests (with filters)
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  leaveController.listAll
);

// Admin: create leave on behalf of a student
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  leaveController.create
);

// Admin: update a leave request
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  leaveController.update
);

// Admin: delete a leave request
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  leaveController.remove
);

// Admin: approve ya reject
router.patch(
  "/:id/review",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  leaveController.review
);

// Check if student has approved leave
router.get(
  "/check/:studentId",
  authenticate,
  leaveController.checkLeave
);

export default router;
