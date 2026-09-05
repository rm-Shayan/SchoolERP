'use client';

import { api } from './api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import type { ApiResponse } from '@/types';

export type { TimetableSlot };

const timetableApi = api.injectEndpoints({
  endpoints: (build) => ({
    getByTeacher: build.query<TimetableSlot[], string>({
      query: (teacherId) => `/timetable/teachers/${teacherId}`,
      transformResponse: (res: ApiResponse<TimetableSlot[]>) =>
        res.data.map((s) => ({ ...s, dayOfWeek: Number(s.dayOfWeek) })),
      providesTags: (result) =>
        result ? [...result.map((s) => ({ type: 'Timetable' as const, id: s.id })), 'Timetable'] : ['Timetable'],
    }),
    getBySection: build.query<TimetableSlot[], string>({
      query: (sectionId) => `/timetable/sections/${sectionId}`,
      transformResponse: (res: ApiResponse<TimetableSlot[]>) =>
        res.data.map((s) => ({ ...s, dayOfWeek: Number(s.dayOfWeek) })),
      providesTags: (result) =>
        result ? [...result.map((s) => ({ type: 'Timetable' as const, id: s.id })), 'Timetable'] : ['Timetable'],
    }),
    createSlot: build.mutation<TimetableSlot, { sectionId: string; data: Record<string, unknown> }>({
      query: ({ sectionId, data }) => ({ url: `/timetable/sections/${sectionId}`, method: 'POST', body: data }),
      transformResponse: (res: ApiResponse<TimetableSlot>) => res.data,
      invalidatesTags: ['Timetable'],
    }),
    deleteSlot: build.mutation<void, string>({
      query: (id) => ({ url: `/timetable/slots/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Timetable'],
    }),
    clearAllSlots: build.mutation<{ deletedCount: number }, { sectionId: string; dayOfWeek?: number }>({
      query: ({ sectionId, dayOfWeek }) => ({
        url: `/timetable/sections/${sectionId}/slots`,
        method: 'DELETE',
        params: dayOfWeek !== undefined ? { dayOfWeek } : undefined,
      }),
      transformResponse: (res: ApiResponse<{ deletedCount: number }>) => res.data,
      invalidatesTags: ['Timetable'],
    }),
  }),
});

export const {
  useGetByTeacherQuery,
  useGetBySectionQuery,
  useCreateSlotMutation,
  useDeleteSlotMutation,
  useClearAllSlotsMutation,
} = timetableApi;
