'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { whatsappService } from '@/lib/api';
import type { WhatsAppInstanceInfo } from '@/lib/api/whatsappService';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/features/shared/components';
import CredentialsSectionToggle from './CredentialsSectionToggle';
import toast from 'react-hot-toast';

const STATE_STYLE: Record<string, string> = {
  CONNECTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  AWAITING_QR: 'bg-amber-50 text-amber-700 border border-amber-200',
  DISCONNECTED: 'bg-slate-100 text-slate-600 border border-slate-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export default function WhatsappSettingsSection({ organizationId, schoolId }: { organizationId?: string | null; schoolId?: string | null }) {
  const { user, school } = useAppSelector((st) => st.auth);
  const orgId = organizationId ?? user?.organizationId ?? null;
  const branchId = schoolId ?? user?.schoolId ?? school?.id ?? null;
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<WhatsAppInstanceInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !branchId) return;
    try { setInfo(await whatsappService.getStatus(orgId, branchId)); } catch { /* ignore */ }
  }, [orgId, branchId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (info?.state === 'AWAITING_QR') {
      pollRef.current = setInterval(async () => {
        try { const s = await whatsappService.sync(orgId, branchId); if (s) setInfo(s); } catch { /* ignore */ }
      }, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [info?.state, orgId, branchId]);

  const run = async (fn: () => Promise<WhatsAppInstanceInfo | null>) => {
    setBusy(true);
    try { const r = await fn(); if (r !== undefined) setInfo(r); } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'WhatsApp action failed');
    } finally { setBusy(false); }
  };

  const qrExpired = info?.state === 'AWAITING_QR' && info.qrExpiresAt && new Date(info.qrExpiresAt).getTime() < Date.now();

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CredentialsSectionToggle
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title="WhatsApp"
        subtitle="Branch ke customers ko messages bhejne ke liye device connect karo."
        iconPaths={['M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z']}
        showStatus={Boolean(info)}
        status={info ? (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_STYLE[info.state] || ''}`}>
            {info.state}{info.phoneNumber ? ` · +${info.phoneNumber}` : ''}
          </span>
        ) : undefined}
      />

      {open && (
        <div className="border-t border-slate-100 p-5 sm:p-6 space-y-5">
          {info ? (
            <div className={`flex items-center justify-between gap-3 rounded-xl p-4 ${STATE_STYLE[info.state]}`}>
              <div>
                <p className="font-semibold text-sm">{info.state === 'CONNECTED' ? 'Device connected' : info.state === 'AWAITING_QR' ? 'Waiting for scan' : 'Not connected'}</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {info.phoneNumber ? `+${info.phoneNumber}` : 'No number linked'}{info.displayName ? ` · ${info.displayName}` : ''}
                </p>
              </div>
              {info.state === 'CONNECTED' && (
                <button disabled={busy} onClick={() => run(() => whatsappService.setEnabled(!info.isEnabled, orgId, branchId))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${info.isEnabled ? 'bg-emerald-600 text-white' : 'bg-white/70 text-slate-600'}`}>
                  {info.isEnabled ? 'Sends ON' : 'Sends OFF'}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">Is branch se abhi koi WhatsApp device connected nahi hai.</p>
            </div>
          )}

          {info?.state === 'DISCONNECTED' && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Device disconnect ho gayi hai — jab tak dobara connect nahi karo, messages nahi jayenge.
            </p>
          )}
          {info?.state === 'FAILED' && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              Connection fail ho gayi. Dobara Connect WhatsApp daba kar scan karo.
            </p>
          )}
          {qrExpired && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              QR expire ho gaya — "Refresh QR" daba kar naya scan karo.
            </p>
          )}
          {info?.lastError && <p className="text-xs text-rose-500">{info.lastError}</p>}

          {info?.state === 'AWAITING_QR' && info.qrCode && (
            <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl bg-emerald-50/50 border border-emerald-100 p-5">
              <img src={info.qrCode} alt="WhatsApp QR" className="w-48 h-48 bg-white p-3 rounded-xl shadow-sm border border-emerald-100" />
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Phone me WhatsApp kholo</li>
                <li>Settings → <b>Linked devices</b></li>
                <li><b>Link a device</b> → ye QR scan karo</li>
              </ol>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {info?.state !== 'CONNECTED' && (
              <button disabled={busy} onClick={() => run(() => whatsappService.connect(orgId, branchId))}
                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {info ? 'Reconnect / New QR' : 'Connect WhatsApp'}
              </button>
            )}
            {info?.state === 'AWAITING_QR' && (
              <button disabled={busy} onClick={() => run(() => whatsappService.refreshQr(orgId, branchId))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh QR</button>
            )}
            {info && (
              <button onClick={() => run(() => whatsappService.sync(orgId, branchId))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sync</button>
            )}
            {info && (
              <button disabled={busy} onClick={async () => {
                setBusy(true);
                try { await whatsappService.remove(orgId, branchId); setInfo(null); }
                catch (err: any) { toast.error(err?.response?.data?.message ?? 'Delete failed'); }
                finally { setBusy(false); }
              }}
                className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50">Delete</button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
