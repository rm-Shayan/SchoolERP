'use client';

import { useState, useCallback, useEffect } from 'react';
import { notificationService, orgService, schoolService } from '@/lib/api';
import { Button, Card } from '@/features/shared/components';
import toast from 'react-hot-toast';
import type { Organization, School } from '@/types';

interface Props { onSent?: () => void; }

const CATEGORIES = ['GENERAL', 'PTM', 'HOMEWORK', 'EXAM', 'STAFF', 'STUDENT', 'FEE', 'CIRCULAR'];

export default function SendNotificationForm({ onSent }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [recipientType, setRecipientType] = useState<'all' | 'org' | 'school'>('all');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [sending, setSending] = useState(false);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  useEffect(() => {
    setOrgsLoading(true);
    orgService.getAll().then(setOrgs).catch(() => setOrgs([])).finally(() => setOrgsLoading(false));
  }, []);

  useEffect(() => {
    if (recipientType === 'all' || !selectedOrgId) {
      setSchools([]);
      setSelectedSchoolId('');
      return;
    }
    setSchoolsLoading(true);
    schoolService.getAll(selectedOrgId).then(setSchools).catch(() => setSchools([])).finally(() => setSchoolsLoading(false));
    setSelectedSchoolId('');
  }, [recipientType, selectedOrgId]);

  const handleSend = useCallback(async () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      const payload: Record<string, string> = { title, body, category };
      if (recipientType === 'org' && selectedOrgId) payload.organizationId = selectedOrgId;
      if (recipientType === 'school' && selectedSchoolId) payload.schoolId = selectedSchoolId;
      const result = await notificationService.sendFromSuperAdmin(payload as any);
      const count = (result as any)?.count || 'all';
      toast.success(`Notification sent to ${count} admin(s)`);
      setTitle(''); setBody(''); setSelectedOrgId(''); setSelectedSchoolId('');
      onSent?.();
    } catch { toast.error('Failed to send'); }
    setSending(false);
  }, [title, body, category, recipientType, selectedOrgId, selectedSchoolId, onSent]);

  return (
    <Card className="p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Send Announcement to Admins</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
          <select value={recipientType} onChange={(e) => setRecipientType(e.target.value as 'all' | 'org' | 'school')} className="w-full text-sm border rounded-lg px-3 py-2">
            <option value="all">All Organizations</option>
            <option value="org">Specific Organization</option>
            <option value="school">Specific Branch</option>
          </select>
        </div>

        {recipientType === 'org' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Organization</label>
            <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" disabled={orgsLoading}>
              <option value="">{orgsLoading ? 'Loading…' : 'Select organization'}</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
        )}

        {recipientType === 'school' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Organization</label>
              <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" disabled={orgsLoading}>
                <option value="">{orgsLoading ? 'Loading…' : 'Select organization first'}</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
              <select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" disabled={!selectedOrgId || schoolsLoading}>
                <option value="">{!selectedOrgId ? 'Select org first' : schoolsLoading ? 'Loading…' : 'Select branch'}</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </>
        )}
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
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write the announcement message..." className="w-full text-sm border rounded-lg px-3 py-2 resize-none" />
      </div>

      <Button onClick={handleSend} loading={sending} disabled={!title.trim() || !body.trim()}>
        Send Notification
      </Button>
    </Card>
  );
}
