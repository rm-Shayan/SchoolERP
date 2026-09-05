'use client';

import { api } from './api';
import type { Homework, HomeworkListResponse } from '@/lib/api/homeworkService';
import type { ApiResponse } from '@/types';

export type { Homework, HomeworkListResponse };

const homeworkEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    listHomework: build.query<HomeworkListResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/homework', params }),
      transformResponse: (res: ApiResponse<HomeworkListResponse>) => res.data,
      providesTags: (result) =>
        result ? [...result.items.map((h) => ({ type: 'Homework' as const, id: h.id })), 'Homework'] : ['Homework'],
    }),
    createHomework: build.mutation<Homework, { sectionId: string; title: string; content: string }>({
      query: (data) => ({ url: '/homework', method: 'POST', body: data }),
      transformResponse: (res: ApiResponse<{ broadcast: Homework }>) => res.data.broadcast,
      invalidatesTags: ['Homework'],
    }),
  }),
});

export const { useListHomeworkQuery, useCreateHomeworkMutation } = homeworkEndpoints;
