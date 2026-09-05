'use client';

import { api } from './api';
import type { Class } from '@/lib/api/academicService';
import type { AcademicYear } from '@/types';
import type { ApiResponse } from '@/types';

export type { Class, AcademicYear };

const academicEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    classesBySchool: build.query<Class[], string>({
      query: (schoolId) => `/academic/schools/${schoolId}/classes`,
      transformResponse: (res: ApiResponse<Class[]>) => res.data,
      providesTags: ['Academic'],
    }),
    yearsBySchool: build.query<AcademicYear[], string>({
      query: (schoolId) => `/academic/schools/${schoolId}/academic-years`,
      transformResponse: (res: ApiResponse<AcademicYear[]>) => res.data,
      providesTags: ['Academic'],
    }),
  }),
});

export const { useClassesBySchoolQuery, useYearsBySchoolQuery } = academicEndpoints;
