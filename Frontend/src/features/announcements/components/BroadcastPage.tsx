'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Button, Input } from '@/features/shared/components';
import { useForm, required, minLength } from '@/lib/utils';
import { circularService } from '@/lib/api';
import toast from 'react-hot-toast';

export default function BroadcastPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [lastSent, setLastSent] = useState<string | null>(null);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { title: '', content: '' },
    validators: {
      title: required('Title is required'),
      content: minLength(10, 'Enter at least 10 characters'),
    },
    onSubmit: async (v) => {
      if (!schoolId) {
        toast.error('School information not found');
        return;
      }
      try {
        const res = await circularService.create(schoolId, {
          title: v.title,
          content: v.content,
          audience: 'ALL',
        });
        const notified = res.notifiedParents + res.notifiedStaff;
        setLastSent(`${v.title} — sent to ${notified} recipient(s)`);
        toast.success('Broadcast sent');
      } catch (err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Broadcast failed');
      }
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Broadcast"
        description="Send an immediate announcement to the whole school (parents + teachers)."
      />
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              name="title"
              placeholder="e.g. Urgent Notice"
              value={values.title}
              onChange={handleChange}
              onBlur={() => handleBlur('title')}
              error={errors.title}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
              <textarea
                name="content"
                rows={6}
                placeholder="Type your full message here..."
                className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/80"
                value={values.content}
                onChange={handleChange}
                onBlur={() => handleBlur('content')}
              />
              {errors.content && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.content}</p>}
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Audience: <span className="font-semibold text-slate-700">Whole School</span> — sent to both parents and teachers.
            </div>
            <div className="flex items-center justify-end gap-3">
              {lastSent && <span className="text-xs font-medium text-green-600">{lastSent}</span>}
              <Button type="submit" loading={isSubmitting}>
                Broadcast
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}