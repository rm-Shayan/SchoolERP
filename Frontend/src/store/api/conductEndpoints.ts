'use client';

import { api } from './api';
import type { ConductRemark, ConductRemarkListResponse } from '@/lib/api/conductService';
import type { ApiResponse } from '@/types';

export type { ConductRemark, ConductRemarkListResponse };

const conductEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    conductMine: build.query<ConductRemarkListResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/conduct/remarks/mine', params }),
      transformResponse: (res: ApiResponse<ConductRemarkListResponse>) => res.data,
      providesTags: ['Conduct'],
    }),
    conductBySection: build.query<ConductRemark[], string>({
      query: (sectionId) => `/conduct/remarks/sections/${sectionId}`,
      transformResponse: (res: ApiResponse<ConductRemark[]>) => res.data,
      providesTags: ['Conduct'],
    }),
  }),
});

export const { useConductMineQuery, useConductBySectionQuery } = conductEndpoints;
