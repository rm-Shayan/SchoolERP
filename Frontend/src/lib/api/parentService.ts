'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

const API_BASE_URL = '/api/v1';

/** Window event — profile (photo etc.) update hone par dashboard refresh ke liye. */
export const PARENT_PROFILE_UPDATED_EVENT = 'parent:profile-updated';

export interface ParentChild {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  imageUrl?: string | null;
  gender: string | null;
  status: string;
  isActive: boolean;
  school: { id: string; name: string; slug?: string | null; themeColor?: string; logoUrl?: string } | null;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
}

export interface ParentProfile {
  id: string;
  name: string;
  whatsappNo: string;
  phone: string | null;
  email: string | null;
  imageUrl?: string | null;
  createdAt: string;
  children: ParentChild[];
}

const parentApi = axios.create({ baseURL: API_BASE_URL });

parentApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('parentToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

parentApi.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('parentToken');
      localStorage.removeItem('parentProfile');
      window.location.href = portalLoginRedirect();
    }
    return Promise.reject(error);
  }
);

export const parentService = {
  async login(payload: { schoolCode: string; phone: string; password: string }): Promise<{ token: string; parent: ParentProfile }> {
    const res = await parentApi.post<ApiResponse<{ token: string; parent: ParentProfile }>>(
      '/auth/parent/login', payload
    );
    return res.data.data;
  },
  async requestOtp(whatsappNo: string): Promise<{ message: string; parentName: string; devOtp?: string }> {
    const res = await parentApi.post<ApiResponse<{ message: string; parentName: string; devOtp?: string }>>(
      '/auth/parent/request-otp', { whatsappNo }
    );
    return res.data.data;
  },
  async verifyOtp(whatsappNo: string, otp: string): Promise<{ token: string; parent: ParentProfile }> {
    const res = await parentApi.post<ApiResponse<{ token: string; parent: ParentProfile }>>(
      '/auth/parent/verify-otp', { whatsappNo, otp }
    );
    return res.data.data;
  },
  async getMe(): Promise<ParentProfile> {
    const res = await parentApi.get<ApiResponse<ParentProfile>>('/auth/parent/me');
    return res.data.data;
  },
  async updateMe(payload: { name?: string; phone?: string; email?: string }): Promise<ParentProfile> {
    const res = await parentApi.patch<ApiResponse<ParentProfile>>('/portal/me', payload);
    return res.data.data;
  },
  /** Upload / replace the parent profile photo — returns the updated profile fields. */
  async uploadAvatar(file: File): Promise<ParentProfile> {
    const form = new FormData();
    form.append('file', file);
    const res = await parentApi.post<ApiResponse<ParentProfile>>('/portal/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
