'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { admissionService, academicService } from '@/lib/api';
import { useForm, composeValidators, required, isEmail, isPhonePK } from '@/lib/utils';
import type { Applicant } from '@/types';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface EditApplicantModalProps {
  applicant: Applicant;
  onClose: () => void;
  onSaved: (applicant: Applicant) => void;
}

export default function EditApplicantModal({ applicant, onClose, onSaved }: EditApplicantModalProps) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  // Approval first, fee later — advance fee is only editable after APPROVED/FEE_PENDING.
  const feeEditable = applicant.status === 'APPROVED' || applicant.status === 'FEE_PENDING';

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      classId: applicant.classId ?? '',
      firstName: applicant.firstName ?? '',
      lastName: applicant.lastName ?? '',
      gender: applicant.gender ?? '',
      dob: applicant.dob ? applicant.dob.slice(0, 10) : '',
      parentName: applicant.parentName ?? '',
      parentPhone: applicant.parentPhone ?? '',
      parentWhatsappNo: applicant.parentWhatsappNo ?? '',
      parentEmail: applicant.parentEmail ?? '',
      parentAddress: applicant.parentAddress ?? '',
      advanceFeeAmount: applicant.advanceFeeAmount != null ? String(applicant.advanceFeeAmount) : '',
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
      try {
        const updated = await admissionService.update(applicant.id, {
          classId: v.classId as string,
          firstName: v.firstName as string,
          lastName: v.lastName as string,
          gender: (v.gender as string) || undefined,
          dob: (v.dob as string) || undefined,
          parentName: v.parentName as string,
          parentPhone: v.parentPhone as string,
          parentWhatsappNo: v.parentWhatsappNo as string,
          parentEmail: (v.parentEmail as string) || undefined,
          parentAddress: (v.parentAddress as string) || undefined,
          ...(feeEditable ? { advanceFeeAmount: v.advanceFeeAmount ? Number(v.advanceFeeAmount) : undefined } : {}),
        });
        toast.success('Applicant updated');
        onSaved(updated);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update applicant');
      }
    },
  });

  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId).then(setClasses).catch(() => setClasses([]));
  }, [schoolId]);

  return (
    <Modal open onClose={onClose} title={`Edit — ${applicant.firstName} ${applicant.lastName}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" name="firstName" value={values.firstName as string} onChange={handleChange} onBlur={() => handleBlur('firstName')} error={errors.firstName} required />
          <Input label="Last Name" name="lastName" value={values.lastName as string} onChange={handleChange} onBlur={() => handleBlur('lastName')} error={errors.lastName} required />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth" name="dob" type="date" value={values.dob as string} onChange={handleChange} />
          {feeEditable && (
            <Input label="Advance Fee Amount (PKR)" name="advanceFeeAmount" type="number" placeholder="e.g. 20000" value={values.advanceFeeAmount as string} onChange={handleChange} />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Parent Name" name="parentName" value={values.parentName as string} onChange={handleChange} onBlur={() => handleBlur('parentName')} error={errors.parentName} required />
          <Input label="Parent Phone" name="parentPhone" value={values.parentPhone as string} onChange={handleChange} onBlur={() => handleBlur('parentPhone')} error={errors.parentPhone} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Parent Phone" name="parentWhatsappNo" value={values.parentWhatsappNo as string} onChange={handleChange} onBlur={() => handleBlur('parentWhatsappNo')} error={errors.parentWhatsappNo} required />
          <Input label="Parent Email" name="parentEmail" type="email" value={values.parentEmail as string} onChange={handleChange} onBlur={() => handleBlur('parentEmail')} error={errors.parentEmail} />
        </div>
        <Input label="Address" name="parentAddress" value={values.parentAddress as string} onChange={handleChange} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
