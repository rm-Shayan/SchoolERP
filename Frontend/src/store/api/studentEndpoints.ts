'use client';

import { api } from './api';
import type { Student } from '@/types';
import type { ApiResponse } from '@/types';

export interface StudentListEnvelope {
  items: Student[]; total: number; page: number; pageSize: number;
  summary?: { total: number; ACTIVE: number; GRADUATED: number; DROPPED_OUT: number; TRANSFERRED_OUT: number; blocked: number };
}

const studentEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    students: build.query<StudentListEnvelope, Record<string, unknown>>({
      query: (params) => ({ url: '/students', params }),
      transformResponse: (res: ApiResponse<StudentListEnvelope>) => res.data,
      providesTags: (result) =>
        result ? [...result.items.map((s) => ({ type: 'Student' as const, id: s.id })), { type: 'Student', id: 'LIST' }] : [{ type: 'Student', id: 'LIST' }],
    }),
    studentById: build.query<Student, string>({
      query: (id) => `/students/${id}`,
      transformResponse: (res: ApiResponse<Student>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Student', id }],
    }),
    createStudent: build.mutation<Student, { schoolId: string; data: Record<string, unknown> }>({
      query: ({ schoolId, data }) => ({ url: `/students/schools/${schoolId}`, method: 'POST', body: data }),
      transformResponse: (res: ApiResponse<Student>) => res.data,
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    updateStudent: build.mutation<Student, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/students/${id}`, method: 'PATCH', body: data }),
      transformResponse: (res: ApiResponse<Student>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Student', id }, { type: 'Student', id: 'LIST' }],
    }),
    deleteStudent: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/students/${id}`, method: 'DELETE' }),
      transformResponse: (res: ApiResponse<{ id: string }>) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: 'Student', id }, { type: 'Student', id: 'LIST' }],
    }),
  }),
});

export const {
  useStudentsQuery, useStudentByIdQuery,
  useCreateStudentMutation, useUpdateStudentMutation, useDeleteStudentMutation,
} = studentEndpoints;
