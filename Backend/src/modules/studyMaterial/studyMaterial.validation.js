import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

export const createStudyMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(["DOCUMENT", "VIDEO", "IMAGE", "LINK"]).default("DOCUMENT"),
    fileUrl: z.string().url("Invalid file URL").optional(),
    linkUrl: z.string().url("Invalid link URL").optional(),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    subjectId: z.string().uuid("Invalid subjectId").optional(),
  }),
});

export const listStudyMaterialSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    subjectId: z.string().uuid("Invalid subjectId").optional(),
    type: z.enum(["DOCUMENT", "VIDEO", "IMAGE", "LINK"]).optional(),
    createdById: z.string().uuid("Invalid createdById").optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getStudyMaterialSchema = z.object(idParam);

export const updateStudyMaterialSchema = z.object({
  params: idParam.params,
  body: z
    .object({
      title: z.string().min(1, "Title cannot be empty").max(200).optional(),
      description: z.string().max(2000).optional(),
      type: z.enum(["DOCUMENT", "VIDEO", "IMAGE", "LINK"]).optional(),
      fileUrl: z.string().url("Invalid file URL").optional(),
      linkUrl: z.string().url("Invalid link URL").optional(),
      sectionId: z.string().uuid("Invalid sectionId").optional(),
      subjectId: z.string().uuid("Invalid subjectId").optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required to update",
    }),
});
