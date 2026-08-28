import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

export const PtmScopeEnum = z.enum(["WHOLE_SCHOOL", "CLASS_RANGE", "SECTIONS", "STUDENT"]);

/**
 * Audience rules:
 * - WHOLE_SCHOOL: no extra fields
 * - CLASS_RANGE: classFromId + classToId (school classes, resolved by `order`)
 * - SECTIONS: sectionIds[] (1+ — a single section or many)
 * - STUDENT: studentId
 */
export const scopeBodyShape = {
  title: z.string().min(1, "Session title required"),
  scheduledAt: z.string().min(1, "scheduledAt required"),
  description: z.string().optional(),
  location: z.string().optional(),
  scope: PtmScopeEnum.default("WHOLE_SCHOOL"),
  classFromId: z.string().uuid().optional(),
  classToId: z.string().uuid().optional(),
  sectionIds: z.array(z.string().uuid()).optional(),
  studentId: z.string().uuid().optional(),
  teacherIds: z.array(z.string().uuid()).optional(),
};

function requireFor(v, ctx) {
  if (v.scope === "CLASS_RANGE") {
    if (!v.classFromId || !v.classToId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["classFromId"], message: "classFromId and classToId are required for CLASS_RANGE" });
    }
  }
  if (v.scope === "SECTIONS" && (!v.sectionIds || v.sectionIds.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sectionIds"], message: "Pick at least one section for SECTIONS" });
  }
  if (v.scope === "STUDENT" && !v.studentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["studentId"], message: "studentId is required for STUDENT" });
  }
}

export const createPtmSchema = z.object({
  params: schoolIdParam.params,
  body: z.object(scopeBodyShape).superRefine(requireFor),
});

export const listPtmSchema = z.object({
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId").optional() }).optional(),
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const updatePtmSchema = z.object({
  params: idParam.params,
  body: z
    .object({
      ...scopeBodyShape,
      title: z.string().min(1).optional(),
      scheduledAt: z.string().optional(),
      description: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
      scope: PtmScopeEnum.optional(),
    })
    .superRefine(requireFor),
});

export const getPtmSchema = z.object(idParam);
