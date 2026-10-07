'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { emailTemplatesService } from '@/lib/api/emailTemplatesService';
import type { EmailTemplateMeta, EmailTemplatePreviewResult } from '@/types/emailTemplates';

interface Props {
  template: EmailTemplateMeta;
  organizationId: string | null;
  onSaved: () => void;
}

export default function MailTemplateEditor({ template, organizationId, onSaved }: Props) {
  const [subject, setSubject] = useState(template.subject ?? '');
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml ?? '');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<EmailTemplatePreviewResult | null>(null);
  const [target, setTarget] = useState<'subject' | 'body'>('body');

  const insertPlaceholder = (ph: string) => {
    const token = `{{${ph}}}`;
    if (target === 'subject') setSubject((s) => `${s}${token}`);
    else setBodyHtml((s) => `${s}\n${token}`);
  };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      setPreview(await emailTemplatesService.preview(organizationId, template.key, undefined, subject, bodyHtml));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const onSave = async () => {
    if (!subject.trim() && !bodyHtml.trim()) {
      toast.error('Provide a subject, a body, or both');
      return;
    }
    setSaving(true);
    try {
      await emailTemplatesService.save(organizationId, template.key, { subject, bodyHtml });
      toast.success('Template saved');
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    setSaving(true);
    try {
      await emailTemplatesService.reset(organizationId, template.key);
      setSubject('');
      setBodyHtml('');
      setPreview(null);
      toast.success('Template reset to default');
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">INSERT PLACEHOLDERS INTO</p>
          <select value={target} onChange={(e) => setTarget(e.target.value as 'subject' | 'body')}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="subject">Subject</option>
            <option value="body">Body</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {template.placeholders.map((ph) => (
            <button key={ph} type="button" onClick={() => insertPlaceholder(ph)}
              className="rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 hover:bg-primary-100">
              {'{{'}{ph}{'}}'}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Subject</span>
          <input className={inputCls} value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={template.defaultSubject} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Body (HTML)</span>
          <textarea className={`${inputCls} h-48 font-mono text-xs`} value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder={'Empty = built-in branded layout stays'} />
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSave} disabled={saving}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Template'}
          </button>
          <button type="button" onClick={runPreview} disabled={previewing}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {previewing ? 'Rendering…' : 'Preview'}
          </button>
          <button type="button" onClick={onReset} disabled={saving}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
            Reset to Default
          </button>
        </div>
      </div>

      {preview && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500">PREVIEW (sample data)</p>
          <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold">Subject:</span> {preview.renderedSubject || preview.defaultSubject}
          </p>
          <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Default subject: {preview.defaultSubject}
          </p>
          {preview.renderedBody ? (
            <div className="max-h-96 overflow-auto rounded-md border border-slate-200 bg-white"
              dangerouslySetInnerHTML={{ __html: preview.renderedBody }} />
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">
              Body override empty — the built-in branded layout will be used.
            </p>
          )}
        </div>
      )}
    </div>
  );
}