'use client';

import { api } from './api';
import type { SmtpSettingsStatus } from '@/types';
import type { ApiResponse } from '@/types';

const smtpEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    smtpStatus: build.query<SmtpSettingsStatus, { organizationId?: string; schoolId?: string }>({
      query: (params) => ({ url: '/smtp/settings', params }),
      transformResponse: (res: ApiResponse<SmtpSettingsStatus>) => res.data,
      providesTags: ['SMTP'],
    }),
  }),
});

export const { useSmtpStatusQuery } = smtpEndpoints;
