'use client';

import { api } from './api';
import type { Organization, School, Student, User } from '@/types';
import type { ApiResponse } from '@/types';

const moderationEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    blockOrg: build.mutation<Organization, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/moderation/organizations/${id}/block`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<Organization>) => res.data,
      invalidatesTags: ['Org'],
    }),
    unblockOrg: build.mutation<Organization, string>({
      query: (id) => ({ url: `/moderation/organizations/${id}/unblock`, method: 'POST' }),
      transformResponse: (res: ApiResponse<Organization>) => res.data,
      invalidatesTags: ['Org'],
    }),
    blockSchool: build.mutation<School, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/moderation/schools/${id}/block`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<School>) => res.data,
      invalidatesTags: ['School'],
    }),
    unblockSchool: build.mutation<School, string>({
      query: (id) => ({ url: `/moderation/schools/${id}/unblock`, method: 'POST' }),
      transformResponse: (res: ApiResponse<School>) => res.data,
      invalidatesTags: ['School'],
    }),
    blockUser: build.mutation<User, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/moderation/users/${id}/block`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<User>) => res.data,
      invalidatesTags: ['Staff'],
    }),
    unblockUser: build.mutation<User, string>({
      query: (id) => ({ url: `/moderation/users/${id}/unblock`, method: 'POST' }),
      transformResponse: (res: ApiResponse<User>) => res.data,
      invalidatesTags: ['Staff'],
    }),
    blockStudent: build.mutation<Student, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/moderation/students/${id}/block`, method: 'POST', body }),
      transformResponse: (res: ApiResponse<Student>) => res.data,
      invalidatesTags: ['Student'],
    }),
    unblockStudent: build.mutation<Student, string>({
      query: (id) => ({ url: `/moderation/students/${id}/unblock`, method: 'POST' }),
      transformResponse: (res: ApiResponse<Student>) => res.data,
      invalidatesTags: ['Student'],
    }),
  }),
});

export const {
  useBlockOrgMutation, useUnblockOrgMutation,
  useBlockSchoolMutation, useUnblockSchoolMutation,
  useBlockUserMutation, useUnblockUserMutation,
  useBlockStudentMutation, useUnblockStudentMutation,
} = moderationEndpoints;
