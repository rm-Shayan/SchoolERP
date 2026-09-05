'use client';

import { api } from './api';
import type { ApiResponse } from '@/types';

export interface Circular {
  id: string; schoolId: string; title: string; content: string;
  mediaUrl?: string; audience: string; createdAt: string;
}

const circularEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    circularsBySchool: build.query<Circular[], string>({
      query: (schoolId) => `/circulars/schools/${schoolId}`,
      transformResponse: (res: ApiResponse<{ items: Circular[] }>) => res.data.items,
      providesTags: ['Circular'],
    }),
  }),
});

export const { useCircularsBySchoolQuery } = circularEndpoints;
