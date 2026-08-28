import { z } from "zod";

const ACTIONS = [
  "LOGIN", "LOGOUT", "PARENT_LOGIN", "STUDENT_LOGIN",
  "CREATE_ORG", "UPDATE_ORG", "DELETE_ORG",
  "CREATE_SCHOOL", "UPDATE_SCHOOL", "DELETE_SCHOOL", "ASSIGN_SCHOOL_ADMIN",
  "CREATE_STAFF", "UPDATE_STAFF", "DEACTIVATE_STAFF", "REACTIVATE_STAFF", "RESET_STAFF_PASSWORD",
  "BLOCK_ORG", "UNBLOCK_ORG", "BLOCK_SCHOOL", "UNBLOCK_SCHOOL",
  "BLOCK_USER", "UNBLOCK_USER", "BLOCK_STUDENT", "UNBLOCK_STUDENT",
  "BLOCK_PARENT", "UNBLOCK_PARENT",
];

const ENTITY_TYPES = ["ORGANIZATION", "SCHOOL", "USER", "STUDENT", "PARENT", "AUTH"];

export const listAuditLogsSchema = z.object({
  query: z.object({
    action: z.enum(ACTIONS).optional(),
    entityType: z.enum(ENTITY_TYPES).optional(),
    search: z.string().max(200).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});
