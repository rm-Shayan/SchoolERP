import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

export const createCircularSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    title: z.string().min(1, "Circular title required"),
    content: z.string().min(1, "Circular content required"),
    mediaUrl: z.string().optional(),
    audience: z.enum(["PARENTS", "TEACHERS", "ALL"]).optional(),
  }),
});

export const listCircularsSchema = z.object({
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId").optional() }).optional(),
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getCircularSchema = z.object(idParam);
