import teachingAssignmentRepository from "./repository.js";
import ApiError from "../../lib/utils/ApiError.js";
import { getEffectiveSchoolId, assertOwnSchool, assertSchoolAccess, assertSchoolExists } from "../../lib/scope.js";
import { emitToRoom } from "../../config/websocket.js";

class TeachingAssignmentService {
  /**
   * Assign a teacher to a class/section/subject.
   * - subjectId null + sectionId null → class teacher (whole class, all subjects)
   * - subjectId null + sectionId set  → class teacher of one section
   * - subjectId set  + sectionId null → subject teacher for the whole class
   * - subjectId set  + sectionId set  → subject teacher of one section
   */
  async assign(user, schoolId, data) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertOwnSchool(user, targetSchoolId);

    await assertSchoolExists(targetSchoolId);

    const teacher = await teachingAssignmentRepository.teacherExists(targetSchoolId, data.teacherId);
    if (!teacher) throw ApiError.notFoundError("Teacher not found in this school");

    const klass = await teachingAssignmentRepository.classExists(targetSchoolId, data.classId);
    if (!klass) throw ApiError.notFoundError("Class not found in this school");

    if (data.sectionId) {
      const section = await teachingAssignmentRepository.sectionExists(data.classId, data.sectionId);
      if (!section) throw ApiError.badRequestError("Section does not belong to this class");
    }
    if (data.subjectId) {
      const subject = await teachingAssignmentRepository.subjectExists(data.classId, data.subjectId);
      if (!subject) throw ApiError.badRequestError("Subject does not belong to this class");
    }

    const assignment = await teachingAssignmentRepository.upsertAssignment({
      teacherId: data.teacherId,
      classId: data.classId,
      subjectId: data.subjectId || null,
      sectionId: data.sectionId || null,
    });

    emitToRoom(`school:${targetSchoolId}`, "assignment_updated", { id: assignment.id });
    return assignment;
  }

  async list(user, schoolId, query) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    return teachingAssignmentRepository.listBySchool(targetSchoolId, {
      teacherId: query.teacherId,
      classId: query.classId,
    });
  }

  /** Teacher apni apni assignments dekh sakta hai (apne sections/subjects). */
  async listMe(user, schoolId) {
    const targetSchoolId = getEffectiveSchoolId(user, schoolId);
    assertSchoolAccess(user, targetSchoolId);
    return teachingAssignmentRepository.listBySchool(targetSchoolId, { teacherId: user.id });
  }

  async remove(user, id) {
    const assignment = await teachingAssignmentRepository.findById(id);
    if (!assignment) throw ApiError.notFoundError("Assignment not found");
    assertOwnSchool(user, assignment.class.schoolId);
    await teachingAssignmentRepository.deleteAssignment(id);
    return true;
  }
}

export default new TeachingAssignmentService();