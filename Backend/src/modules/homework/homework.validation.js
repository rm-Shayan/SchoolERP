import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

export const createHomeworkSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid("Invalid sectionId"),
    title: z.string().min(1, "Homework title required"),
    content: z.string().min(1, "Homework content required"),
    mediaUrl: z.string().optional(),
  }),
});

export const listHomeworkSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getHomeworkSchema = z.object(idParam);

export const updateHomeworkSchema = z.object({
  params: idParam.params,
  body: z
    .object({
      title: z.string().min(1, "Title cannot be empty").optional(),
      content: z.string().min(1, "Content cannot be empty").optional(),
      mediaUrl: z.string().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field (title/content/mediaUrl) is required to update",
    }),
});
