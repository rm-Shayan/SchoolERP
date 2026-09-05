import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid applicant id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

// Public admission form (/o/:slug/admission) — koi auth nahi

export const publicClassesSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId"),
  }),
});

export const publicInquirySchema = z.object({
  body: z.object({
    schoolId: z.string().uuid("Invalid schoolId"),
    classId: z.string().uuid("Invalid classId"),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().min(1, "Last name required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dob: z.string().optional(),
    parentName: z.string().min(1, "Parent name required"),
    parentPhone: z.string().optional(),
    parentWhatsappNo: z.string().min(1, "Parent WhatsApp number required"),
    parentEmail: z.string().email("Invalid parent email").optional(),
    parentAddress: z.string().optional(),
  }),
});

export const createInquirySchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    classId: z.string().uuid("Invalid classId"),
    firstName: z.string().min(1, "First name required"),
    lastName: z.string().min(1, "Last name required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dob: z.string().optional(),
    parentName: z.string().min(1, "Parent name required"),
    parentPhone: z.string().optional(),
    parentWhatsappNo: z.string().min(1, "Parent WhatsApp number required"),
    parentEmail: z.string().email("Invalid parent email").optional(),
    parentAddress: z.string().optional(),
  }),
});

export const updateApplicantSchema = z.object({
  params: idParam.params,
  body: z.object({
    status: z.string().min(1, "Status required"),
    testResult: z.enum(["PASSED", "FAILED"]).optional(),
    remarks: z.string().optional(),
    testDate: z.string().optional(),
    testTime: z.string().optional(),
    testVenue: z.string().optional(),
    testMarks: z.string().optional(),
  }),
});

// Edit applicant details (CRUD update) — same fields as create, all optional
export const updateApplicantDetailsSchema = z.object({
  params: idParam.params,
  body: z.object({
    classId: z.string().uuid("Invalid classId").optional(),
    firstName: z.string().min(1, "First name required").optional(),
    lastName: z.string().min(1, "Last name required").optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dob: z.string().optional(),
    parentName: z.string().min(1, "Parent name required").optional(),
    parentPhone: z.string().optional(),
    parentWhatsappNo: z.string().min(1, "Parent WhatsApp number required").optional(),
    parentEmail: z.string().email("Invalid parent email").optional(),
    parentAddress: z.string().optional(),
  }),
});

export const deleteApplicantSchema = z.object(idParam);

export const importApplicantsSchema = z.object({
  params: schoolIdParam.params,
});

export const uploadApplicantPhotoSchema = z.object(idParam);

export const uploadDocumentSchema = z.object({
  params: idParam.params,
  body: z.object({
    type: z.enum(["B_FORM", "BIRTH_CERTIFICATE", "OTHER"]).optional(),
  }),
});

export const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid applicant id"),
    docId: z.string().uuid("Invalid document id"),
  }),
});

export const approveSchema = z.object(idParam);

export const sendSlipSchema = z.object(idParam);

export const enrollSchema = z.object({
  params: idParam.params,
  body: z.object({
    sectionId: z.string().uuid("Invalid sectionId"),
    // Optional — blank chhora to service auto-generate karta hai ("Auto if left blank")
    rollNumber: z.string().min(1).optional(),
    advanceFeePaid: z.boolean().optional(),
  }),
});

export const recordAdvanceFeeSchema = z.object({
  params: idParam.params,
  body: z.object({
    amount: z.coerce.number().nonnegative().optional(),
  }),
});

const listQuerySchema = {
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    status: z.string().optional(),
    classId: z.string().uuid("Invalid classId").optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
};

export const listApplicantsSchema = z.object(listQuerySchema);

export const exportApplicantsSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    status: z.string().optional(),
    classId: z.string().uuid("Invalid classId").optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const getApplicantSchema = z.object(idParam);

export const getFunnelSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
  }),
});
