import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

export const createActivitySchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    title: z.string().min(1, "Activity title required"),
    description: z.string().optional(),
    eventDate: z.string().min(1, "eventDate required"),
  }),
});

export const listActivitiesSchema = z.object({
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId").optional() }).optional(),
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    fromDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getActivitySchema = z.object(idParam);

export const updateActivitySchema = z.object({
  params: idParam.params,
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    eventDate: z.string().optional(),
  }),
});
