'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/features/shared/components';
import Logo from '@/features/shared/components/Logo';
import { formatDate } from '@/lib/utils';
import type { Organization } from '@/types';
import { OrgStatusBadge } from './StatusBadge';
import PublicPageButton from './PublicPageButton';
import toast from 'react-hot-toast';

interface OrgHeaderProps {
  org: Organization;
  deleting: boolean;
  blocking: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export default function OrgHeader({
  org, deleting, blocking, onEdit, onDelete, onBlock, onUnblock,
}: OrgHeaderProps) {
  const [copied, setCopied] = useState(false);
  const blocked = org.status === 'BLOCKED';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/o/${org.slug}`);
      setCopied(true);
      toast.success('Login link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const Chip = ({ label, value }: { label: string; value: string }) => (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 truncate max-w-[160px]">{value}</span>
    </span>
  );

  return (
    <div className="bg-white rounded-2xl border border-primary-100 shadow-[0_18px_50px_rgba(76,29,149,0.12)] overflow-hidden sa-fade-in">
      <div className="h-32 sm:h-40" style={{ backgroundColor: '#6d28d9' }} />
      <div className="px-4 sm:px-7 pb-6 -mt-12 relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4 min-w-0">
            <div className="shrink-0 rounded-2xl bg-white p-2 shadow-xl ring-4 ring-white/60">
              <Logo src={org.logoUrl} name={org.name} size="lg" />
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">{org.name}</h1>
                <OrgStatusBadge status={org.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <Chip label="Code" value={org.code} />
                <Chip label="Slug" value={`/o/${org.slug}`} />
                {org.adminUsername && <Chip label="Admin" value={org.adminUsername} />}
                <Chip label="Created" value={formatDate(org.createdAt)} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:pb-1">
            <PublicPageButton slug={org.slug} label="View Public Page" variant="solid" />
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="rounded-xl border-primary-300 text-primary-700 hover:bg-primary-50">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-primary-700 border border-primary-200 bg-primary-50/40 hover:bg-primary-100/60"
            >
              Dashboard
            </Link>
            <Button variant="outline" size="sm" onClick={onEdit} className="rounded-xl border-primary-300 text-primary-700 hover:bg-primary-50">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button variant="danger" size="sm" loading={blocking} onClick={blocked ? onUnblock : onBlock}>
              {blocked ? 'Unblock Org' : 'Block Org'}
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={onDelete}>Delete Org</Button>
          </div>
        </div>
        {blocked && org.blockedReason && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            Block reason: {org.blockedReason}
          </p>
        )}
      </div>
    </div>
  );
}
