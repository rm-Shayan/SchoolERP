'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import type {
  PortalOverview,
  PortalAttendanceResponse,
  PortalFeeResponse,
  PortalHomework,
  PortalCircular,
  PortalExamResult,
  PortalTimetableSlot,
  PortalConductRemark,
  PortalPTMSession,
  PortalLeaveRequest,
} from '@/types/portal';

const API = '/api/v1';

function createPortalAxios(tokenKey: string) {
  const instance = axios.create({ baseURL: API });
  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    const t = localStorage.getItem(tokenKey);
    if (t && cfg.headers) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  instance.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(tokenKey === 'parentToken' ? 'parentProfile' : 'studentProfile');
        window.location.href = '/parent/login';
      }
      return Promise.reject(err);
    },
  );
  return instance;
}

// Pick the right axios instance based on which token exists
function getAxios() {
  if (typeof window === 'undefined') return createPortalAxios('parentToken');
  return localStorage.getItem('studentToken')
    ? createPortalAxios('studentToken')
    : createPortalAxios('parentToken');
}

export const portalDataService = {
  async getOverview(): Promise<PortalOverview> {
    const res = await getAxios().get<ApiResponse<PortalOverview>>('/portal/overview');
    return res.data.data;
  },
  async getAttendance(month?: number, year?: number): Promise<PortalAttendanceResponse> {
    const params: Record<string, string> = {};
    if (month) params.month = String(month);
    if (year) params.year = String(year);
    const res = await getAxios().get<ApiResponse<PortalAttendanceResponse>>('/portal/attendance', { params });
    return res.data.data;
  },
  async getFees(): Promise<PortalFeeResponse> {
    const res = await getAxios().get<ApiResponse<PortalFeeResponse>>('/portal/fees');
    return res.data.data;
  },
  async getHomework(): Promise<PortalHomework[]> {
    const res = await getAxios().get<ApiResponse<PortalHomework[]>>('/portal/homework');
    return res.data.data;
  },
  async getCirculars(): Promise<PortalCircular[]> {
    const res = await getAxios().get<ApiResponse<PortalCircular[]>>('/portal/circulars');
    return res.data.data;
  },
  async getResults(): Promise<PortalExamResult[]> {
    const res = await getAxios().get<ApiResponse<PortalExamResult[]>>('/portal/results');
    return res.data.data;
  },
  async getTimetable(): Promise<PortalTimetableSlot[]> {
    const res = await getAxios().get<ApiResponse<PortalTimetableSlot[]>>('/portal/timetable');
    return res.data.data;
  },
  async getConduct(): Promise<PortalConductRemark[]> {
    const res = await getAxios().get<ApiResponse<PortalConductRemark[]>>('/portal/conduct');
    return res.data.data;
  },
  async getPTM(): Promise<PortalPTMSession[]> {
    const res = await getAxios().get<ApiResponse<PortalPTMSession[]>>('/portal/ptm');
    return res.data.data;
  },
  async getLeaveRequests(): Promise<PortalLeaveRequest[]> {
    const res = await getAxios().get<ApiResponse<PortalLeaveRequest[]>>('/portal/leave');
    return res.data.data;
  },
  async createLeaveRequest(data: { studentId: string; dateFrom: string; dateTo: string; reason: string }): Promise<PortalLeaveRequest> {
    const res = await getAxios().post<ApiResponse<PortalLeaveRequest>>('/portal/leave', data);
    return res.data.data;
  },
};
