import ApiResponse from "../../lib/utils/ApiResponse.js";
import staffLeaveService from "./staffLeave.service.js";
import staffLeaveSelfService from "./staffLeaveSelf.service.js";

class StaffLeaveController {
  requestLeave = async (req, res, next) => {
    try {
      const staffId = req.user?.id;
      const result = await staffLeaveSelfService.requestLeave(staffId, req.body);
      return res.status(201).json(ApiResponse.created("Leave request submitted", result));
    } catch (error) {
      return next(error);
    }
  };

  listAll = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId || req.params.schoolId;
      const { status, staffId, page, limit } = req.query;
      const result = await staffLeaveService.listAll(schoolId, {
        status,
        staffId,
        page: Number(page) || 1,
        limit: Math.min(100, Number(limit) || 20),
      });
      return res.status(200).json(ApiResponse.ok("Staff leave requests fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  review = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const { status, remarks } = req.body;
      const result = await staffLeaveService.review(schoolId, req.params.id, { status, remarks }, req.user?.id);
      return res.status(200).json(ApiResponse.ok(`Leave request ${status.toLowerCase()}`, result));
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const result = await staffLeaveService.create(schoolId, req.body, req.user?.id);
      return res.status(201).json(ApiResponse.created("Staff leave created", result));
    } catch (error) {
      return next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const result = await staffLeaveService.remove(schoolId, req.params.id);
      return res.status(200).json(ApiResponse.ok("Staff leave deleted", result));
    } catch (error) {
      return next(error);
    }
  };

  getMyLeaves = async (req, res, next) => {
    try {
      const staffId = req.user?.id;
      const { status, page, limit } = req.query;
      const result = await staffLeaveSelfService.getMyLeaves(staffId, {
        status,
        page: Number(page) || 1,
        limit: Math.min(100, Number(limit) || 20),
      });
      return res.status(200).json(ApiResponse.ok("My leave requests fetched", result));
    } catch (error) {
      return next(error);
    }
  };
}

export default new StaffLeaveController();
