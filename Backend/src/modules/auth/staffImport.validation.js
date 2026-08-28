import { z } from "zod";

const staffRoleValues = [
  "ADMIN",
  "TEACHER",
  "RECEPTIONIST",
];

export const bulkStaffImportRowSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(staffRoleValues, {
    errorMap: () => ({
      message: `Role must be one of: ${staffRoleValues.join(", ")}`,
    }),
  }),
  schoolId: z.string().uuid("Invalid school ID").optional(),
});
