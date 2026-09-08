'use client';

import { useState } from 'react';
import { Button, Input } from '@/features/shared/components';
import { leaveService } from '@/lib/api/leaveService';
import toast from 'react-hot-toast';

interface Props {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export function LeaveRequestForm({ studentId, studentName, onSuccess }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateFrom || !dateTo) return toast.error('Please select leave dates');
    if (!reason.trim()) return toast.error('Please provide a reason');
    if (new Date(dateTo) < new Date(dateFrom)) return toast.error('End date cannot be before start date');

    setSubmitting(true);
    try {
      await leaveService.requestLeave({
        studentId,
        dateFrom,
        dateTo,
        reason: reason.trim(),
      });
      toast.success('Leave request submitted!');
      setDateFrom('');
      setDateTo('');
      setReason('');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-sm text-primary-700">
        Requesting leave for: <span className="font-semibold">{studentName}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="From Date"
          type="date"
          required
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="To Date"
          type="date"
          required
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Reason *</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/80 resize-none"
          rows={3}
          placeholder="e.g., Family function, medical appointment..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>

      <Button type="submit" loading={submitting}>
        Submit Leave Request
      </Button>
    </form>
  );
}
