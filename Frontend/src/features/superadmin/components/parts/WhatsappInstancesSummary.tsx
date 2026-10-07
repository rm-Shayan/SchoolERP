'use client';

import { useCallback, useEffect, useState } from 'react';
import { whatsappService } from '@/lib/api';
import type { WhatsAppInstanceInfo } from '@/lib/api/whatsappService';

export default function WhatsappInstancesSummary({ organizationId }: { organizationId: string }) {
  const [rows, setRows] = useState<WhatsAppInstanceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setRows(await whatsappService.listByOrg(organizationId)); } catch { setRows([]); } finally { setLoading(false); }
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  const color: Record<string, string> = {
    CONNECTED: 'bg-green-100 text-green-700',
    AWAITING_QR: 'bg-amber-100 text-amber-700',
    DISCONNECTED: 'bg-gray-100 text-gray-600',
    FAILED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">WhatsApp Instances</h3>
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gray-400">No branch has connected WhatsApp yet.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {rows.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{r.schoolName || r.schoolId}</span>
              <span className="flex items-center gap-2">
                {r.phoneNumber && <span className="text-xs text-gray-500">+{r.phoneNumber}</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color[r.state] || ''}`}>{r.state}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
