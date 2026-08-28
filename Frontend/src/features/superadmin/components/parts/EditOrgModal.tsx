'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button, Input, Modal } from '@/features/shared/components';
import SocialLinksFields from './SocialLinksFields';
import BankFields from './BankFields';
import OrgLogoField from './OrgLogoField';
import { composeValidators, isOrgCode, required, useForm } from '@/lib/utils';
import type { Organization } from '@/types';
import type { EditOrgFormValues } from './helpers';

interface EditOrgModalProps {
  open: boolean;
  org: Organization | null;
  onClose: () => void;
  onSave: (values: EditOrgFormValues) => Promise<boolean>;
}

const SECTIONS = ['basic', 'contact', 'social', 'bank'] as const;
type SectionKey = (typeof SECTIONS)[number];

function SectionToggle({ label, icon, open, onToggle }: {
  label: string; icon: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl transition-colors text-left">
      <span className="text-primary-500">{icon}</span>
      <span className="text-sm font-semibold text-gray-800 flex-1">{label}</span>
      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export default function EditOrgModal({ open, org, onClose, onSave }: EditOrgModalProps) {
  const hasBank = Boolean(org?.bankName || org?.bankAccountTitle || org?.bankAccountNumber);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    basic: true, contact: false, social: false, bank: hasBank,
  });
  const toggle = useCallback((k: SectionKey) =>
    setOpenSections((p) => ({ ...p, [k]: !p[k] })), []);

  const initial = useMemo(() => ({
    name: org?.name ?? '', code: org?.code ?? '', logoUrl: org?.logoUrl ?? '',
    themeColor: org?.themeColor ?? '#2563eb', adminUsername: org?.adminUsername ?? '',
    phone: org?.phone ?? '', email: org?.email ?? '', website: org?.website ?? '',
    facebookUrl: org?.facebookUrl ?? '', instagramUrl: org?.instagramUrl ?? '',
    twitterUrl: org?.twitterUrl ?? '', youtubeUrl: org?.youtubeUrl ?? '',
    bankName: org?.bankName ?? '', bankAccountTitle: org?.bankAccountTitle ?? '',
    bankAccountNumber: org?.bankAccountNumber ?? '',
  }), [org]);

  const { values, errors, isSubmitting, setValue, handleChange, handleSubmit, reset } = useForm<EditOrgFormValues>({
    initialValues: initial,
    validators: {
      name: required('Organization name is required'),
      code: composeValidators(required('Code is required'), isOrgCode()),
    },
    onSubmit: async (v) => { const ok = await onSave(v); if (ok) onClose(); },
  });

  useEffect(() => { if (open) { reset(); setOpenSections({ basic: true, contact: false, social: false, bank: hasBank }); } }, [open, reset, hasBank]);

  const svgCls = 'w-4 h-4';
  return (
    <Modal open={open} onClose={onClose} title="Edit Organization" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[78vh]">
        <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
          {/* ── Basic Info ── */}
          <div className="rounded-xl border border-gray-200/70 overflow-hidden">
            <SectionToggle label="Basic Information" open={openSections.basic} onToggle={() => toggle('basic')}
              icon={<svg className={svgCls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>} />
            {openSections.basic && (
              <div className="px-4 pb-4 space-y-4 pt-1">
                <Input label="Organization Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Code" name="code" value={values.code} onChange={handleChange} error={errors.code} required />
                  <Input label="Admin Username" name="adminUsername" placeholder="e.g. admin_001" value={values.adminUsername} onChange={handleChange} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" name="themeColor" value={values.themeColor || '#2563eb'} onChange={handleChange}
                    className="h-11 w-11 rounded-xl border border-gray-200 cursor-pointer bg-white p-1 shadow-sm" aria-label="Brand color" />
                  <div className="flex-1"><Input label="Brand Color" name="themeColor" placeholder="#2563eb" value={values.themeColor} onChange={handleChange} /></div>
                </div>
                <OrgLogoField name={values.name} logoUrl={values.logoUrl} onLogoUrl={setValue} organizationId={org?.id} />
              </div>
            )}
          </div>

          {/* ── Contact ── */}
          <div className="rounded-xl border border-gray-200/70 overflow-hidden">
            <SectionToggle label="Contact Information" open={openSections.contact} onToggle={() => toggle('contact')}
              icon={<svg className={svgCls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            {openSections.contact && (
              <div className="px-4 pb-4 space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone" name="phone" placeholder="0300 1234567" value={values.phone} onChange={handleChange} />
                  <Input label="Email" name="email" type="email" placeholder="info@school.edu" value={values.email} onChange={handleChange} />
                </div>
                <Input label="Website" name="website" placeholder="https://school.edu" value={values.website} onChange={handleChange} />
              </div>
            )}
          </div>

          {/* ── Social Links ── */}
          <div className="rounded-xl border border-gray-200/70 overflow-hidden">
            <SectionToggle label="Social Links" open={openSections.social} onToggle={() => toggle('social')}
              icon={<svg className={svgCls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>} />
            {openSections.social && (
              <div className="px-4 pb-4 pt-1"><SocialLinksFields values={values} onChange={handleChange} /></div>
            )}
          </div>

          {/* ── Bank Details ── */}
          <div className="rounded-xl border border-gray-200/70 overflow-hidden">
            <SectionToggle label="Bank Details" open={openSections.bank} onToggle={() => toggle('bank')}
              icon={<svg className={svgCls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></svg>} />
            {openSections.bank && (
              <div className="px-4 pb-4 pt-1">
                <BankFields values={values} errors={errors} onChange={handleChange}
                  hint="Fee vouchers par default print hoga — branches apna account override kar sakti hain." />
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2 shrink-0">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
