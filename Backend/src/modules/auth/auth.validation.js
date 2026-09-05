import { z } from "zod";
import { ROLES } from "../../constants.js";

// ==========================================
// STAFF AUTH — Validation Schemas
// ==========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    username: z.string().optional(),
    phone: z.string().optional(),
    schoolCode: z.string().optional(), // Allowed for Branch Staff (Admin/Teacher/Receptionist/etc.)
    password: z.string().min(1, "Password is required"),
  }).refine((data) => data.email || data.username || data.phone || data.schoolCode, {
    message: "Provide either Email or School Code + Username/Phone to login",
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
    // Session branch to keep after rotation (multi-branch switch persistence).
    schoolId: z.string().uuid("Invalid branch id").optional(),
  }),
});

export const switchBranchSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid("Invalid branch id").min(1, "Branch id is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Valid email is required"),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const updateOwnProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url("Invalid image URL").optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().min(6, "Current password must be at least 6 characters"),
      newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

// ==========================================
// USER MANAGEMENT — Validation Schemas
// ==========================================

const staffRoleValues = [
  ROLES.ADMIN,
  ROLES.TEACHER,
  ROLES.RECEPTIONIST,
];

const smtpSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().int().positive(),
  secure: z.boolean(),
  username: z.string().email("Invalid SMTP email"),
  password: z.string().min(1, "SMTP password is required"),
}).optional();

const cloudinarySchema = z.object({
  cloudName: z.string().min(1, "Cloud Name is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
}).optional();

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(5, "Password must be at least 5 characters")
      .optional(),
    phone: z.string().optional(),
    role: z.enum([...staffRoleValues, "STUDENT"], {
      errorMap: () => ({
        message: `Role must be one of: ${[...staffRoleValues, "STUDENT"].join(", ")}`,
      }),
    }),
    organizationId: z.string().uuid("Invalid organization ID").optional(),
    schoolId: z.string().uuid("Invalid school ID").optional(),
    // Teacher assignment (required when role=TEACHER)
    teacherClassId: z.string().uuid("Invalid class ID").optional(),
    teacherSectionId: z.string().uuid("Invalid section ID").optional(),
    teacherSubjectId: z.string().uuid("Invalid subject ID").optional(),
    // Integration settings for ADMIN role
    smtp: smtpSchema,
    cloudinary: cloudinarySchema,
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z
      .enum(staffRoleValues, {
        errorMap: () => ({
          message: `Role must be one of: ${staffRoleValues.join(", ")}`,
        }),
      })
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
});

export const deactivateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }).optional(),
});

export const adminResetPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

// ==========================================
// PORTAL (PARENT & STUDENT) — Validation Schemas
// ==========================================

export const parentRequestOtpSchema = z.object({
  body: z.object({
    whatsappNo: z
      .string()
      .min(10, "WhatsApp number must be at least 10 digits")
      .regex(
        /^(\+92|0092|92|0)?[0-9]{10}$/,
        "Enter a valid Pakistani mobile number (e.g. 03001234567)"
      ),
  }),
});

export const parentVerifyOtpSchema = z.object({
  body: z.object({
    whatsappNo: z
      .string()
      .min(10, "WhatsApp number is required"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  }),
});

// Direct Parent Portal Login (School Code + Phone + shared school password)
export const parentLoginSchema = z.object({
  body: z.object({
    schoolCode: z.string().min(1, "School Code is required (e.g. GULSHAN-01)"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(1, "School password is required"),
  }),
});

// Direct Student Portal Login (Roll Number + School Code / Password)
export const studentDirectLoginSchema = z.object({
  body: z.object({
    schoolCode: z.string().min(1, "School Code is required (e.g. GULSHAN-01)"),
    rollNumber: z.string().min(1, "Roll Number is required"),
    password: z.string().min(1, "School password is required"),
  }),
});

export const studentRequestOtpSchema = z.object({
  body: z.object({
    schoolCode: z.string().optional(),
    rollNumber: z.string().optional(),
    cardId: z.string().optional(),
  }),
});

export const studentVerifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Identifier (Roll Number or Card ID) is required"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d{6}$/, "OTP must contain only numbers"),
  }),
});

