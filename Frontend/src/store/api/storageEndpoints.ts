'use client';

import { api } from './api';
import type { StorageSettingsStatus } from '@/types';
import type { ApiResponse } from '@/types';

const storageEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    storageStatus: build.query<StorageSettingsStatus, { organizationId?: string }>({
      query: (params) => ({ url: '/storage/settings', params }),
      transformResponse: (res: ApiResponse<StorageSettingsStatus>) => res.data,
      providesTags: ['Storage'],
    }),
  }),
});

export const { useStorageStatusQuery } = storageEndpoints;
