import { Router } from "express";
import studyMaterialController from "./studyMaterial.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { ROLE_GROUPS } from "../../constants.js";
import { fileUpload } from "../../lib/upload.js";
import {
  listStudyMaterialSchema,
  getStudyMaterialSchema,
} from "./studyMaterial.validation.js";

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/study-material
 * Create study material — single multipart request (file + metadata).
 * File is optional (URL-only materials are allowed).
 */
router.post(
  "/",
  authorize(ROLE_GROUPS.ACADEMIC),
  fileUpload.single("file"),
  studyMaterialController.create
);

router.get("/", authorize(ROLE_GROUPS.ALL_STAFF), validate(listStudyMaterialSchema), studyMaterialController.list);
router.get("/:id", authorize(ROLE_GROUPS.ALL_STAFF), validate(getStudyMaterialSchema), studyMaterialController.getOne);

/**
 * PUT /api/v1/study-material/:id
 * Update — optional file replacement.
 */
router.put(
  "/:id",
  authorize(ROLE_GROUPS.ACADEMIC),
  fileUpload.single("file"),
  studyMaterialController.update
);

router.delete("/:id", authorize(ROLE_GROUPS.ACADEMIC), validate(getStudyMaterialSchema), studyMaterialController.delete);

export default router;
