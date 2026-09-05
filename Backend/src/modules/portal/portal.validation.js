import { z } from "zod";

/** Self-service profile update (portal) — parent: name/phone/email only. */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional(),
  }),
});
