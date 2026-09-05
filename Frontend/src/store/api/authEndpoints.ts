'use client';

import { api } from './api';
import type { User } from '@/types';
import type { ApiResponse } from '@/types';

const authEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (res: ApiResponse<User>) => res.data,
      providesTags: ['Me'],
    }),
  }),
});

export const { useGetMeQuery } = authEndpoints;
