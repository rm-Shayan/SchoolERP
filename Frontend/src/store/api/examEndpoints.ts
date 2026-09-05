'use client';

import { api } from './api';
import type { Exam } from '@/types';
import type { ApiResponse } from '@/types';

const examEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    examsBySchool: build.query<Exam[], { schoolId: string; academicYearId?: string }>({
      query: ({ schoolId, ...params }) => ({ url: `/exams/schools/${schoolId}`, params }),
      transformResponse: (res: ApiResponse<{ items: Exam[] }>) => res.data.items,
      providesTags: ['Exam'],
    }),
  }),
});

export const { useExamsBySchoolQuery } = examEndpoints;
