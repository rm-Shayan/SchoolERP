'use client';

import { useState, useCallback } from 'react';
import { notificationService } from '@/lib/api';
import { Button, Card } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface Props { onSent?: () => void; }

const CATEGORIES = ['GENERAL', 'PTM', 'HOMEWORK', 'EXAM', 'STAFF', 'STUDENT', 'FEE', 'CIRCULAR'];

export default function SendNotificationForm({ onSent }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [recipientType, setRecipientType] = useState<'org' | 'school'>('org');
  const [recipientId, setRecipientId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      await notificationService.sendFromSuperAdmin({
        [recipientType === 'org' ? 'organizationId' : 'schoolId']: recipientId || undefined,
        title, body, category,
      });
      toast.success('Notification sent');
      setTitle(''); setBody(''); setRecipientId('');
      onSent?.();
    } catch { toast.error('Failed to send'); }
    setSending(false);
  }, [title, body, category, recipientType, recipientId, onSent]);

  return (
    <Card className="p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Send Notification to Org Admin</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Type</label>
          <select value={recipientType} onChange={(e) => setRecipientType(e.target.value as 'org' | 'school')} className="w-full text-sm border rounded-lg px-3 py-2">
            <option value="org">Organization (all admins)</option>
            <option value="school">Specific Branch</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{recipientType === 'org' ? 'Organization ID' : 'School/Branch ID'}</label>
          <input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Leave empty = all" className="w-full text-sm border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. System Maintenance" className="w-full text-sm border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write the notification message..." className="w-full text-sm border rounded-lg px-3 py-2 resize-none" />
      </div>

      <Button onClick={handleSend} loading={sending} disabled={!title.trim() || !body.trim()}>
        Send Notification
      </Button>
    </Card>
  );
}
