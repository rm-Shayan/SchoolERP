import timetableService from "./timetable.service.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";
import ApiResponse from "../../lib/utils/ApiResponse.js";
import { sendCsv } from "../../lib/utils/csv.js";
import { streamPdf, buildTimetablePdf } from "../../lib/pdf/reportPdf.js";

class TimetableController {
  /**
   * POST /api/v1/timetable/sections/:sectionId
   * Add a period/slot to a section timetable.
   */
  createSlot = asyncHandler(async (req, res) => {
    const slot = await timetableService.createSlot(req.user, req.params.sectionId, req.body);
    return res.status(201).json(ApiResponse.created("Timetable slot created", slot));
  });

  /**
   * GET /api/v1/timetable/sections/:sectionId
   */
  listSlotsBySection = asyncHandler(async (req, res) => {
    const slots = await timetableService.listSlotsBySection(req.user, req.params.sectionId);
    return res.status(200).json(ApiResponse.ok("Section timetable fetched", slots));
  });

  /**
   * GET /api/v1/timetable/slots/:id
   */
  getSlot = asyncHandler(async (req, res) => {
    const slot = await timetableService.getSlot(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Timetable slot fetched", slot));
  });

  /**
   * PATCH /api/v1/timetable/slots/:id
   */
  updateSlot = asyncHandler(async (req, res) => {
    const slot = await timetableService.updateSlot(req.user, req.params.id, req.body);
    return res.status(200).json(ApiResponse.ok("Timetable slot updated", slot));
  });

  /**
   * DELETE /api/v1/timetable/slots/:id
   */
  deleteSlot = asyncHandler(async (req, res) => {
    await timetableService.deleteSlot(req.user, req.params.id);
    return res.status(200).json(ApiResponse.ok("Timetable slot deleted"));
  });

  /**
   * PATCH /api/v1/timetable/sections/:sectionId/reorder
   */
  reorderSlots = asyncHandler(async (req, res) => {
    const result = await timetableService.reorderSlots(req.user, req.params.sectionId, req.body);
    return res.status(200).json(ApiResponse.ok('Slots reordered', result));
  });

  /**
   * GET /api/v1/timetable/teachers/:teacherId
   */
  listSlotsByTeacher = asyncHandler(async (req, res) => {
    const slots = await timetableService.listSlotsByTeacher(req.user, req.params.teacherId, req.query);
    return res.status(200).json(ApiResponse.ok("Teacher timetable fetched", slots));
  });

  /**
   * DELETE /api/v1/timetable/sections/:sectionId/slots
   * Bulk delete slots for a section. Optional ?dayOfWeek=N to clear a specific day.
   */
  clearTimetable = asyncHandler(async (req, res) => {
    const dayOfWeek = req.query.dayOfWeek ? Number(req.query.dayOfWeek) : undefined;
    const result = await timetableService.clearTimetable(req.user, req.params.sectionId, dayOfWeek);
    const label = dayOfWeek !== undefined ? `day ${dayOfWeek}` : 'all days';
    return res.status(200).json(ApiResponse.ok(`${result.deletedCount} slot(s) cleared for ${label}`, result));
  });

  /**
   * POST /api/v1/timetable/sections/:sectionId/import
   * Bulk import timetable from Excel — queued, async progress via WebSocket.
   */
  importTimetable = asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("No file uploaded");
    const result = await timetableService.importTimetable(req.user, req.params.sectionId, req.file.buffer);
    return res.status(202).json(ApiResponse.ok("Timetable import job queued", result));
  });

  /**
   * GET /api/v1/timetable/sections/:sectionId/export
   * CSV export — section timetable in import-compatible format.
   */
  exportTimetable = asyncHandler(async (req, res) => {
    const { csv } = await timetableService.exportTimetable(req.user, req.params.sectionId);
    return sendCsv(res, csv, "timetable");
  });

  /**
   * GET /api/v1/timetable/sections/:sectionId/pdf
   * PDF download — weekly grid for a section.
   */
  downloadSectionPdf = asyncHandler(async (req, res) => {
    const slots = await timetableService.listSlotsBySection(req.user, req.params.sectionId);
    const sec = slots[0]?.section;
    const title = sec && (sec.name || sec.class?.name)
      ? `${sec.class?.name || ""} ${sec.name || ""}`.trim()
      : "Section Timetable";
    streamPdf(res, "timetable.pdf", (doc) =>
      buildTimetablePdf(doc, title, new Date().toLocaleDateString("en-PK"), slots)
    );
  });

  /**
   * GET /api/v1/timetable/teachers/:teacherId/pdf
   * PDF download — a teacher's weekly schedule.
   */
  downloadTeacherPdf = asyncHandler(async (req, res) => {
    const slots = await timetableService.listSlotsByTeacher(req.user, req.params.teacherId, req.query);
    streamPdf(res, "my-timetable.pdf", (doc) =>
      buildTimetablePdf(doc, "My Timetable", new Date().toLocaleDateString("en-PK"), slots)
    );
  });
}

export default new TimetableController();
