'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { staffService } from '@/lib/api';
import { Button } from '@/features/shared/components';
import AssignBranchModal from './AssignBranchModal';
import toast from 'react-hot-toast';

interface UnassignedAdmin {
  id: string;
  name: string;
  email: string;
  organizationId: string | null;
}

export default memo(function UnassignedAdminsBanner() {
  const [admins, setAdmins] = useState<UnassignedAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<UnassignedAdmin | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffService.getUnassignedAdmins();
      setAdmins(data);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  if (loading || admins.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-amber-100 p-2">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {admins.length} Unassigned Admin{admins.length > 1 ? 's' : ''}
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              These admins have no branch assigned. Assign them to a branch so they can manage it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {admins.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5">
                  <span className="text-sm font-medium text-gray-900">{a.name}</span>
                  <span className="text-xs text-gray-500">{a.email}</span>
                  <Button size="sm" variant="outline" onClick={() => setAssignTarget(a)}>
                    Assign Branch
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {assignTarget && (
        <AssignBranchModal
          open={!!assignTarget}
          adminId={assignTarget.id}
          adminName={assignTarget.name}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { setAssignTarget(null); fetchAdmins(); }}
        />
      )}
    </>
  );
});
