'use client';

import { api } from './api';
import type { TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import type { ApiResponse } from '@/types';

export type { TeachingAssignment };

const teachingEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    listTeachingAssignments: build.query<TeachingAssignment[], { schoolId: string; teacherId?: string; classId?: string }>({
      query: ({ schoolId, ...params }) => ({ url: `/teaching-assignments/schools/${schoolId}`, params }),
      transformResponse: (res: ApiResponse<TeachingAssignment[]>) => res.data,
      providesTags: ['TeachingAssignment'],
    }),
    listMineAssignments: build.query<TeachingAssignment[], string>({
      query: (schoolId) => `/teaching-assignments/schools/${schoolId}/me`,
      transformResponse: (res: ApiResponse<TeachingAssignment[]>) => res.data,
      providesTags: ['TeachingAssignment'],
    }),
    assignTeaching: build.mutation<TeachingAssignment, { schoolId: string; data: Record<string, unknown> }>({
      query: ({ schoolId, data }) => ({ url: `/teaching-assignments/schools/${schoolId}`, method: 'POST', body: data }),
      transformResponse: (res: ApiResponse<TeachingAssignment>) => res.data,
      invalidatesTags: ['TeachingAssignment'],
    }),
    removeAssignment: build.mutation<void, string>({
      query: (id) => ({ url: `/teaching-assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeachingAssignment'],
    }),
  }),
});

export const {
  useListTeachingAssignmentsQuery,
  useListMineAssignmentsQuery,
  useAssignTeachingMutation,
  useRemoveAssignmentMutation,
} = teachingEndpoints;
