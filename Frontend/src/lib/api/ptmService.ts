import api from './client';
import { cached, invalidate } from './serviceCache';
import type { ApiResponse } from '@/types';

export type PTMScope = 'WHOLE_SCHOOL' | 'CLASS_RANGE' | 'SECTIONS' | 'STUDENT';

export interface PTMTeacher { id: string; name: string; }

export interface PTMEvent {
  id: string; schoolId: string; title: string; description?: string | null;
  scheduledAt: string; venue?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scope: PTMScope; scopeLabel?: string;
  classIds: string[]; sectionIds: string[]; studentId?: string | null;
  teachers: PTMTeacher[]; createdAt: string;
}

export interface PTMPayload {
  title: string; description?: string; scheduledAt: string; venue?: string;
  scope: PTMScope; classFromId?: string; classToId?: string;
  sectionIds?: string[]; studentId?: string; teacherIds?: string[];
}

function toBody(d: PTMPayload): Record<string, unknown> {
  return {
    title: d.title, description: d.description, scheduledAt: d.scheduledAt,
    location: d.venue, scope: d.scope,
    classFromId: d.classFromId || undefined, classToId: d.classToId || undefined,
    sectionIds: d.sectionIds?.length ? d.sectionIds : undefined,
    studentId: d.studentId || undefined, teacherIds: d.teacherIds ?? [],
  };
}

const CACHE_TTL = 10_000;

export const ptmService = {
  create: async (schoolId: string, data: PTMPayload): Promise<PTMEvent> => {
    const res = await api.post<ApiResponse<{ session: PTMEvent }>>(`/ptm/schools/${schoolId}`, toBody(data));
    invalidate(`ptm:${schoolId}`);
    return res.data.data.session;
  },

  getBySchool: async (schoolId: string): Promise<PTMEvent[]> => {
    return cached(`ptm:${schoolId}`, CACHE_TTL, async () => {
      const res = await api.get<ApiResponse<{ items: PTMEvent[] }>>(`/ptm/schools/${schoolId}`);
      return res.data.data.items;
    });
  },

  getById: async (id: string): Promise<PTMEvent> => {
    const res = await api.get<ApiResponse<PTMEvent>>(`/ptm/${id}`);
    return res.data.data;
  },

  update: async (id: string, data: Partial<PTMPayload> & { status?: PTMEvent['status'] }): Promise<PTMEvent> => {
    const body = { ...toBody(data as PTMPayload), status: data.status };
    const res = await api.patch<ApiResponse<PTMEvent>>(`/ptm/${id}`, body);
    invalidate('ptm:');
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/ptm/${id}`);
    invalidate('ptm:');
  },
};
