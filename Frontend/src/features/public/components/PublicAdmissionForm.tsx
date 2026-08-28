'use client';

import { useEffect, useState } from 'react';
import { admissionService } from '@/lib/api';
import type { OrgPublicData } from '@/lib/api/orgService';
import { Button, Input, Select } from '@/features/shared/components';
import { isEmail, isPhonePK, required, useForm } from '@/lib/utils';

interface PublicAdmissionFormProps {
  org: OrgPublicData;
  onSubmitted: () => void;
}

export default function PublicAdmissionForm({ org, onSubmitted }: PublicAdmissionFormProps) {
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([]);
  const [classError, setClassError] = useState('');

  const { values, errors, isSubmitting, setValue, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      schoolId: '', classId: '', firstName: '', lastName: '', gender: '', dob: '',
      parentName: '', parentPhone: '', parentWhatsappNo: '', parentEmail: '', parentAddress: '',
    },
    validators: {
      schoolId: required('Please select a branch'),
      classId: required('Please select a class'),
      firstName: required('First name is required'),
      lastName: required('Last name is required'),
      parentName: required('Parent name is required'),
      parentWhatsappNo: required('Parent Phone number is required'),
      parentEmail: isEmail(),
      parentPhone: isPhonePK(),
    },
    onSubmit: async (v) => {
      setClassError('');
      if (!v.schoolId) return setClassError('Please select a branch first');
      if (!v.classId) return setClassError('Please select a class');
      await admissionService.submitPublicInquiry({
        schoolId: v.schoolId as string,
        classId: v.classId as string,
        firstName: (v.firstName as string).trim(),
        lastName: (v.lastName as string).trim(),
        gender: (v.gender as string) || undefined,
        dob: (v.dob as string) || undefined,
        parentName: (v.parentName as string).trim(),
        parentPhone: (v.parentPhone as string).trim() || undefined,
        parentWhatsappNo: (v.parentWhatsappNo as string).trim(),
        parentEmail: (v.parentEmail as string).trim() || undefined,
        parentAddress: (v.parentAddress as string).trim() || undefined,
      });
      onSubmitted();
    },
  });

  // Branch change → classes fetch (public endpoint)
  useEffect(() => {
    const schoolId = values.schoolId as string;
    if (!schoolId) {
      setClasses([]);
      setValue('classId', '');
      return;
    }
    let alive = true;
    (async () => {
      try {
        const list = await admissionService.getPublicClasses(schoolId);
        if (alive) setClasses(list.map((c) => ({ value: c.id, label: c.name })));
      } catch {
        if (alive) setClasses([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [values.schoolId, setValue]);

  const branchOptions = org.branches.map((b) => ({ value: b.id, label: b.name }));

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-gray-900">Admission Inquiry</h2>
      <p className="mt-1 text-sm text-gray-500">
        Select the branch and class, then fill in the student and parent details. Once you
        submit the form, the school office will be notified immediately.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Select label="Branch" placeholder="Select branch" name="schoolId" options={branchOptions} value={values.schoolId as string} onChange={(e) => setValue('schoolId', e.target.value)} error={errors.schoolId} required />
        <Select label="Class" placeholder={values.schoolId ? 'Select class' : 'Select branch first'} name="classId" options={classes} value={values.classId as string} onChange={(e) => setValue('classId', e.target.value)} error={errors.classId || classError} required />
        <Input label="Student First Name" name="firstName" value={values.firstName as string} onChange={handleChange} onBlur={() => handleBlur('firstName')} error={errors.firstName} required />
        <Input label="Student Last Name" name="lastName" value={values.lastName as string} onChange={handleChange} onBlur={() => handleBlur('lastName')} error={errors.lastName} required />
        <Select label="Gender (optional)" placeholder="Select gender" name="gender" options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} value={values.gender as string} onChange={(e) => setValue('gender', e.target.value)} />
        <Input label="Date of Birth (optional)" type="date" name="dob" value={values.dob as string} onChange={handleChange} />
      </div>
      <div className="mt-6 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Parent / Guardian</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Input label="Parent Name" name="parentName" value={values.parentName as string} onChange={handleChange} onBlur={() => handleBlur('parentName')} error={errors.parentName} required />
          <Input label="Phone Number" placeholder="e.g. 03001234567" name="parentWhatsappNo" value={values.parentWhatsappNo as string} onChange={handleChange} onBlur={() => handleBlur('parentWhatsappNo')} error={errors.parentWhatsappNo} required />
          <Input label="Phone (optional)" placeholder="e.g. 021-111222333" name="parentPhone" value={values.parentPhone as string} onChange={handleChange} onBlur={() => handleBlur('parentPhone')} error={errors.parentPhone} />
          <Input label="Email (optional)" type="email" placeholder="parent@example.com" name="parentEmail" value={values.parentEmail as string} onChange={handleChange} onBlur={() => handleBlur('parentEmail')} error={errors.parentEmail} />
          <div className="sm:col-span-2">
            <Input label="Address (optional)" name="parentAddress" value={values.parentAddress as string} onChange={handleChange} />
          </div>
        </div>
      </div>
      <Button type="submit" loading={isSubmitting} className="mt-7 w-full" size="lg" themeColor={org.themeColor}>
        Submit Inquiry
      </Button>
    </form>
  );
}
