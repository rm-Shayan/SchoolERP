'use client';

import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '@/lib/api';
import type { NotificationDeliveryStatus } from '@/types';
import { Button, EmptyState } from '@/features/shared/components';
import toast from 'react-hot-toast';

export default function PlatformStatus() {
  const [delivery, setDelivery] = useState<NotificationDeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDelivery(await notificationService.getDeliveryStatus());
    } catch {
      setError(true);
      toast.error('Failed to load notification status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = delivery?.summary;
  const byChannel = delivery?.byChannel ?? {};

  return (
    <div className="space-y-6"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Live health</p><h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Delivery overview</h3></div>
          <Button variant="outline" size="sm" onClick={load} loading={loading} className="rounded-xl">
            Refresh
          </Button>
        </div>

        {error ? (
          <EmptyState title="Couldn't load delivery status" description="Try again." />
        ) : !summary ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gradient-to-r from-violet-100/40 to-violet-50/30 rounded-2xl animate-pulse border border-violet-200/20" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatBox label="Total" value={summary.total} iconBg="sa-icon-violet" />
              <StatBox label="Sent" value={summary.sent} iconBg="sa-icon-sky" />
              <StatBox label="Delivered" value={summary.delivered} iconBg="sa-icon-emerald" />
              <StatBox label="Failed" value={summary.failed} iconBg="sa-icon-rose" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2.5 font-semibold">By Channel</p>
              {Object.keys(byChannel).length === 0 ? (
                <p className="text-sm text-gray-400">No channel data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(byChannel).map(([ch, count]) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary-100 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-700"
                    >
                      {ch} · <span className="tabular-nums">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, iconBg }: { label: string; value: number; iconBg: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/60 p-4 text-center bg-gradient-to-br from-gray-50/50 to-transparent hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <p className="text-2xl font-extrabold tabular-nums text-gray-900 sa-count-up">{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
