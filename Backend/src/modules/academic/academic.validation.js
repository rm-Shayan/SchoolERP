import { z } from "zod";

const schoolIdParam = {
  params: z.object({
    schoolId: z.string().uuid("Invalid schoolId"),
  }),
};

const idParam = {
  params: z.object({
    id: z.string().uuid("Invalid id"),
  }),
};

const academicYearIdParam = {
  params: z.object({
    academicYearId: z.string().uuid("Invalid academicYearId"),
  }),
};

const classIdParam = {
  params: z.object({
    classId: z.string().uuid("Invalid classId"),
  }),
};

// ── Academic Year ───────────────────────────────────────────────
export const createAcademicYearSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    name: z.string().min(1, "Year name required (e.g. 2025-2026)"),
    startDate: z.string().min(1, "startDate required (YYYY-MM-DD)"),
    endDate: z.string().min(1, "endDate required (YYYY-MM-DD)"),
    isCurrent: z.boolean().optional(),
  }),
});

export const updateAcademicYearSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
  }),
});

export const getAcademicYearSchema = z.object(idParam);

export const listAcademicYearsSchema = z.object({
  params: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
    })
    .optional(),
  query: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
    })
    .optional(),
});

// ── Term ────────────────────────────────────────────────────────
export const createTermSchema = z.object({
  params: academicYearIdParam.params,
  body: z.object({
    name: z.string().min(1, "Term name required (e.g. Term 1)"),
    startDate: z.string().min(1, "startDate required (YYYY-MM-DD)"),
    endDate: z.string().min(1, "endDate required (YYYY-MM-DD)"),
  }),
});

export const listTermsSchema = z.object(academicYearIdParam);

export const updateTermSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const deleteTermSchema = z.object(idParam);

// ── Class ───────────────────────────────────────────────────────
export const createClassSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    name: z.string().min(1, "Class name required (e.g. Class 1, PlayGroup)"),
    order: z.number().int().min(0).optional(),
  }),
});

export const listClassesSchema = z.object({
  params: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
    })
    .optional(),
  query: z
    .object({
      schoolId: z.string().uuid("Invalid schoolId").optional(),
    })
    .optional(),
});

export const getClassSchema = z.object(idParam);

export const updateClassSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const deleteClassSchema = z.object(idParam);

// ── Section ─────────────────────────────────────────────────────
export const createSectionSchema = z.object({
  params: classIdParam.params,
  body: z.object({
    name: z.string().min(1, "Section name required (e.g. A, B, Morning)"),
    capacity: z.number().int().min(1).optional(),
    roomNumber: z.string().nullable().optional(),
  }),
});

export const listSectionsSchema = z.object(classIdParam);

export const updateSectionSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    roomNumber: z.string().nullable().optional(),
  }),
});

export const deleteSectionSchema = z.object(idParam);

// ── Section Template ──────────────────────────────────────────
export const listSectionTemplatesSchema = z.object({
  params: z.object({
    schoolId: z.string().uuid("Invalid schoolId"),
  }),
});

// Templates sirf name rakhte hain — capacity/room per-class Section par.
export const createSectionTemplateSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    name: z.string().min(1, "Section name required (e.g. A, Morning)"),
  }),
});

export const updateSectionTemplateSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

export const getSectionTemplateSchema = z.object(idParam);

// ── Subject ─────────────────────────────────────────────────────
export const createSubjectSchema = z.object({
  params: classIdParam.params,
  body: z.object({
    name: z.string().min(1, "Subject name required (e.g. Mathematics)"),
    code: z.string().optional(),
    fullMarks: z.number().int().positive().optional(),
    passMarks: z.number().int().positive().optional(),
  }),
});

export const listSubjectsSchema = z.object(classIdParam);

export const updateSubjectSchema = z.object({
  params: idParam.params,
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().nullable().optional(),
    fullMarks: z.number().int().positive().optional(),
    passMarks: z.number().int().positive().optional(),
  }),
});

export const deleteSubjectSchema = z.object(idParam);
