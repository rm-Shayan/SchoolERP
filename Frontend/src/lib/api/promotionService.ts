import api from './client';
import type { ApiResponse } from '@/types';

export interface PromotionRecord {
  id: string;
  action: 'PROMOTED' | 'REPEATED' | 'TRANSFERRED_SECTION' | 'GRADUATED' | 'DROPPED_OUT';
  studentId: string;
  fromSectionId?: string;
  toSectionId?: string;
  academicYearId: string;
  remarks?: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; rollNumber?: string | null; status?: string };
  academicYear?: { id: string; name: string };
  fromSection?: { id: string; name: string; class?: { name: string } } | null;
  toSection?: { id: string; name: string; class?: { name: string } } | null;
}

export const promotionService = {
  bulkPromote: async (data: {
    fromSectionId: string;
    toSectionId: string;
    academicYearId: string;
    studentIds?: string[];
  }): Promise<{ promoted: number }> => {
    const res = await api.post<ApiResponse<{ promoted: number }>>('/promotions/bulk-promote', data);
    return res.data.data;
  },

  markRepeat: async (data: { studentIds: string[]; academicYearId: string; remarks?: string }): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/promotions/repeat', data);
    return res.data.data;
  },

  transferSection: async (data: { studentId: string; toSectionId: string; remarks?: string }): Promise<PromotionRecord> => {
    const res = await api.post<ApiResponse<PromotionRecord>>('/promotions/transfer-section', data);
    return res.data.data;
  },

  graduate: async (data: { studentIds: string[]; remarks?: string }): Promise<{ graduated: number }> => {
    const res = await api.post<ApiResponse<{ graduated: number }>>('/promotions/graduate', data);
    return res.data.data;
  },

  bulkGraduate: async (data: { sectionId: string; academicYearId: string; studentIds?: string[]; remarks?: string }): Promise<{ graduated: number; total: number }> => {
    const res = await api.post<ApiResponse<{ graduated: number; total: number }>>('/promotions/bulk-graduate', data);
    return res.data.data;
  },

  dropout: async (data: { studentIds: string[]; reason?: string }): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/promotions/dropout', data);
    return res.data.data;
  },

  bulkDropout: async (data: { sectionId: string; academicYearId: string; studentIds?: string[]; remarks?: string }): Promise<{ droppedOut: number; total: number }> => {
    const res = await api.post<ApiResponse<{ droppedOut: number; total: number }>>('/promotions/bulk-dropout', data);
    return res.data.data;
  },

  getAll: async (params?: { schoolId?: string; action?: string; academicYearId?: string; page?: number; pageSize?: number }): Promise<{ items: PromotionRecord[]; total: number }> => {
    const res = await api.get<ApiResponse<{ items: PromotionRecord[]; total: number }>>('/promotions', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<PromotionRecord> => {
    const res = await api.get<ApiResponse<PromotionRecord>>(`/promotions/${id}`);
    return res.data.data;
  },
};
