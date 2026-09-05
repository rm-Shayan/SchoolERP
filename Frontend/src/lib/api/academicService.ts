import api from './client';
import type { ApiResponse, AcademicYear } from '@/types';
export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
}
export interface Class {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  order: number;
  sections?: Section[];
  subjects?: Subject[];
}
export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity?: number;
  roomNumber?: string;
  _count?: { students: number };
}
export interface Subject {
  id: string;
  classId: string;
  name: string;
  code?: string;
}
export interface SectionTemplate {
  id: string;
  schoolId: string;
  name: string;
}
export const academicService = {
  createYear: async (schoolId: string, data: { name: string; startDate: string; endDate: string }) => {
    const res = await api.post<ApiResponse<AcademicYear>>(`/academic/schools/${schoolId}/academic-years`, data);
    return res.data.data;
  },
  getYear: async (id: string) => {
    const res = await api.get<ApiResponse<AcademicYear>>(`/academic/academic-years/${id}`);
    return res.data.data;
  },
  getYearsBySchool: async (schoolId: string) => {
    const res = await api.get<ApiResponse<AcademicYear[]>>(`/academic/schools/${schoolId}/academic-years`);
    return res.data.data;
  },
  updateYear: async (id: string, data: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>) => {
    const res = await api.patch<ApiResponse<AcademicYear>>(`/academic/academic-years/${id}`, data);
    return res.data.data;
  },
  deleteYear: async (id: string) => {
    await api.delete(`/academic/academic-years/${id}`);
  },
  createTerm: async (academicYearId: string, data: { name: string; startDate: string; endDate: string }) => {
    const res = await api.post<ApiResponse<Term>>(`/academic/academic-years/${academicYearId}/terms`, data);
    return res.data.data;
  },
  getTerms: async (academicYearId: string) => {
    const res = await api.get<ApiResponse<Term[]>>(`/academic/academic-years/${academicYearId}/terms`);
    return res.data.data;
  },
  updateTerm: async (id: string, data: Partial<{ name: string; startDate: string; endDate: string }>) => {
    const res = await api.patch<ApiResponse<Term>>(`/academic/terms/${id}`, data);
    return res.data.data;
  },
  deleteTerm: async (id: string) => { await api.delete(`/academic/terms/${id}`); },
  createClass: async (schoolId: string, data: { name: string; code?: string; order: number }) => {
    const res = await api.post<ApiResponse<Class>>(`/academic/schools/${schoolId}/classes`, data);
    return res.data.data;
  },
  getClass: async (id: string) => {
    const res = await api.get<ApiResponse<Class>>(`/academic/classes/${id}`);
    return res.data.data;
  },
  getClassesBySchool: async (schoolId: string) => {
    const res = await api.get<ApiResponse<Class[]>>(`/academic/schools/${schoolId}/classes`);
    return res.data.data;
  },
  updateClass: async (id: string, data: Partial<{ name: string; code: string; order: number }>) => {
    const res = await api.patch<ApiResponse<Class>>(`/academic/classes/${id}`, data);
    return res.data.data;
  },
  deleteClass: async (id: string) => { await api.delete(`/academic/classes/${id}`); },
  createSection: async (classId: string, data: { name: string; capacity?: number; roomNumber?: string }) => {
    const res = await api.post<ApiResponse<Section>>(`/academic/classes/${classId}/sections`, data);
    return res.data.data;
  },
  getSectionsByClass: async (classId: string) => {
    const res = await api.get<ApiResponse<Section[]>>(`/academic/classes/${classId}/sections`);
    return res.data.data;
  },
  updateSection: async (id: string, data: Partial<{ name: string; capacity: number; roomNumber: string }>) => {
    const res = await api.patch<ApiResponse<Section>>(`/academic/sections/${id}`, data);
    return res.data.data;
  },
  deleteSection: async (id: string) => { await api.delete(`/academic/sections/${id}`); },
  getSectionTemplates: async (schoolId: string): Promise<SectionTemplate[]> => {
    const res = await api.get<ApiResponse<SectionTemplate[]>>(`/academic/schools/${schoolId}/section-templates`);
    return res.data.data;
  },
  createSectionTemplate: async (schoolId: string, data: { name: string }): Promise<SectionTemplate> => {
    const res = await api.post<ApiResponse<SectionTemplate>>(`/academic/schools/${schoolId}/section-templates`, data);
    return res.data.data;
  },
  updateSectionTemplate: async (id: string, data: Partial<{ name: string }>): Promise<SectionTemplate> => {
    const res = await api.patch<ApiResponse<SectionTemplate>>(`/academic/section-templates/${id}`, data);
    return res.data.data;
  },
  deleteSectionTemplate: async (id: string): Promise<void> => {
    await api.delete(`/academic/section-templates/${id}`);
  },

  createSubject: async (classId: string, data: { name: string; code?: string }) => {
    const res = await api.post<ApiResponse<Subject>>(`/academic/classes/${classId}/subjects`, data);
    return res.data.data;
  },
  getSubjectsByClass: async (classId: string) => {
    const res = await api.get<ApiResponse<Subject[]>>(`/academic/classes/${classId}/subjects`);
    return res.data.data;
  },
  updateSubject: async (id: string, data: Partial<{ name: string; code: string }>) => {
    const res = await api.patch<ApiResponse<Subject>>(`/academic/subjects/${id}`, data);
    return res.data.data;
  },
  deleteSubject: async (id: string) => { await api.delete(`/academic/subjects/${id}`); },
};
