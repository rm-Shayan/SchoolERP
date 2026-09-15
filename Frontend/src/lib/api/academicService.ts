import api from './client';
import { cachedGet, invalidateApiCache } from './cachedGet';
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

/** Academic dropdown data (years/classes/sections/subjects) rare change hoti hai — mount-par-mount refetch na ho. */
const drop = <T>(url: string) => cachedGet<T>(url, undefined, 600_000);

export const academicService = {
  createYear: async (schoolId: string, data: { name: string; startDate: string; endDate: string }) => {
    const res = await api.post<ApiResponse<AcademicYear>>(`/academic/schools/${schoolId}/academic-years`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  getYear: async (id: string) => {
    const res = await api.get<ApiResponse<AcademicYear>>(`/academic/academic-years/${id}`);
    return res.data.data;
  },
  getYearsBySchool: async (schoolId: string) => drop<AcademicYear[]>(`/academic/schools/${schoolId}/academic-years`),
  updateYear: async (id: string, data: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>) => {
    const res = await api.patch<ApiResponse<AcademicYear>>(`/academic/academic-years/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteYear: async (id: string) => {
    await api.delete(`/academic/academic-years/${id}`);
    invalidateApiCache('/academic/');
  },
  createTerm: async (academicYearId: string, data: { name: string; startDate: string; endDate: string }) => {
    const res = await api.post<ApiResponse<Term>>(`/academic/academic-years/${academicYearId}/terms`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  getTerms: async (academicYearId: string) => drop<Term[]>(`/academic/academic-years/${academicYearId}/terms`),
  updateTerm: async (id: string, data: Partial<{ name: string; startDate: string; endDate: string }>) => {
    const res = await api.patch<ApiResponse<Term>>(`/academic/terms/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteTerm: async (id: string) => {
    await api.delete(`/academic/terms/${id}`);
    invalidateApiCache('/academic/');
  },
  createClass: async (schoolId: string, data: { name: string; code?: string; order: number }) => {
    const res = await api.post<ApiResponse<Class>>(`/academic/schools/${schoolId}/classes`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  getClass: async (id: string) => {
    const res = await api.get<ApiResponse<Class>>(`/academic/classes/${id}`);
    return res.data.data;
  },
  getClassesBySchool: async (schoolId: string) => drop<Class[]>(`/academic/schools/${schoolId}/classes`),
  updateClass: async (id: string, data: Partial<{ name: string; code: string; order: number }>) => {
    const res = await api.patch<ApiResponse<Class>>(`/academic/classes/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteClass: async (id: string) => {
    await api.delete(`/academic/classes/${id}`);
    invalidateApiCache('/academic/');
  },
  createSection: async (classId: string, data: { name: string; capacity?: number; roomNumber?: string }) => {
    const res = await api.post<ApiResponse<Section>>(`/academic/classes/${classId}/sections`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  getSectionsByClass: async (classId: string) => drop<Section[]>(`/academic/classes/${classId}/sections`),
  updateSection: async (id: string, data: Partial<{ name: string; capacity: number; roomNumber: string }>) => {
    const res = await api.patch<ApiResponse<Section>>(`/academic/sections/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteSection: async (id: string) => {
    await api.delete(`/academic/sections/${id}`);
    invalidateApiCache('/academic/');
  },
  getSectionTemplates: async (schoolId: string): Promise<SectionTemplate[]> =>
    drop<SectionTemplate[]>(`/academic/schools/${schoolId}/section-templates`),
  createSectionTemplate: async (schoolId: string, data: { name: string }): Promise<SectionTemplate> => {
    const res = await api.post<ApiResponse<SectionTemplate>>(`/academic/schools/${schoolId}/section-templates`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  updateSectionTemplate: async (id: string, data: Partial<{ name: string }>): Promise<SectionTemplate> => {
    const res = await api.patch<ApiResponse<SectionTemplate>>(`/academic/section-templates/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteSectionTemplate: async (id: string): Promise<void> => {
    await api.delete(`/academic/section-templates/${id}`);
    invalidateApiCache('/academic/');
  },
  createSubject: async (classId: string, data: { name: string; code?: string }) => {
    const res = await api.post<ApiResponse<Subject>>(`/academic/classes/${classId}/subjects`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  getSubjectsByClass: async (classId: string) => drop<Subject[]>(`/academic/classes/${classId}/subjects`),
  updateSubject: async (id: string, data: Partial<{ name: string; code: string }>) => {
    const res = await api.patch<ApiResponse<Subject>>(`/academic/subjects/${id}`, data);
    invalidateApiCache('/academic/');
    return res.data.data;
  },
  deleteSubject: async (id: string) => {
    await api.delete(`/academic/subjects/${id}`);
    invalidateApiCache('/academic/');
  },
};