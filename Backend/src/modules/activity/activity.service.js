import activityRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "../../lib/utils/cache.js";

class ActivityService {
  async createActivity(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const activity = await activityRepository.createActivity({
      schoolId: targetSchoolId,
      title: data.title,
      description: data.description || null,
      eventDate: new Date(data.eventDate),
    });
    await cacheInvalidatePrefix("activity:list:");
    return activity;
  }

  async listActivities(user, schoolId, { fromDate, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    const key = `activity:list:${targetSchoolId}:${fromDate || ""}:${p}:${ps}`;
    const cached = await cacheGet(key);
    if (cached) return cached;

    const result = await activityRepository.listActivitiesBySchool(targetSchoolId, { fromDate, page: p, pageSize: ps });
    await cacheSet(key, result, 60);
    return result;
  }

  async getActivity(user, id) {
    const activity = await activityRepository.findActivityById(id);
    if (!activity) throw ApiError.notFoundError("Activity not found");
    assertSchoolAccess(user, activity.schoolId);
    return activity;
  }

  async updateActivity(user, id, data) {
    const activity = await this.getActivity(user, id);
    assertOwnSchool(user, activity.schoolId);

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eventDate) updateData.eventDate = new Date(data.eventDate);

    const updated = await activityRepository.updateActivity(id, updateData);
    await cacheInvalidatePrefix("activity:list:");
    return updated;
  }

  async deleteActivity(user, id) {
    const activity = await this.getActivity(user, id);
    assertOwnSchool(user, activity.schoolId);
    await activityRepository.deleteActivity(id);
    await cacheInvalidatePrefix("activity:list:");
    return true;
  }
}

export default new ActivityService();
