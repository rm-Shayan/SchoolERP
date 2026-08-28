import ApiError from "./utils/ApiError.js";
import prisma from "../config/db.js";

/**
 * Multi-branch scope helpers.
 *
 * - SUPER_ADMIN (platform) works across branches → must pass an explicit
 *   `schoolId` for branch-scoped operations.
 * - Branch staff (ADMIN/TEACHER/...) are locked to their own schoolId.
 */
const isOrgWide = (user) => user.role === "SUPER_ADMIN";

export const getEffectiveSchoolId = (user, requestedSchoolId) => {
  if (isOrgWide(user)) {
    if (!requestedSchoolId) {
      throw ApiError.badRequestError(
        "schoolId is required for this operation (this role works across branches)."
      );
    }
    return requestedSchoolId;
  }
  if (!user.schoolId) {
    throw ApiError.forbiddenError("Your account is not associated with any school branch.");
  }
  return user.schoolId;
};

/**
 * Assert that a resource belonging to `resourceSchoolId` is within the
 * requester's allowed scope. Branch staff cannot touch other branches.
 */
export const assertSchoolAccess = (user, resourceSchoolId) => {
  if (isOrgWide(user)) return true;
  if (user.schoolId !== resourceSchoolId) {
    throw ApiError.forbiddenError(
      "You can only access data within your own school branch."
    );
  }
  return true;
};

/**
 * Assert that the current user belongs to the given school (for writes).
 */
export const assertOwnSchool = (user, schoolId) => {
  if (isOrgWide(user)) return true;
  if (user.schoolId !== schoolId) {
    throw ApiError.forbiddenError(
      "You can only manage data within your own school branch."
    );
  }
  return true;
};

/**
 * Assert the target school branch exists; return it ({id, name}) or 404.
 * Har module ka apna schoolExists copy yahan shift kiya gaya hai.
 */
export const assertSchoolExists = async (schoolId) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true },
  });
  if (!school) throw ApiError.notFoundError("School not found");
  return school;
};
