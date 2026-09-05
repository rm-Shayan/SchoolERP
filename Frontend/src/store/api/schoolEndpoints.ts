'use client';

import { api } from './api';
import type { School } from '@/types';
import type { ApiResponse } from '@/types';

const schoolEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    schools: build.query<School[], string | void>({
      query: (organizationId) => ({ url: '/schools', params: organizationId ? { organizationId } : undefined }),
      transformResponse: (res: { data: School[] | { items: School[] } }) => {
        const d = res.data;
        return Array.isArray(d) ? d : d.items ?? [];
      },
      providesTags: (result) =>
        result ? [...result.map((s) => ({ type: 'School' as const, id: s.id })), { type: 'School', id: 'LIST' }] : [{ type: 'School', id: 'LIST' }],
    }),
    schoolById: build.query<School, string>({
      query: (id) => `/schools/${id}`,
      transformResponse: (res: ApiResponse<School>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'School', id }],
    }),
  }),
});

export const { useSchoolsQuery, useSchoolByIdQuery } = schoolEndpoints;
