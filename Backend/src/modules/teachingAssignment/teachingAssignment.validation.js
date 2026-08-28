import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

export const assignTeacherSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    teacherId: z.string().uuid("Invalid teacherId"),
    classId: z.string().uuid("Invalid classId"),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    subjectId: z.string().uuid("Invalid subjectId").optional(),
  }),
});

export const listAssignmentsSchema = z.object({
  params: schoolIdParam.params,
  query: z.object({
    teacherId: z.string().uuid("Invalid teacherId").optional(),
    classId: z.string().uuid("Invalid classId").optional(),
  }),
});

export const getAssignmentSchema = z.object(idParam);