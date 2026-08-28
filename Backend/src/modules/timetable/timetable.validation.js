import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const sectionIdParam = {
  params: z.object({ sectionId: z.string().uuid("Invalid sectionId") }),
};

export const createSlotSchema = z.object({
  params: sectionIdParam.params,
  body: z.object({
    subjectId: z.string().uuid("Invalid subjectId"),
    teacherId: z.string().uuid("Invalid teacherId"),
    dayOfWeek: z.coerce.number().int().min(1).max(7, "dayOfWeek 1=Monday .. 7=Sunday"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM"),
  }),
});

export const listSlotsBySectionSchema = z.object(sectionIdParam);

export const getSlotSchema = z.object(idParam);

export const updateSlotSchema = z.object({
  params: idParam.params,
  body: z.object({
    subjectId: z.string().uuid("Invalid subjectId").optional(),
    teacherId: z.string().uuid("Invalid teacherId").optional(),
    dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM").optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM").optional(),
  }),
});

export const listSlotsByTeacherSchema = z.object({
  params: z.object({ teacherId: z.string().uuid("Invalid teacherId") }),
  query: z.object({
    dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
  }),
});
