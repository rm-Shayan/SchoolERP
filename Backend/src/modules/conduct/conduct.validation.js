import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

export const createRemarkSchema = z.object({
  body: z.object({
    studentId: z.string().uuid("Invalid studentId"),
    type: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).default("NEUTRAL"),
    comment: z.string().min(1, "Comment required (keep it short)").max(500),
    // ADMIN/SUPER_ADMIN kisi teacher ke naam par remark daal sakte hain
    teacherId: z.string().uuid("Invalid teacherId").optional(),
  }),
});

export const listRemarksByStudentSchema = z.object({
  params: idParam.params,
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const listRemarksBySectionSchema = z.object({
  params: z.object({ sectionId: z.string().uuid("Invalid sectionId") }),
  query: z.object({
    type: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getRemarkSchema = z.object(idParam);

export const updateRemarkSchema = z.object({
  params: idParam.params,
  body: z.object({
    type: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
    comment: z.string().min(1, "Comment required").max(500).optional(),
  }),
});

export const deleteRemarkSchema = z.object(idParam);

export const listRemarksBySchoolSchema = z.object({
  query: z.object({
    type: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
    teacherId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});
