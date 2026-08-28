'use client';

import { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Select } from '@/features/shared/components';
import { timetableService, academicService, staffService, teachingAssignmentService } from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import type { TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import { useForm, required } from '@/lib/utils';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Props {
  open: boolean;
  sectionId: string;
  schoolId?: string;
  editing?: TimetableSlot | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TimetableSlotModal({ open, sectionId, schoolId, editing, onClose, onSaved }: Props) {
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(editing?.teacherId || '');

  useEffect(() => {
    if (!open || !schoolId) return;
    // Load subjects for this section's class (subjects are linked at class level)
    academicService.getClassesBySchool(schoolId).then((classes) => {
      for (const c of classes) {
        if (c.sections?.some((s) => s.id === sectionId)) {
          setAllSubjects(c.subjects || []);
          break;
        }
      }
    }).catch(() => {});
    // Load teachers
    staffService.getAll({ role: 'TEACHER', pageSize: 200 }).then((r) => {
      setTeachers(r.items.map((u) => ({ id: u.id, name: u.name })));
    }).catch(() => {});
  }, [open, sectionId]);

  // When teacher changes, fetch their teaching assignments for this class
  useEffect(() => {
    if (!selectedTeacherId || !schoolId) { setAssignments([]); return; }
    teachingAssignmentService.list(schoolId, { teacherId: selectedTeacherId })
      .then(setAssignments).catch(() => setAssignments([]));
  }, [selectedTeacherId, schoolId]);

  // Filter subjects: show assigned subjects first, then others
  const subjects = useMemo(() => {
    if (!assignments.length) return allSubjects; // no assignments = show all (fallback)
    const assignedIds = new Set(assignments.filter((a) => a.subjectId).map((a) => a.subjectId!));
    if (assignedIds.size === 0) return allSubjects; // teacher has class-level assignment, no specific subject
    const assigned = allSubjects.filter((s) => assignedIds.has(s.id));
    const others = allSubjects.filter((s) => !assignedIds.has(s.id));
    return [...assigned, ...others];
  }, [allSubjects, assignments]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      subjectId: editing?.subjectId || '',
      teacherId: editing?.teacherId || '',
      dayOfWeek: String(editing?.dayOfWeek ?? 1),
      startTime: editing?.startTime || '08:00',
      endTime: editing?.endTime || '08:45',
    },
    validators: {
      subjectId: required('Subject is required'),
      teacherId: required('Teacher is required'),
      startTime: required('Start time is required'),
      endTime: (value: unknown, all: Record<string, unknown>) => {
        const val = String(value || '');
        if (!val) return 'End time is required';
        if (all.startTime && val <= String(all.startTime)) return 'End time must be after start time';
        return undefined;
      },
    },
    onSubmit: async (v) => {
      const payload = {
        subjectId: v.subjectId as string,
        teacherId: v.teacherId as string,
        dayOfWeek: Number(v.dayOfWeek),
        startTime: v.startTime as string,
        endTime: v.endTime as string,
      };
      try {
        if (editing) {
          await timetableService.updateSlot(editing.id, payload);
          toast.success('Slot updated');
        } else {
          await timetableService.createSlot(sectionId, payload);
          toast.success('Slot created');
        }
        onSaved();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to save slot');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Slot' : 'Add Slot'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Subject" name="subjectId" value={values.subjectId as string} onChange={handleChange} onBlur={() => handleBlur('subjectId')} error={errors.subjectId}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" required />
        <Select label="Teacher" name="teacherId" value={values.teacherId as string}
          onChange={(e) => { handleChange(e); setSelectedTeacherId(e.target.value); }}
          onBlur={() => handleBlur('teacherId')} error={errors.teacherId}
          options={teachers.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select teacher" required />
        <Select label="Day" name="dayOfWeek" value={values.dayOfWeek as string} onChange={handleChange}
          options={DAYS.map((d, i) => ({ value: String(i + 1), label: d }))} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Start Time</label>
            <input type="time" name="startTime" value={values.startTime as string} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">End Time</label>
            <input type="time" name="endTime" value={values.endTime as string} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={isSubmitting}>{editing ? 'Update' : 'Create'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
