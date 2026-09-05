'use client';

import { useCallback, useEffect, useState } from 'react';
import { smtpSettingsService, storageSettingsService } from '@/lib/api';
import type { SmtpSettingsStatus, StorageSettingsStatus } from '@/types';
import type { School } from '@/types';
import { Card, Badge } from '@/features/shared/components';
import SmtpSettingsSection from '@/features/school/components/parts/SmtpSettingsSection';
import StorageSettingsSection from '@/features/school/components/parts/StorageSettingsSection';

interface BranchSettingsCardProps {
  school: School;
  orgName: string;
  onUpdated: () => void;
}

export default function BranchSettingsCard({ school, orgName, onUpdated }: BranchSettingsCardProps) {
  const [smtpStatus, setSmtpStatus] = useState<SmtpSettingsStatus | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageSettingsStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const [smtp, storage] = await Promise.allSettled([
        smtpSettingsService.getStatus(school.organizationId, school.id),
        storageSettingsService.getStatus(school.organizationId),
      ]);
      if (smtp.status === 'fulfilled') setSmtpStatus(smtp.value);
      if (storage.status === 'fulfilled') setStorageStatus(storage.value);
    } catch { /* silent */ }
  }, [school.organizationId, school.id]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const smtpBranch = smtpStatus?.branch;
  const smtpOrg = smtpStatus?.organization;
  const storageSetting = storageStatus?.setting;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {school.name?.charAt(0) ?? 'B'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{school.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{orgName} · {school.code}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={smtpBranch?.primary ? 'success' : smtpOrg?.primary ? 'info' : 'warning'}>
                SMTP: {smtpBranch?.primary ? 'Branch' : smtpOrg?.primary ? 'Org' : 'None'}
              </Badge>
              <Badge variant={storageSetting ? 'success' : 'warning'}>
                Cloudinary: {storageSetting ? 'Set' : 'None'}
              </Badge>
            </div>
          </div>
          <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 space-y-4 p-4 sm:p-5 bg-gray-50/30">
          <SmtpSettingsSection organizationId={school.organizationId} schoolId={school.id} />
          <StorageSettingsSection organizationId={school.organizationId} />
        </div>
      )}
    </Card>
  );
}
