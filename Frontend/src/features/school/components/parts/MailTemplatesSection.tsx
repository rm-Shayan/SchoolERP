'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';
import { emailTemplatesService } from '@/lib/api/emailTemplatesService';
import type { EmailTemplateMeta } from '@/types/emailTemplates';
import MailTemplateEditor from './MailTemplateEditor';

const CHIP = 'rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500';

export default function MailTemplatesSection() {
  const { user } = useAppSelector((s) => s.auth);
  const organizationId = user?.organizationId ?? null;
  const canEdit = user?.role === 'SUPER_ADMIN' || (user?.role === 'ADMIN' && user?.isOrganizationOwner === true);
  const [templates, setTemplates] = useState<EmailTemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    try {
      const res = await emailTemplatesService.list(organizationId);
      setTemplates(res.templates);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load mail templates');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-slate-800">Mail Templates</h3>
        {!canEdit && (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Only the organization owner can customize these
          </span>
        )}
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Customize the subject &amp; body of emails your branches send. Leave a field empty to keep the
        built-in branded layout.
      </p>

      {loading && <p className="text-sm text-slate-400">Loading templates…</p>}
      {!loading && templates.length === 0 && <p className="text-sm text-slate-400">No templates found.</p>}

      {templates.map((t) => (
        <div key={t.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setOpenKey((k) => (k === t.key ? null : t.key))}
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{t.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
            </div>
            {t.isCustomized ? (
              <span className={CHIP}>Customized</span>
            ) : (
              <span className={CHIP}>Default</span>
            )}
            <span className="text-xs font-bold text-primary-600">{openKey === t.key ? '▲' : '▼'}</span>
          </button>
          {openKey === t.key && canEdit && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
              <MailTemplateEditor template={t} organizationId={organizationId} onSaved={load} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}