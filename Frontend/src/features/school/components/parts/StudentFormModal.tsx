'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@/features/shared/components';
import { useForm, required } from '@/lib/utils';
import type { Class, Student } from '@/types';
import { StudentBasicFields } from './StudentBasicFields';
import { StudentParentFields } from './StudentParentFields';
import { StudentPhotoField } from './StudentPhotoField';

export interface StudentFormValues {
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender: string;
  dob: string;
  classId: string;
  sectionId: string;
  parentName: string;
  parentWhatsappNo: string;
  parentPhone: string;
  parentEmail: string;
  parentAddress: string;
}

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  classes: Class[];
  mode: 'create' | 'edit';
  student?: Student | null;
  onSubmit: (values: StudentFormValues, photoFile?: File | null) => Promise<boolean>;
}

const EMPTY: StudentFormValues = {
  firstName: '', lastName: '', rollNumber: '', gender: '', dob: '',
  classId: '', sectionId: '',
  parentName: '', parentWhatsappNo: '', parentPhone: '', parentEmail: '', parentAddress: '',
};

function toValues(student: Student): StudentFormValues {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    rollNumber: student.rollNumber,
    gender: student.gender ?? '',
    dob: student.dob ?? '',
    classId: student.section?.classId ?? '',
    sectionId: student.sectionId,
    parentName: student.parent?.name ?? '',
    parentWhatsappNo: student.parent?.whatsappNo ?? '',
    parentPhone: student.parent?.phone ?? '',
    parentEmail: student.parent?.email ?? '',
    parentAddress: student.parent?.address ?? '',
  };
}

export function StudentFormModal({ open, onClose, classes, mode, student, onSubmit }: StudentFormModalProps) {
  const isEdit = mode === 'edit';
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const initial = useMemo(() => (student ? toValues(student) : EMPTY), [student]);

  const { values, errors, isSubmitting, setValue, handleSubmit, reset } = useForm<StudentFormValues>({
    initialValues: initial,
    validators: {
      firstName: required('First name is required'),
      lastName: required('Last name is required'),
      rollNumber: required('Roll number is required'),
      classId: required('Please select a class'),
      sectionId: required('Please select a section'),
      parentName: required('Parent name is required'),
      parentWhatsappNo: isEdit ? undefined : required('Phone number is required'),
    },
    onSubmit: async (vals) => {
      const ok = await onSubmit(vals, photoFile);
      if (ok) {
        reset();
        setPhotoFile(null);
        onClose();
      }
    },
  });

  // Reset to the (freshly keyed) student's values every time the modal opens.
  useEffect(() => {
    if (open) { reset(); setPhotoFile(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit Student — ${student?.firstName ?? ''} ${student?.lastName ?? ''}` : 'Add Student'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <StudentPhotoField value={student?.imageUrl} onFile={setPhotoFile} />
        </div>
        <StudentBasicFields values={values} errors={errors} classes={classes} setValue={setValue} />
        <StudentParentFields
          values={values}
          errors={errors}
          isEdit={isEdit}
          setValue={(name, value) => setValue(name, value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Student'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
