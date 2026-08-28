'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalLeaveRequest } from '@/types/portal';
import { useForm, required, composeValidators } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChildInfo { id: string; firstName: string; lastName: string; rollNumber: string }

export default function LeaveForm({ children, onCreated, onCancel }: {
  children: ChildInfo[];
  onCreated: (req: PortalLeaveRequest) => void;
  onCancel: () => void;
}) {
  const [studentId, setStudentId] = useState(children[0]?.id || '');

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { dateFrom: '', dateTo: '', reason: '' },
    validators: {
      dateFrom: required('Start date is required'),
      dateTo: required('End date is required'),
      reason: composeValidators(required('Reason is required')),
    },
    onSubmit: async (v) => {
      if (new Date(v.dateTo as string) < new Date(v.dateFrom as string)) {
        toast.error('End date cannot be before start date');
        return;
      }
      const result = await portalDataService.createLeaveRequest({
        studentId,
        dateFrom: v.dateFrom as string,
        dateTo: v.dateTo as string,
        reason: v.reason as string,
      });
      toast.success('Leave request submitted!');
      onCreated(result);
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {children.length > 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Child</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm">
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} (Roll #{c.rollNumber})</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="From Date" type="date" name="dateFrom" value={values.dateFrom as string} onChange={handleChange} onBlur={() => handleBlur('dateFrom')} error={errors.dateFrom} required />
            <Input label="To Date" type="date" name="dateTo" value={values.dateTo as string} onChange={handleChange} onBlur={() => handleBlur('dateTo')} error={errors.dateTo} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Reason *</label>
            <textarea name="reason"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/80 resize-none"
              rows={3} placeholder="e.g., Family function, medical appointment..."
              value={values.reason as string} onChange={handleChange} onBlur={() => handleBlur('reason')} />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>Submit Request</Button>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
