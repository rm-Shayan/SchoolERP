import activityRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";

class ActivityService {
  async createActivity(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    return activityRepository.createActivity({
      schoolId: targetSchoolId,
      title: data.title,
      description: data.description || null,
      eventDate: new Date(data.eventDate),
    });
  }

  async listActivities(user, schoolId, { fromDate, page = 1, pageSize = 50 }) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    return activityRepository.listActivitiesBySchool(targetSchoolId, {
      fromDate,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50)),
    });
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

    return activityRepository.updateActivity(id, updateData);
  }

  async deleteActivity(user, id) {
    const activity = await this.getActivity(user, id);
    assertOwnSchool(user, activity.schoolId);
    await activityRepository.deleteActivity(id);
    return true;
  }
}

export default new ActivityService();
