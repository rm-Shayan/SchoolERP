'use client';

import { api } from './api';
import type { User } from '@/types';
import type { ApiResponse } from '@/types';

export interface PaginatedStaff { items: User[]; total: number; page: number; pageSize: number; totalPages: number; }

const staffEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    allStaff: build.query<PaginatedStaff, Record<string, unknown>>({
      query: (params) => ({ url: '/auth/users', params }),
      transformResponse: (res: ApiResponse<PaginatedStaff>) => res.data,
      providesTags: ['Staff'],
    }),
  }),
});

export const { useAllStaffQuery } = staffEndpoints;
