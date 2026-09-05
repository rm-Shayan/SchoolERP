'use client';

import { api } from './api';
import type { Applicant } from '@/types';
import type { ApiResponse } from '@/types';

export interface AdmissionListEnvelope {
  items: Applicant[]; total: number; page: number; pageSize: number;
}

const admissionEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    admissions: build.query<AdmissionListEnvelope, Record<string, unknown>>({
      query: (params) => ({ url: '/admissions', params }),
      transformResponse: (res: ApiResponse<AdmissionListEnvelope>) => res.data,
      providesTags: (result) =>
        result ? [...result.items.map((a) => ({ type: 'Admission' as const, id: a.id })), { type: 'Admission', id: 'LIST' }] : [{ type: 'Admission', id: 'LIST' }],
    }),
    admissionById: build.query<Applicant, string>({
      query: (id) => `/admissions/${id}`,
      transformResponse: (res: ApiResponse<Applicant>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Admission', id }],
    }),
  }),
});

export const { useAdmissionsQuery, useAdmissionByIdQuery } = admissionEndpoints;
