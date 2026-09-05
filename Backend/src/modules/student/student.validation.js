import { z } from "zod";

const idParam = z.object({
  id: z.string().uuid("Invalid student id"),
});

export const createStudentSchema = z.object({
  params: z.object({
    schoolId: z.string().uuid("Invalid schoolId"),
  }),
  body: z.object({
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    rollNumber: z.string().min(1, "Roll number is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    dob: z.string().optional(),
    parentName: z.string().min(1, "Parent name is required"),
    parentWhatsappNo: z.string().min(10, "Parent WhatsApp number is required"),
    parentPhone: z.string().optional(),
    parentEmail: z.string().email("Invalid parent email").optional(),
    parentAddress: z.string().optional(),
  }),
});

export const listStudentsSchema = z.object({
  params: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
    })
    .optional(),
  query: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
      sectionId: z.string().uuid("Invalid sectionId").optional(),
      classId: z.string().uuid("Invalid classId").optional(),
      status: z.enum(["ACTIVE", "GRADUATED", "DROPPED_OUT", "TRANSFERRED_OUT"]).optional(),
      search: z.string().optional(),
      page: z.string().optional(),
      pageSize: z.string().optional(),
    })
    .optional(),
});

export const getStudentSchema = z.object({ params: idParam });

export const updateStudentSchema = z.object({
  params: idParam,
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    gender: z.enum(["MALE", "FEMALE"]).nullable().optional(),
    dob: z.string().nullable().optional(),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    rollNumber: z.string().min(1).optional(),
    parentName: z.string().min(1).optional(),
    parentPhone: z.string().nullable().optional(),
    parentEmail: z.string().email("Invalid parent email").nullable().optional(),
    parentAddress: z.string().nullable().optional(),
  }),
});

export const changeStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.enum(["ACTIVE", "GRADUATED", "DROPPED_OUT", "TRANSFERRED_OUT"]),
    remarks: z.string().optional(),
  }),
});

export const reissueIdSchema = z.object({ params: idParam });
