import api from './client';
import type { ApiResponse } from '@/types';

export interface StudyMaterialCreator {
  id: string;
  name: string;
  role: string;
}

export interface StudyMaterialSectionRef {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

export interface StudyMaterialSubjectRef {
  id: string;
  name: string;
}

export interface StudyMaterial {
  id: string;
  schoolId: string;
  title: string;
  description?: string | null;
  type: 'DOCUMENT' | 'VIDEO' | 'IMAGE' | 'LINK';
  fileUrl?: string | null;
  linkUrl?: string | null;
  sectionId?: string | null;
  subjectId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: StudyMaterialCreator | null;
  section?: StudyMaterialSectionRef | null;
  subject?: StudyMaterialSubjectRef | null;
}

export interface StudyMaterialListResponse {
  items: StudyMaterial[];
  total: number;
  page: number;
  pageSize: number;
}

export const studyMaterialService = {
  /**
   * Create study material — single request with file + metadata.
   * File is optional (URL-only materials allowed).
   */
  create: async (formData: FormData): Promise<StudyMaterial> => {
    const res = await api.post<ApiResponse<StudyMaterial>>('/study-material', formData);
    return res.data.data;
  },

  getAll: async (params?: {
    sectionId?: string;
    subjectId?: string;
    type?: string;
    createdById?: string;
    page?: number;
    pageSize?: number;
  }): Promise<StudyMaterialListResponse> => {
    const res = await api.get<ApiResponse<StudyMaterialListResponse>>('/study-material', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<StudyMaterial> => {
    const res = await api.get<ApiResponse<StudyMaterial>>(`/study-material/${id}`);
    return res.data.data;
  },

  update: async (id: string, formData: FormData): Promise<StudyMaterial> => {
    const res = await api.put<ApiResponse<StudyMaterial>>(`/study-material/${id}`, formData);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/study-material/${id}`);
  },

  getPortalStudyMaterials: async (): Promise<StudyMaterial[]> => {
    const res = await api.get<ApiResponse<StudyMaterial[]>>('/portal/study-material');
    return res.data.data;
  },
};
