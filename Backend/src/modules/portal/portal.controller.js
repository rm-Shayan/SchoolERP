import portalService from "./portal.service.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";

class PortalController {
  getOverview = async (req, res, next) => {
    try {
      const data = await portalService.getOverview(req.portal);
      res.json(ApiResponse.ok("Portal overview", data));
    } catch (e) { next(e); }
  };

  getAttendance = async (req, res, next) => {
    try {
      const { month, year } = req.query;
      const data = await portalService.getAttendance(req.portal, { month, year });
      res.json(ApiResponse.ok("Attendance data", data));
    } catch (e) { next(e); }
  };

  getFees = async (req, res, next) => {
    try {
      const data = await portalService.getFees(req.portal);
      res.json(ApiResponse.ok("Fee data", data));
    } catch (e) { next(e); }
  };

  getHomework = async (req, res, next) => {
    try {
      const data = await portalService.getHomework(req.portal);
      res.json(ApiResponse.ok("Homework data", data));
    } catch (e) { next(e); }
  };

  getCirculars = async (req, res, next) => {
    try {
      const data = await portalService.getCirculars(req.portal);
      res.json(ApiResponse.ok("Circulars", data));
    } catch (e) { next(e); }
  };

  getResults = async (req, res, next) => {
    try {
      const data = await portalService.getResults(req.portal);
      res.json(ApiResponse.ok("Exam results", data));
    } catch (e) { next(e); }
  };

  getTimetable = async (req, res, next) => {
    try {
      const data = await portalService.getTimetable(req.portal);
      res.json(ApiResponse.ok("Timetable", data));
    } catch (e) { next(e); }
  };

  getConduct = async (req, res, next) => {
    try {
      const data = await portalService.getConduct(req.portal);
      res.json(ApiResponse.ok("Conduct remarks", data));
    } catch (e) { next(e); }
  };

  getPTM = async (req, res, next) => {
    try {
      const data = await portalService.getPTM(req.portal);
      res.json(ApiResponse.ok("PTM sessions", data));
    } catch (e) { next(e); }
  };

  getLeaveRequests = async (req, res, next) => {
    try {
      const data = await portalService.getLeaveRequests(req.portal);
      res.json(ApiResponse.ok("Leave requests", data));
    } catch (e) { next(e); }
  };

  createLeaveRequest = async (req, res, next) => {
    try {
      const data = await portalService.createLeaveRequest(req.portal, req.body);
      res.status(201).json(ApiResponse.created("Leave request submitted", data));
    } catch (e) { next(e); }
  };
}

export default new PortalController();
