'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { cached } from './serviceCache';
import { saveBlob } from './downloadPdf';
import type {
  PortalOverview, PortalAttendanceResponse, PortalFeeResponse,
  PortalHomework, PortalCircular, PortalExamResult, PortalTimetableSlot,
  PortalConductRemark, PortalPTMSession, PortalLeaveRequest, PortalExamSheet,
} from '@/types/portal';

const API = '/api/v1';
const CACHE_TTL = 10_000;
const instances = new Map<string, ReturnType<typeof axios.create>>();

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

function getAxios() {
  if (typeof window === 'undefined') return createPortalAxios('parentToken');
  const key = localStorage.getItem('studentToken') ? 'studentToken' : 'parentToken';
  let instance = instances.get(key);
  if (!instance) { instance = createPortalAxios(key); instances.set(key, instance); }
  return instance;
}

export const portalDataService = {
  async getOverview(): Promise<PortalOverview> {
    return cached('portal:overview', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalOverview>>('/portal/overview');
      return res.data.data;
    });
  },

  async getAttendance(month?: number, year?: number): Promise<PortalAttendanceResponse> {
    const params: Record<string, string> = {};
    if (month) params.month = String(month);
    if (year) params.year = String(year);
    return cached(`portal:att:${JSON.stringify(params)}`, CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalAttendanceResponse>>('/portal/attendance', { params });
      return res.data.data;
    });
  },

  async getFees(): Promise<PortalFeeResponse> {
    return cached('portal:fees', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalFeeResponse>>('/portal/fees');
      return res.data.data;
    });
  },

  async getHomework(): Promise<PortalHomework[]> {
    return cached('portal:hw', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalHomework[]>>('/portal/homework');
      return res.data.data;
    });
  },

  async getCirculars(): Promise<PortalCircular[]> {
    return cached('portal:circ', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalCircular[]>>('/portal/circulars');
      return res.data.data;
    });
  },

  async getResults(): Promise<PortalExamResult[]> {
    return cached('portal:results', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalExamResult[]>>('/portal/results');
      return res.data.data;
    });
  },

  async getTimetable(): Promise<PortalTimetableSlot[]> {
    return cached('portal:tt', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalTimetableSlot[]>>('/portal/timetable');
      return res.data.data;
    });
  },

  async getConduct(): Promise<PortalConductRemark[]> {
    return cached('portal:conduct', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalConductRemark[]>>('/portal/conduct');
      return res.data.data;
    });
  },

  async getPTM(): Promise<PortalPTMSession[]> {
    return cached('portal:ptm', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalPTMSession[]>>('/portal/ptm');
      return res.data.data;
    });
  },

  async getLeaveRequests(): Promise<PortalLeaveRequest[]> {
    const res = await getAxios().get<ApiResponse<PortalLeaveRequest[]>>('/portal/leave');
    return res.data.data;
  },

  async createLeaveRequest(data: { studentId: string; dateFrom: string; dateTo: string; reason: string }): Promise<PortalLeaveRequest> {
    const res = await getAxios().post<ApiResponse<PortalLeaveRequest>>('/portal/leave', data);
    return res.data.data;
  },

  async getExams(): Promise<PortalExamSheet[]> {
    return cached('portal:exams', CACHE_TTL, async () => {
      const res = await getAxios().get<ApiResponse<PortalExamSheet[]>>('/portal/exams');
      return res.data.data;
    });
  },

  async downloadExamDateSheet(examId: string, name?: string): Promise<void> {
    const res = await getAxios().get(`/portal/exams/${examId}/date-sheet`, { responseType: 'blob' });
    const safe = (name || 'date-sheet').replace(/[^\w-]+/g, '-').toLowerCase();
    saveBlob(res.data, `${safe}-date-sheet.pdf`);
  },

  async downloadTimetable(): Promise<void> {
    const res = await getAxios().get('/portal/timetable/pdf', { responseType: 'blob' });
    saveBlob(res.data, `timetable-${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
