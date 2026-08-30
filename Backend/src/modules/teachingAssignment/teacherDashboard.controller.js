import ApiResponse from "../../lib/utils/ApiResponse.js";
import prisma from "../../config/db.js";

class TeacherDashboardController {
  /**
   * GET /teaching-assignments/schools/:schoolId/dashboard-stats
   * Returns aggregated stats for the teacher portal dashboard.
   */
  getStats = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const schoolId = req.params.schoolId;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const [assignments, ptmCount, homeworkCount, timetableCount] =
        await Promise.all([
          prisma.teachingAssignment.count({
            where: { teacherId: userId, class: { schoolId } },
          }),
          prisma.pTMSession.count({
            where: {
              schoolId,
              teacherIds: { has: userId },
              scheduledAt: { gte: now },
              status: "SCHEDULED",
            },
          }),
          prisma.homeworkBroadcast.count({
            where: {
              section: { class: { schoolId } },
              createdById: userId,
            },
          }),
          prisma.timetableSlot.count({
            where: {
              teacherId: userId,
              section: { class: { schoolId } },
            },
          }),
        ]);

      res.json(
        ApiResponse.ok("Teacher dashboard stats", {
          assignments,
          upcomingPtms: ptmCount,
          totalHomework: homeworkCount,
          totalTimetableSlots: timetableCount,
        })
      );
    } catch (e) {
      next(e);
    }
  };
}

export default new TeacherDashboardController();
