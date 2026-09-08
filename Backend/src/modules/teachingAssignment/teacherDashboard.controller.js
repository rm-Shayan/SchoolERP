import ApiResponse from "../../lib/utils/ApiResponse.js";
import prisma from "../../config/db.js";
import redis from "../../config/redis.js";

function redisGet(key) {
  try { return redis.get(key).then(JSON.parse).catch(() => null); } catch { return null; }
}
function redisSetEx(key, ttl, value) {
  try { return redis.setEx(key, ttl, JSON.stringify(value)).catch(() => {}); } catch { /* fail silently */ }
}

class TeacherDashboardController {
  /**
   * GET /teaching-assignments/schools/:schoolId/dashboard-stats
   * Returns aggregated stats for the teacher portal dashboard.
   */
  getStats = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const schoolId = req.params.schoolId;

      // Cache dashboard stats for 60s — stats don't change during a session
      const cacheKey = `dash:teacher:${userId}:${schoolId}`;
      const cached = await redisGet(cacheKey);
      if (cached) return res.json(ApiResponse.ok("Teacher dashboard stats", cached));

      const now = new Date();

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

      const stats = {
        assignments,
        upcomingPtms: ptmCount,
        totalHomework: homeworkCount,
        totalTimetableSlots: timetableCount,
      };

      redisSetEx(cacheKey, 60, stats);
      res.json(ApiResponse.ok("Teacher dashboard stats", stats));
    } catch (e) {
      next(e);
    }
  };
}

export default new TeacherDashboardController();
