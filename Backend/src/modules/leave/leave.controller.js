import ApiResponse from "../../lib/utils/ApiResponse.js";
import leaveService from "./leave.service.js";
import leaveRequestService from "./leaveRequest.service.js";
import leaveCrudService from "./leaveCrud.service.js";

class LeaveController {
  requestLeave = async (req, res, next) => {
    try {
      const parentId = req.user?.parentId || req.user?.id;
      const result = await leaveRequestService.requestLeave(parentId, req.body);
      return res.status(201).json(ApiResponse.created("Leave request submitted", result));
    } catch (error) {
      return next(error);
    }
  };

  listAll = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId || req.params.schoolId;
      const { status, page, limit } = req.query;
      const result = await leaveService.listAll(schoolId, {
        status,
        page: Number(page) || 1,
        limit: Math.min(100, Number(limit) || 20),
      });
      return res.status(200).json(ApiResponse.ok("Leave requests fetched", result));
    } catch (error) {
      return next(error);
    }
  };

  review = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const { status, remarks } = req.body;
      const result = await leaveService.review(schoolId, req.params.id, { status, remarks }, req.user?.id);
      return res.status(200).json(ApiResponse.ok(`Leave request ${status.toLowerCase()}`, result));
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const result = await leaveCrudService.create(schoolId, req.body, req.user?.id);
      return res.status(201).json(ApiResponse.created("Student leave created", result));
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const result = await leaveCrudService.update(schoolId, req.params.id, req.body, req.user?.id);
      return res.status(200).json(ApiResponse.ok("Student leave updated", result));
    } catch (error) {
      return next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const schoolId = req.user?.schoolId;
      const result = await leaveCrudService.remove(schoolId, req.params.id);
      return res.status(200).json(ApiResponse.ok("Student leave deleted", result));
    } catch (error) {
      return next(error);
    }
  };

  checkLeave = async (req, res, next) => {
    try {
      const date = req.query.date ? new Date(req.query.date) : new Date();
      const hasLeave = await leaveService.hasApprovedLeave(req.params.studentId, date);
      return res.status(200).json(ApiResponse.ok("Leave status checked", { hasApprovedLeave: hasLeave }));
    } catch (error) {
      return next(error);
    }
  };
}

export default new LeaveController();
