import portalService from "./portal.service.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { getCachedPortal, setCachedPortal, bustPortalCache } from "../../lib/portalCache.js";
import { streamPdf, buildExamDateSheetPdf, buildTimetablePdf } from "../../lib/pdf/reportPdf.js";

class PortalController {
  getOverview = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "overview");
      if (cached) return res.json(ApiResponse.ok("Portal overview", cached));
      const data = await portalService.getOverview(req.portal);
      await setCachedPortal(pk, "overview", data);
      res.json(ApiResponse.ok("Portal overview", data));
    } catch (e) { next(e); }
  };

  getAttendance = async (req, res, next) => {
    try {
      const { month, year } = req.query;
      const pk = `${req.portal.type}:${req.portal.id}`;
      const ck = `att:${month || ""}:${year || ""}`;
      const cached = await getCachedPortal(pk, "attendance", ck);
      if (cached) return res.json(ApiResponse.ok("Attendance data", cached));
      const data = await portalService.getAttendance(req.portal, { month, year });
      await setCachedPortal(pk, "attendance", data, ck);
      res.json(ApiResponse.ok("Attendance data", data));
    } catch (e) { next(e); }
  };

  getFees = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "fees");
      if (cached) return res.json(ApiResponse.ok("Fee data", cached));
      const data = await portalService.getFees(req.portal);
      await setCachedPortal(pk, "fees", data);
      res.json(ApiResponse.ok("Fee data", data));
    } catch (e) { next(e); }
  };

  getHomework = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "hw");
      if (cached) return res.json(ApiResponse.ok("Homework data", cached));
      const data = await portalService.getHomework(req.portal);
      await setCachedPortal(pk, "hw", data);
      res.json(ApiResponse.ok("Homework data", data));
    } catch (e) { next(e); }
  };

  getCirculars = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "circulars");
      if (cached) return res.json(ApiResponse.ok("Circulars", cached));
      const data = await portalService.getCirculars(req.portal);
      await setCachedPortal(pk, "circulars", data);
      res.json(ApiResponse.ok("Circulars", data));
    } catch (e) { next(e); }
  };

  getResults = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "results");
      if (cached) return res.json(ApiResponse.ok("Exam results", cached));
      const data = await portalService.getResults(req.portal);
      await setCachedPortal(pk, "results", data);
      res.json(ApiResponse.ok("Exam results", data));
    } catch (e) { next(e); }
  };

  getTimetable = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "timetable");
      if (cached) return res.json(ApiResponse.ok("Timetable", cached));
      const data = await portalService.getTimetable(req.portal);
      await setCachedPortal(pk, "timetable", data);
      res.json(ApiResponse.ok("Timetable", data));
    } catch (e) { next(e); }
  };

  getConduct = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "conduct");
      if (cached) return res.json(ApiResponse.ok("Conduct remarks", cached));
      const data = await portalService.getConduct(req.portal);
      await setCachedPortal(pk, "conduct", data);
      res.json(ApiResponse.ok("Conduct remarks", data));
    } catch (e) { next(e); }
  };

  getPTM = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "ptm");
      if (cached) return res.json(ApiResponse.ok("PTM sessions", cached));
      const data = await portalService.getPTM(req.portal);
      await setCachedPortal(pk, "ptm", data);
      res.json(ApiResponse.ok("PTM sessions", data));
    } catch (e) { next(e); }
  };

  getLeaveRequests = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "leave");
      if (cached) return res.json(ApiResponse.ok("Leave requests", cached));
      const data = await portalService.getLeaveRequests(req.portal);
      await setCachedPortal(pk, "leave", data);
      res.json(ApiResponse.ok("Leave requests", data));
    } catch (e) { next(e); }
  };

  createLeaveRequest = async (req, res, next) => {
    try {
      const data = await portalService.createLeaveRequest(req.portal, req.body);
      bustPortalCache(`${req.portal.type}:${req.portal.id}`);
      res.status(201).json(ApiResponse.created("Leave request submitted", data));
    } catch (e) { next(e); }
  };

  getExams = async (req, res, next) => {
    try {
      const pk = `${req.portal.type}:${req.portal.id}`;
      const cached = await getCachedPortal(pk, "exams");
      if (cached) return res.json(ApiResponse.ok("Exam date sheets", cached));
      const data = await portalService.getExams(req.portal);
      await setCachedPortal(pk, "exams", data);
      res.json(ApiResponse.ok("Exam date sheets", data));
    } catch (e) { next(e); }
  };

  downloadExamDateSheet = async (req, res, next) => {
    try {
      const exam = await portalService.getExamDateSheet(req.portal, req.params.examId);
      const safe = (exam.name || "exam").replace(/[^\w-]+/g, "-").toLowerCase();
      streamPdf(res, `${safe}-date-sheet.pdf`, (doc) =>
        buildExamDateSheetPdf(doc, exam, exam.school?.name || "School", exam.papers)
      );
    } catch (e) { next(e); }
  };

  downloadTimetable = async (req, res, next) => {
    try {
      const slots = await portalService.getTimetablePdfSlots(req.portal);
      streamPdf(res, "timetable.pdf", (doc) =>
        buildTimetablePdf(doc, "My Timetable", new Date().toLocaleDateString("en-PK"), slots)
      );
    } catch (e) { next(e); }
  };

  updateProfile = async (req, res, next) => {
    try {
      const data = await portalService.updateProfile(req.portal, req.body);
      bustPortalCache(`${req.portal.type}:${req.portal.id}`);
      res.json(ApiResponse.ok("Profile updated", data));
    } catch (e) { next(e); }
  };

  uploadAvatar = async (req, res, next) => {
    try {
      const data = await portalService.uploadAvatar(req.portal, req.file?.buffer);
      res.json(ApiResponse.ok("Profile picture updated", data));
    } catch (e) { next(e); }
  }
}

export default new PortalController();