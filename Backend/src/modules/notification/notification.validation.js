import { z } from "zod";

export const getDeliveryStatusSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const listLogsSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    status: z.enum(["PENDING", "SENT", "DELIVERED", "FAILED"]).optional(),
    channel: z.enum(["SMS", "EMAIL", "PORTAL"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const listPortalSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    category: z.string().optional(),
    unreadOnly: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const markReadSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, "At least one ID required"),
  }),
});

export const removePortalSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, "At least one ID required"),
  }),
});

export const sendFromSuperAdminSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid().optional(),
    schoolId: z.string().uuid().optional(),
    recipientId: z.string().uuid().optional(),
    title: z.string().max(120),
    body: z.string().min(1, "Message body required"),
    category: z.string().optional(),
  }),
});
