import { academicService } from '@/lib/api';
import toast from 'react-hot-toast';

export interface SectionFormValues {
  name: string;
  capacity: string;
  roomNumber: string;
}

/**
 * Per-class Section CRUD (for ClassCard's Add/Edit/Delete section buttons).
 * `onChanged` = list reload callback so the UI refreshes after a change.
 */
export function useSections(onChanged: () => void) {
  const createSection = async (classId: string, v: SectionFormValues) => {
    try {
      await academicService.createSection(classId, {
        name: v.name,
        capacity: v.capacity ? Number(v.capacity) : undefined,
        roomNumber: v.roomNumber || undefined,
      });
      toast.success('Section added');
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add section');
    }
  };

  const updateSection = async (id: string, v: SectionFormValues) => {
    try {
      await academicService.updateSection(id, {
        name: v.name,
        capacity: v.capacity ? Number(v.capacity) : undefined,
        roomNumber: v.roomNumber || undefined,
      });
      toast.success('Section updated');
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update section');
    }
  };

  const deleteSection = async (id: string, name: string) => {
    if (!confirm(`Delete section "${name}" from this class?`)) return;
    try {
      await academicService.deleteSection(id);
      toast.success('Section removed');
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete section');
    }
  };

  return { createSection, updateSection, deleteSection };
}
