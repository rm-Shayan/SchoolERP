import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

export const createFeeStructureSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    classId: z.string().uuid("Invalid classId").optional(),
    classIds: z.array(z.string().uuid("Invalid classId")).optional(),
    academicYearId: z.string().uuid("Invalid academicYearId"),
    name: z.string().min(1, "Structure name required (e.g. Monthly Tuition 2026)"),
    lineItems: z.array(z.object({
      title: z.string().min(1, "Line item title required"),
      amount: z.coerce.number().nonnegative("Amount must be >= 0"),
      isLateFee: z.coerce.boolean().optional().default(false),
      lateFeeDays: z.coerce.number().int().nonnegative().optional().default(0),
    })).min(1, "At least one line item required").refine((items) => items.length > 0),
  }).refine((b) => Boolean(b.classId || b.classIds?.length), "Select at least one class"),
});

export const listFeeStructuresSchema = z.object({
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId").optional() }).optional(),
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    classId: z.string().uuid("Invalid classId").optional(),
    academicYearId: z.string().uuid("Invalid academicYearId").optional(),
  }),
});

export const generateMonthlyFeesSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    sectionId: z.string().uuid("Invalid sectionId").optional(),
    classId: z.string().uuid("Invalid classId").optional(),
    // Optional — jab structureId na diya jaye to har student apni class ke
    // current-year structure se voucher banata hai ("same fee for primary"
    // wala flow). Sirf tab required jab explicit structure chahiye.
    structureId: z.string().uuid("Invalid structureId").optional(),
    month: z.coerce.number().int().min(1).max(12, "month must be 1-12"),
    year: z.coerce.number().int().min(2000).max(2100),
    months: z.coerce.number().int().min(1).max(12).optional().default(1),
    dueDay: z.coerce.number().int().min(1).max(28).optional(),
  }),
});

export const listFeeRecordsSchema = z.object({
  query: z.object({
    schoolId: z.string().uuid("Invalid schoolId").optional(),
    studentId: z.string().uuid("Invalid studentId").optional(),
    status: z.string().optional(),
    dueDateBefore: z.string().optional(),
    dueDateAfter: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const recordPaymentSchema = z.object({
  params: idParam.params,
  body: z.object({
    amount: z.coerce.number().positive("Payment amount must be positive"),
    method: z.enum(["CASH", "BANK_TRANSFER", "ONLINE", "OTHER"]).default("CASH"),
    reference: z.string().optional(),
    allocateOpenRecords: z.coerce.boolean().optional().default(false),
    periodMonths: z.array(z.object({ year: z.number(), month: z.number() })).optional(),
    recordIds: z.array(z.string().uuid()).optional(),
    allocations: z.array(z.object({ recordId: z.string().uuid(), amount: z.coerce.number().positive() })).optional(),
  }),
});

export const getFeeRecordSchema = z.object(idParam);

export const getFeeStructureSchema = z.object(idParam);

export const updateFeeStructureSchema = z.object({
  params: idParam.params,
  body: z.object({
    classId: z.string().uuid("Invalid classId").optional(),
    academicYearId: z.string().uuid("Invalid academicYearId").optional(),
    name: z.string().min(1, "Structure name required").optional(),
    lineItems: z.array(z.object({
      title: z.string().min(1, "Line item title required"),
      amount: z.coerce.number().nonnegative("Amount must be >= 0"),
      isLateFee: z.coerce.boolean().optional().default(false),
      lateFeeDays: z.coerce.number().int().nonnegative().optional().default(0),
    })).min(1, "At least one line item required").optional(),
  }),
});

export const listStructuresParamSchema = z.object({
  params: schoolIdParam.params,
});

export const setSchoolDueDaySchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    dueDay: z.coerce.number().int().min(1).max(28, "Due day must be between 1 and 28"),
  }),
});

export const updateRecordDueDateSchema = z.object({
  params: idParam.params,
  body: z.object({
    dueDate: z.string().min(1, "dueDate required (ISO date)"),
  }),
});
