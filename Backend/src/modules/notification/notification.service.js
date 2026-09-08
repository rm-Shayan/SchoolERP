import notificationRepository from "./repository.js";
import redis from "../../config/redis.js";
import { getEffectiveSchoolId, assertSchoolAccess } from "../../lib/scope.js";

function redisGet(key) {
  try { return redis.get(key).then(JSON.parse).catch(() => null); } catch { return null; }
}
function redisSetEx(key, ttl, value) {
  try { return redis.setEx(key, ttl, JSON.stringify(value)).catch(() => {}); } catch { /* fail silently */ }
}

class NotificationModuleService {
  /**
   * Resolve the target scope for a request.
   * SUPER_ADMIN without explicit schoolId → ALL-BRANCHES delivery-health feed
   * (aggregate stats + failed notifications). Specific school manga ho to us
   * branch ke poore logs milte hain. Branch staff locked to their own school.
   */
  _resolveScope(user, requestedSchoolId) {
    if (user.role === "SUPER_ADMIN") {
      if (requestedSchoolId) {
        assertSchoolAccess(user, requestedSchoolId);
        return { schoolId: requestedSchoolId };
      }
      return { allBranches: true };
    }
    const sid = getEffectiveSchoolId(user, requestedSchoolId);
    assertSchoolAccess(user, sid);
    return { schoolId: sid };
  }

  // Backward-compatible helper (delivery status ab bhi platform-wide stats)
  _resolveSchoolId(user, requestedSchoolId) {
    if (user.role === "SUPER_ADMIN") {
      return requestedSchoolId || null;
    }
    return getEffectiveSchoolId(user, requestedSchoolId);
  }

  /**
   * PRD §8 — Message/notification delivery status (sent/failed counts).
   */
  async getDeliveryStatus(user, { schoolId, fromDate, toDate }) {
    const targetSchoolId = this._resolveSchoolId(user, schoolId);
    if (targetSchoolId) assertSchoolAccess(user, targetSchoolId);
    return notificationRepository.getDeliveryStatus(targetSchoolId, { fromDate, toDate });
  }

  async listLogs(user, { schoolId, status, channel, page = 1, pageSize = 50 }) {
    const scope = this._resolveScope(user, schoolId);
    const cacheKey = `notif:log:${scope.schoolId || "platform"}:${scope.allBranches ? "all" : ""}:${status || "_"}:${channel || "_"}:${page}:${pageSize}`;
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const result = await notificationRepository.listLogs(scope.schoolId, {
      allBranches: Boolean(scope.allBranches),
      status,
      channel,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
    redisSetEx(cacheKey, 30, result);
    return result;
  }
}

export default new NotificationModuleService();
