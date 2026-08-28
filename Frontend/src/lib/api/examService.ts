import api from './client';
import type { ApiResponse, Exam } from '@/types';

export interface ExamResultEntry {
  studentId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  remarks?: string;
}

export interface ExamListEnvelope {
  items: Exam[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublishResult {
  examId: string;
  notified: number;
  students: number;
}

export const examService = {
  // POST /exams/schools/:schoolId — ACADEMIC
  create: async (
    schoolId: string,
    data: { termId: string; name?: string; startDate: string; endDate: string },
  ): Promise<Exam> => {
    const res = await api.post<ApiResponse<Exam>>(`/exams/schools/${schoolId}`, data);
    return res.data.data;
  },

  // GET /exams/schools/:schoolId — ALL_STAFF (academicYearId filter)
  getBySchool: async (schoolId: string, academicYearId?: string): Promise<Exam[]> => {
    const res = await api.get<ApiResponse<ExamListEnvelope>>(`/exams/schools/${schoolId}`, {
      params: academicYearId ? { academicYearId } : undefined,
    });
    return res.data.data.items;
  },

  // GET /exams/:id — ALL_STAFF
  getById: async (id: string): Promise<Exam> => {
    const res = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
    return res.data.data;
  },

  // DELETE /exams/:id — MANAGEMENT
  remove: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  // POST /exams/:id/results — ACADEMIC (bulk entry, upsert)
  submitResults: async (id: string, entries: ExamResultEntry[]): Promise<{ count: number }> => {
    const res = await api.post<ApiResponse<{ count: number }>>(`/exams/${id}/results`, { entries });
    return res.data.data;
  },

  // POST /exams/:id/publish — MANAGEMENT (email result summary to parents)
  publish: async (id: string): Promise<PublishResult> => {
    const res = await api.post<ApiResponse<PublishResult>>(`/exams/${id}/publish`);
    return res.data.data;
  },

  // GET /exams/:examId/students/:studentId — ALL_STAFF
  getStudentReport: async (examId: string, studentId: string): Promise<unknown> => {
    const res = await api.get<ApiResponse<unknown>>(`/exams/${examId}/students/${studentId}`);
    return res.data.data;
  },

  // GET /exams/:examId/students/:studentId/card — generated result card
  getStudentCard: async (examId: string, studentId: string): Promise<ResultCard> => {
    const res = await api.get<ApiResponse<ResultCard>>(`/exams/${examId}/students/${studentId}/card`);
    return res.data.data;
  },
};

export interface ResultCardSubject {
  subject: string;
  marksObtained: number;
  maxMarks: number;
  remarks: string | null;
}

export interface ResultCard {
  exam: { id: string; name: string; startDate: string; endDate: string; term?: string };
  student: { id: string; name: string; rollNumber: string; section: string };
  subjects: ResultCardSubject[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  division: string;
  result: 'PASS' | 'FAIL';
}