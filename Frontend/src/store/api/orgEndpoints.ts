'use client';

import { api } from './api';
import type { Organization, PlatformOverview, OrgDashboard } from '@/types';
import type { ApiResponse } from '@/types';

const orgEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    orgs: build.query<Organization[], void>({
      query: () => '/organizations',
      transformResponse: (res: ApiResponse<Organization[]>) => res.data,
      providesTags: (result) =>
        result ? [...result.map((o) => ({ type: 'Org' as const, id: o.id })), { type: 'Org', id: 'LIST' }] : [{ type: 'Org', id: 'LIST' }],
    }),
    orgOverview: build.query<PlatformOverview, void>({
      query: () => '/organizations/overview',
      transformResponse: (res: ApiResponse<PlatformOverview>) => res.data,
      providesTags: ['Org'],
    }),
    orgById: build.query<Organization, string>({
      query: (id) => `/organizations/${id}`,
      transformResponse: (res: ApiResponse<Organization>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Org', id }],
    }),
    orgDashboard: build.query<OrgDashboard, string>({
      query: (id) => `/organizations/${id}/dashboard`,
      transformResponse: (res: ApiResponse<OrgDashboard>) => res.data,
      providesTags: ['Org'],
    }),
  }),
});

export const { useOrgsQuery, useOrgOverviewQuery, useOrgByIdQuery, useOrgDashboardQuery } = orgEndpoints;
