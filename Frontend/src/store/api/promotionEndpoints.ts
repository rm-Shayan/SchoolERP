'use client';

import { api } from './api';
import type { ApiResponse } from '@/types';

export interface PromotionRecord {
  id: string; action: string; studentId: string; academicYearId: string;
  remarks?: string; createdAt: string;
  student?: { id: string; firstName: string; lastName: string; rollNumber?: string };
  academicYear?: { id: string; name: string };
}

const promotionEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    promotions: build.query<{ items: PromotionRecord[]; total: number }, Record<string, unknown>>({
      query: (params) => ({ url: '/promotions', params }),
      transformResponse: (res: ApiResponse<{ items: PromotionRecord[]; total: number }>) => res.data,
      providesTags: ['Promotion'],
    }),
  }),
});

export const { usePromotionsQuery } = promotionEndpoints;
