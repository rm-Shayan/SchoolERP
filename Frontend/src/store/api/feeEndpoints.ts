'use client';

import { api } from './api';
import type { FeeStructure, FeeRecord, FeeRecordListEnvelope, FeeSummary } from '@/types';
import type { ApiResponse } from '@/types';

const feeEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    feeStructuresBySchool: build.query<FeeStructure[], string>({
      query: (schoolId) => `/fees/schools/${schoolId}/structures`,
      transformResponse: (res: ApiResponse<FeeStructure[]>) => res.data,
      providesTags: ['Fee'],
    }),
    feeRecords: build.query<FeeRecord[], Record<string, unknown>>({
      query: (params) => ({ url: '/fees/records', params }),
      transformResponse: (res: ApiResponse<FeeRecordListEnvelope>) => res.data.items,
      providesTags: ['Fee'],
    }),
    feeSummary: build.query<FeeSummary, { schoolId: string; month?: number; year?: number }>({
      query: (params) => ({ url: '/fees/records/summary', params }),
      transformResponse: (res: ApiResponse<FeeSummary>) => res.data,
      providesTags: ['Fee'],
    }),
  }),
});

export const { useFeeStructuresBySchoolQuery, useFeeRecordsQuery, useFeeSummaryQuery } = feeEndpoints;
