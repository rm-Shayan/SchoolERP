import { z } from "zod";

const idParam = z.object({
  params: z.object({ id: z.string().uuid("Invalid id") }),
});

const blockBody = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const blockOrganizationSchema = z.intersection(idParam, blockBody);
export const unblockOrganizationSchema = idParam;
export const blockSchoolSchema = z.intersection(idParam, blockBody);
export const unblockSchoolSchema = idParam;
export const blockUserSchema = z.intersection(idParam, blockBody);
export const unblockUserSchema = idParam;
export const blockStudentSchema = z.intersection(idParam, blockBody);
export const unblockStudentSchema = idParam;
export const blockParentSchema = z.intersection(idParam, blockBody);
export const unblockParentSchema = idParam;
