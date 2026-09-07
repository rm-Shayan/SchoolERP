'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/features/shared/components';
import { authService, type AccessibleBranch } from '@/lib/api/authService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { switchBranch } from '@/store/slices/authSlice';
import { cn, getRoleHomePath } from '@/lib/utils';

const STATUS_PILL: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-600',
  SETUP_PENDING: 'bg-amber-50 text-amber-600',
};

export default function BranchSwitcherSection() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const organization = useAppSelector((s) => s.auth.organization);
  const [branches, setBranches] = useState<AccessibleBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    authService
      .myBranches()
      .then((data) => mounted && setBranches(data))
      .catch(() => mounted && setBranches([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleSwitch = useCallback(
    async (schoolId: string) => {
      if (!user) return;
      setSwitchingId(schoolId);
      try {
        const result = await dispatch(switchBranch(schoolId)).unwrap();
        const slug = organization?.slug ?? result.user.organization?.slug;
        toast.success(`Switched to ${result.user.school?.name ?? 'branch'}`);
        router.push(getRoleHomePath(result.user.role, result.user.organizationId, slug));
      } catch (err: any) {
        toast.error(err?.message || 'Failed to switch branch');
      } finally {
        setSwitchingId(null);
      }
    },
    [dispatch, router, organization, user]
  );

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading branches…</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs text-gray-400">
        Same account, same credentials — only the branch portal changes. SMTP/Cloudinary
        settings are also managed from this branch&apos;s secrets tab (organization defaults are used if not set).
      </p>

      {branches.length === 0 && (
        <p className="text-sm text-gray-500 py-2">No other branches are linked to this account.</p>
      )}

      <div className="space-y-3">
        {branches.map((b) => {
          const active = b.isCurrent;
          return (
            <div
              key={b.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4',
                active ? 'border-primary-200 bg-primary-50/40' : 'border-gray-100 bg-white'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{b.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{b.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_PILL[b.status] ?? 'bg-gray-100 text-gray-500')}>
                      {b.status}
                    </span>
                    {b.isHome && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Home
                      </span>
                    )}
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400')}>
                      {active ? 'Current' : b.isHome ? 'Home Branch' : 'Managed'}
                    </span>
                  </div>
                </div>
              </div>
              {!active && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-start sm:self-center"
                  loading={switchingId === b.id}
                  disabled={switchingId !== null}
                  onClick={() => handleSwitch(b.id)}
                >
                  Switch
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}