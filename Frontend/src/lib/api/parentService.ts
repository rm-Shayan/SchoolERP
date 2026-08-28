'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = '/api/v1';

export interface ParentChild {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender: string | null;
  status: string;
  isActive: boolean;
  school: { id: string; name: string } | null;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
}

export interface ParentProfile {
  id: string;
  name: string;
  whatsappNo: string;
  phone: string | null;
  email: string | null;
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
      window.location.href = '/parent/login';
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
};
