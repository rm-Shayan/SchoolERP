'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

const API_BASE_URL = '/api/v1';

export interface PortalStudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  imageUrl?: string | null;
  status: string;
  isActive: boolean;
  school: { id: string; name: string; slug?: string | null; themeColor?: string; logoUrl?: string } | null;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  parentWhatsapp?: string | null;
}

const portalApi = axios.create({ baseURL: API_BASE_URL });

portalApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('studentToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentProfile');
      window.location.href = portalLoginRedirect();
    }
    return Promise.reject(error);
  }
);

export const portalService = {
  // POST /auth/student/login — School Code + Roll Number + shared school password
  async studentLogin(schoolCode: string, rollNumber: string, password: string): Promise<{ token: string; student: PortalStudentProfile }> {
    const res = await portalApi.post<ApiResponse<{ token: string; student: PortalStudentProfile }>>(
      '/auth/student/login',
      { schoolCode, rollNumber, password }
    );
    return res.data.data;
  },
  // GET /auth/student/me
  async studentGetMe(): Promise<PortalStudentProfile> {
    const res = await portalApi.get<ApiResponse<PortalStudentProfile>>('/auth/student/me');
    return res.data.data;
  },
};
