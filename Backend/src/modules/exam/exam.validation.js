import { z } from "zod";

const idParam = {
  params: z.object({ id: z.string().uuid("Invalid id") }),
};

const schoolIdParam = {
  params: z.object({ schoolId: z.string().uuid("Invalid schoolId") }),
};

const paperSchema = z.object({
  classId: z.string().uuid("Invalid classId"),
  subjectId: z.string().uuid("Invalid subjectId"),
  sectionId: z.string().uuid("Invalid sectionId").optional().nullable(),
  date: z.string().min(1, "Paper date required"),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  maxMarks: z.coerce.number().positive("maxMarks must be > 0").optional().nullable(),
  roomNumber: z.string().optional().nullable(),
});

export const createExamSchema = z.object({
  params: schoolIdParam.params,
  body: z.object({
    termId: z.string().uuid("Invalid termId"),
    name: z.string().min(1, "Exam name required").optional(),
    startDate: z.string().min(1, "startDate required"),
    endDate: z.string().min(1, "endDate required"),
    papers: z.array(paperSchema).optional(),
  }),
});

export const updateExamSchema = z.object({
  params: idParam.params,
  body: z.object({
    termId: z.string().uuid("Invalid termId").optional(),
    name: z.string().min(1, "Exam name required").optional(),
    startDate: z.string().min(1, "startDate required").optional(),
    endDate: z.string().min(1, "endDate required").optional(),
    papers: z.array(paperSchema).min(1, "At least one paper required"),
  }),
});

export const listExamsSchema = z.object({
  params: schoolIdParam.params,
  query: z.object({
    termId: z.string().uuid("Invalid termId").optional(),
    academicYearId: z.string().uuid("Invalid academicYearId").optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getExamSchema = z.object(idParam);

export const enterResultsSchema = z.object({
  params: idParam.params,
  body: z.object({
    entries: z.array(z.object({
      studentId: z.string().uuid("Invalid studentId"),
      subjectId: z.string().uuid("Invalid subjectId"),
      marksObtained: z.coerce.number().nonnegative("marksObtained must be >= 0"),
      maxMarks: z.coerce.number().positive("maxMarks must be > 0"),
      remarks: z.string().optional(),
    })).min(1, "At least one result entry required"),
  }),
});

export const publishResultsSchema = z.object(idParam);

export const getStudentResultSchema = z.object({
  params: z.object({
    examId: z.string().uuid("Invalid examId"),
    studentId: z.string().uuid("Invalid studentId"),
  }),
});
