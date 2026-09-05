'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import { saveBlob } from './downloadPdf';
import type {
  PortalOverview, PortalAttendanceResponse, PortalFeeResponse,
  PortalHomework, PortalCircular, PortalExamResult, PortalTimetableSlot,
  PortalConductRemark, PortalPTMSession, PortalLeaveRequest, PortalExamSheet,
} from '@/types/portal';
import type { StudyMaterial } from './studyMaterialService';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

const API = '/api/v1';
const instances = new Map<string, ReturnType<typeof axios.create>>();

function createPortalAxios(tokenKey: string) {
  const instance = axios.create({ baseURL: API });
  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    const t = localStorage.getItem(tokenKey);
    if (t && cfg.headers) cfg.headers.Authorization = `Bearer ${t}`;
    // Parent portal: selected child (child switcher) ka studentId har GET par
    // bhejo — backend data ko us child par scope karta hai. Student portal
    // single child hota hai, koi param nahi.
    if (tokenKey === 'parentToken' && (cfg.method ?? 'get').toLowerCase() === 'get') {
      const activeChildId = localStorage.getItem('activeChildId');
      if (activeChildId) cfg.params = { ...(cfg.params as Record<string, unknown> | undefined), studentId: activeChildId };
    }
    return cfg;
  });
  instance.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(tokenKey === 'parentToken' ? 'parentProfile' : 'studentProfile');
        window.location.href = portalLoginRedirect();
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

  async getExams(): Promise<PortalExamSheet[]> {
    const res = await getAxios().get<ApiResponse<PortalExamSheet[]>>('/portal/exams');
    return res.data.data;
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

  async getStudyMaterials(): Promise<StudyMaterial[]> {
    const res = await getAxios().get<ApiResponse<StudyMaterial[]>>('/portal/study-material');
    return res.data.data;
  },
};
