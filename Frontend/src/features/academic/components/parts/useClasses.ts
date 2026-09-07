'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService } from '@/lib/api';
import type { Section } from '@/types';
import type { SectionTemplate } from '@/lib/api/academicService';
import type { AssignedSection } from './ClassForm';
import toast from 'react-hot-toast';

export interface ClassRow { id: string; name: string; order: number; sections: Section[]; }
export interface ClassFormValues { name: string; order: string; sections: AssignedSection[]; }

const toCapacity = (v: string) => (v ? Number(v) : undefined);
const toRoom = (v: string) => v || undefined;
const secPayload = (v: AssignedSection) => ({ name: v.name, capacity: toCapacity(v.capacity), roomNumber: toRoom(v.roomNumber) });

export function useClasses() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      // Backend listClassesBySchool includes nested sections+subjects — single request
      const [data, tpls] = await Promise.all([
        academicService.getClassesBySchool(schoolId),
        academicService.getSectionTemplates(schoolId),
      ]);
      setClasses(data.map((c) => ({ id: c.id, name: c.name, order: c.order, sections: c.sections ?? [] })).sort((a, b) => a.order - b.order));
      setTemplates(tpls);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  // ── Optimistic local-state helpers (no full reload) ──────────
  const patchClass = (row: ClassRow) =>
    setClasses((prev) => [...prev.filter((c) => c.id !== row.id), row].sort((a, b) => a.order - b.order));
  const removeClass = (id: string) => setClasses((prev) => prev.filter((c) => c.id !== id));
  const patchSection = (classId: string, s: Section) =>
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, sections: [...c.sections.filter((x) => x.id !== s.id), s].sort((a, b) => a.name.localeCompare(b.name)) } : c))
    );
  const removeSection = (classId: string, sectionId: string) =>
    setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, sections: c.sections.filter((x) => x.id !== sectionId) } : c)));

  const fail = (msg: string) => (e: any) => {
    toast.error(e?.response?.data?.message ?? msg);
    load();
  };
  const createClass = async (v: ClassFormValues) => {
    if (!schoolId) return;
    try {
      const cls = await academicService.createClass(schoolId, { name: v.name, order: Number(v.order) });
      const secs: Section[] = [];
      for (const sec of v.sections) secs.push(await academicService.createSection(cls.id, secPayload(sec)));
      patchClass({ id: cls.id, name: cls.name, order: cls.order, sections: secs });
      setShowForm(false);
      toast.success(v.sections.length > 0 ? 'Class + sections created' : 'Class created');
    } catch (e: any) {
      fail('Failed to create class')(e);
    }
  };

  const updateClass = async (v: ClassFormValues) => {
    if (!editingClass) return;
    const row = editingClass;
    try {
      const cls = await academicService.updateClass(row.id, { name: v.name, order: Number(v.order) });
      const existing = row.sections;
      const kept: Section[] = [];
      for (const sec of v.sections.filter((a) => !existing.some((s) => s.name === a.name))) {
        kept.push(await academicService.createSection(row.id, secPayload(sec)));
      }
      for (const s of existing.filter((s) => !v.sections.some((a) => a.name === s.name))) {
        await academicService.deleteSection(s.id);
      }
      for (const sec of v.sections) {
        const cur = existing.find((s) => s.name === sec.name);
        if (cur) {
          kept.push(
            String(cur.capacity ?? '') !== sec.capacity || (cur.roomNumber ?? '') !== sec.roomNumber
              ? await academicService.updateSection(cur.id, secPayload(sec))
              : cur
          );
        }
      }
      patchClass({ id: cls.id, name: cls.name, order: cls.order, sections: kept.sort((a, b) => a.name.localeCompare(b.name)) });
      setEditingClass(null);
      toast.success('Class updated');
    } catch (e: any) {
      fail('Failed to update class')(e);
    }
  };

  const deleteClass = async (row: ClassRow) => {
    if (!confirm(`Delete class "${row.name}"? This will also remove its sections.`)) return;
    removeClass(row.id);
    try {
      await academicService.deleteClass(row.id);
      toast.success('Class deleted');
    } catch (e: any) {
      fail('Failed to delete class')(e);
    }
  };

  const createSection = async (classId: string, v: AssignedSection) => {
    try {
      patchSection(classId, await academicService.createSection(classId, secPayload(v)));
      toast.success('Section added');
    } catch (e: any) {
      fail('Failed to add section')(e);
    }
  };

  const updateSection = async (id: string, v: AssignedSection) => {
    const classId = classes.find((c) => c.sections.some((s) => s.id === id))?.id;
    if (!classId) return;
    try {
      patchSection(classId, await academicService.updateSection(id, secPayload(v)));
      toast.success('Section updated');
    } catch (e: any) {
      fail('Failed to update section')(e);
    }
  };

  const deleteSection = async (id: string, name: string) => {
    const classId = classes.find((c) => c.sections.some((s) => s.id === id))?.id;
    if (!classId) return;
    if (!confirm(`Delete section "${name}"?`)) return;
    removeSection(classId, id);
    try {
      await academicService.deleteSection(id);
      toast.success('Section deleted');
    } catch (e: any) {
      fail('Failed to delete section')(e);
    }
  };

  return { classes, templates, loading, showForm, editingClass, setShowForm, setEditingClass, createClass, updateClass, deleteClass, createSection, updateSection, deleteSection, reload: load };
}
