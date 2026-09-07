import { z } from "zod";

const uuid = (label) => z.string().uuid(`Invalid ${label}`);

const promotionCommon = {
  academicYearId: uuid("academicYearId"),
  remarks: z.string().max(500, "remarks too long").optional(),
};

const studentItem = z.object({
  studentId: uuid("studentId"),
  rollNumber: z
    .string()
    .min(1, "rollNumber required")
    .max(30, "rollNumber too long"),
});

export const bulkPromoteSchema = z.object({
  body: z.object({
    ...promotionCommon,
    fromSectionId: uuid("fromSectionId"),
    toSectionId: uuid("toSectionId"),
    // Optional: restrict to a subset of students (default = all ACTIVE in source section)
    studentIds: z.array(uuid("studentId")).max(1000, "Too many students").optional(),
    // Optional: reassign roll numbers in the new class/section
    rollNumbers: z.array(studentItem).max(1000, "Too many roll numbers").optional(),
  }),
});

export const repeatStudentSchema = z.object({
  body: z.object({
    ...promotionCommon,
    studentId: uuid("studentId"),
    toSectionId: uuid("toSectionId").optional(),
  }),
});

export const transferSectionSchema = z.object({
  body: z.object({
    ...promotionCommon,
    studentId: uuid("studentId"),
    toSectionId: uuid("toSectionId"),
  }),
});

export const lifecycleSchema = z.object({
  body: z.object({
    ...promotionCommon,
    studentId: uuid("studentId"),
  }),
});

export const bulkLifecycleSchema = z.object({
  body: z.object({
    ...promotionCommon,
    sectionId: uuid("sectionId"),
    studentIds: z.array(uuid("studentId")).max(1000, "Too many students").optional(),
    remarks: z.string().max(500, "remarks too long").optional(),
  }),
});

export const listPromotionsSchema = z.object({
  query: z.object({
    schoolId: uuid("schoolId").optional(),
    studentId: uuid("studentId").optional(),
    sectionId: uuid("sectionId").optional(),
    academicYearId: uuid("academicYearId").optional(),
    action: z.enum(["PROMOTED", "REPEATED", "TRANSFERRED_SECTION", "GRADUATED", "DROPPED_OUT", "REACTIVATED"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getPromotionSchema = z.object({
  params: z.object({ id: uuid("id") }),
});
