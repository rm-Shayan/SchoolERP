'use client';

import { api } from './api';
import type { PTMEvent } from '@/lib/api/ptmService';
import type { ApiResponse } from '@/types';

export type { PTMEvent };

const ptmEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    ptmBySchool: build.query<PTMEvent[], string>({
      query: (schoolId) => `/ptm/schools/${schoolId}`,
      transformResponse: (res: ApiResponse<{ items: PTMEvent[] }>) => res.data.items,
      providesTags: ['PTM'],
    }),
  }),
});

export const { usePtmBySchoolQuery } = ptmEndpoints;
