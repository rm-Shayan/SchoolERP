'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { admissionService, academicService } from '@/lib/api';
import { useForm, composeValidators, required, isEmail, isPhonePK } from '@/lib/utils';
import type { Applicant } from '@/types';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (applicant: Applicant) => void;
}

export default function InquiryModal({ open, onClose, onCreated }: InquiryModalProps) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: {
      classId: '',
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      parentName: '',
      parentPhone: '',
      parentWhatsappNo: '',
      parentEmail: '',
      address: '',
    },
    validators: {
      firstName: required('First name is required'),
      lastName: required('Last name is required'),
      classId: required('Select a class'),
      parentName: required('Parent name is required'),
      parentPhone: composeValidators(required('Parent phone is required'), isPhonePK()),
      parentWhatsappNo: composeValidators(required('Phone number is required'), isPhonePK()),
      parentEmail: isEmail(),
    },
    onSubmit: async (v) => {
      if (!schoolId) return;
      try {
        const applicant = await admissionService.create(schoolId, {
          classId: v.classId as string,
          firstName: v.firstName as string,
          lastName: v.lastName as string,
          gender: (v.gender as string) || undefined,
          dob: (v.dob as string) || undefined,
          parentName: v.parentName as string,
          parentPhone: v.parentPhone as string,
          parentWhatsappNo: v.parentWhatsappNo as string,
          parentEmail: (v.parentEmail as string) || undefined,
          parentAddress: (v.address as string) || undefined,
        });
        toast.success('Inquiry registered successfully');
        reset();
        onCreated(applicant);
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to register inquiry');
      }
    },
  });

  useEffect(() => {
    if (!open || !schoolId) return;
    (async () => {
      try {
        setClasses(await academicService.getClassesBySchool(schoolId));
      } catch {
        setClasses([]);
      }
    })();
  }, [open, schoolId]);

  return (
    <Modal open={open} onClose={onClose} title="New Admission Inquiry" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" name="firstName" placeholder="e.g. Ali" value={values.firstName as string} onChange={handleChange} onBlur={() => handleBlur('firstName')} error={errors.firstName} required />
          <Input label="Last Name" name="lastName" placeholder="e.g. Khan" value={values.lastName as string} onChange={handleChange} onBlur={() => handleBlur('lastName')} error={errors.lastName} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class"
            name="classId"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
            value={values.classId as string}
            onChange={handleChange}
            onBlur={() => handleBlur('classId')}
            error={errors.classId}
            required
          />
          <Select
            label="Gender"
            name="gender"
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ]}
            placeholder="Select gender"
            value={values.gender as string}
            onChange={handleChange}
          />
        </div>
        <Input label="Date of Birth" name="dob" type="date" value={values.dob as string} onChange={handleChange} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Parent Name" name="parentName" placeholder="Full name" value={values.parentName as string} onChange={handleChange} onBlur={() => handleBlur('parentName')} error={errors.parentName} required />
          <Input label="Parent Phone" name="parentPhone" placeholder="0300 1234567" value={values.parentPhone as string} onChange={handleChange} onBlur={() => handleBlur('parentPhone')} error={errors.parentPhone} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Parent Phone" name="parentWhatsappNo" placeholder="0300 1234567" value={values.parentWhatsappNo as string} onChange={handleChange} onBlur={() => handleBlur('parentWhatsappNo')} error={errors.parentWhatsappNo} required />
          <Input label="Parent Email" name="parentEmail" type="email" placeholder="parent@example.com" value={values.parentEmail as string} onChange={handleChange} onBlur={() => handleBlur('parentEmail')} error={errors.parentEmail} />
        </div>
        <Input label="Address" name="address" placeholder="Home address" value={values.address as string} onChange={handleChange} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Register Inquiry</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
