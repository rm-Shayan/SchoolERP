import conductService from "./conduct.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class ConductController {
  /**
   * POST /api/v1/conduct/remarks
   * 10-second remark → email parent.
   */
  createRemark = asyncHandler(async (req, res) => {
    const remark = await conductService.createRemark(req.user, req.body);
    return res.status(201).json(ApiResponse.created("Remark recorded", remark));
  });

  /**
   * GET /api/v1/conduct/remarks/school
   * All remarks for the school (admin view).
   */
  listAllBySchool = asyncHandler(async (req, res) => {
    const result = await conductService.listAllBySchool(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("School remarks fetched", result));
  });

  /**
   * GET /api/v1/conduct/remarks/students/:studentId
   * Remark history for a student.
   */
  listByStudent = asyncHandler(async (req, res) => {
    const result = await conductService.listByStudent(req.user, req.params.studentId, req.query);
    return res.status(200).json(ApiResponse.ok("Remarks fetched", result));
  });

  /**
   * GET /api/v1/conduct/remarks/sections/:sectionId
   * Remarks for all students in a section.
   */
  listBySection = asyncHandler(async (req, res) => {
    const result = await conductService.listBySection(req.user, req.params.sectionId, req.query);
    return res.status(200).json(ApiResponse.ok("Section remarks fetched", result));
  });

  /**
   * GET /api/v1/conduct/remarks/mine
   * Teacher's own remarks history.
   */
  listByTeacher = asyncHandler(async (req, res) => {
    const result = await conductService.listByTeacher(req.user, req.query);
    return res.status(200).json(ApiResponse.ok("Your remarks fetched", result));
  });

  /**
   * GET /api/v1/conduct/remarks/:id
   */
  getRemark = asyncHandler(async (req, res) => {
    const remark = await conductService.getRemark(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Remark fetched", remark));
  });

  /**
   * PATCH /api/v1/conduct/remarks/:id
   */
  updateRemark = asyncHandler(async (req, res) => {
    const remark = await conductService.updateRemark(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Remark updated", remark));
  });

  /**
   * DELETE /api/v1/conduct/remarks/:id
   */
  deleteRemark = asyncHandler(async (req, res) => {
    await conductService.deleteRemark(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Remark deleted"));
  });
}

export default new ConductController();
