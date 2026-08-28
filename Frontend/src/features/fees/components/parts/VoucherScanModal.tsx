'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/features/shared/components';
import { feeService } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import QrCameraFeed from '@/features/attendance/components/QrCameraFeed';
import toast from 'react-hot-toast';

interface VoucherScanModalProps {
  open: boolean;
  onClose: () => void;
  onCollected: () => void;
}

export default function VoucherScanModal({ open, onClose, onCollected }: VoucherScanModalProps) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [rec, setRec] = useState<any>(null);
  const [showPay, setShowPay] = useState(false);
  const [partialAmt, setPartialAmt] = useState('');

  const reset = () => { setRec(null); setShowPay(false); setPartialAmt(''); setStatus(null); };
  const close = () => { reset(); onClose(); };

  const handleScan = async (code: string) => {
    const trimmed = (code ?? '').trim();
    if (!trimmed.startsWith('FEE:')) { setStatus('Not a fee voucher QR — expected "FEE:" prefix.'); return; }
    const id = trimmed.slice(4).trim();
    if (!id) { setStatus('Invalid voucher code.'); return; }
    setProcessing(true); setStatus('Looking up voucher...');
    try {
      const r = await feeService.getRecord(id);
      const bal = Number(r.totalAmount) - Number(r.paidAmount);
      if (bal <= 0) { toast.success('Fee already fully paid'); onCollected(); return; }
      setRec(r); setPartialAmt(String(bal)); setShowPay(true);
      setStatus(`Voucher found — balance: ${formatCurrency(bal)}`);
    } catch (err: any) { setStatus(err?.response?.data?.message ?? 'Scan failed — record not found'); }
    finally { setProcessing(false); }
  };

  const pay = async (full: boolean) => {
    if (!rec) return;
    const bal = Number(rec.totalAmount) - Number(rec.paidAmount);
    const amt = full ? bal : Number(partialAmt);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > bal) { toast.error(`Amount cannot exceed ${formatCurrency(bal)}`); return; }
    setProcessing(true);
    try {
      await feeService.recordPayment(rec.id, { amount: amt, method: 'ONLINE', reference: `QR-${rec.id.slice(0, 8)}` });
      toast.success(full ? 'Fee fully paid via scan' : `Partial payment of ${formatCurrency(amt)} recorded`);
      onCollected();
    } catch (err: any) { setStatus(err?.response?.data?.message ?? 'Payment failed'); }
    finally { setProcessing(false); }
  };

  const balance = rec ? Number(rec.totalAmount) - Number(rec.paidAmount) : 0;

  return (
    <Modal open={open} onClose={close} title="Scan Fee Voucher QR">
      {!showPay ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 text-center border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-900">Scan QR Code</p>
            <p className="text-[11px] text-gray-400 mt-1">Point camera at the voucher QR code</p>
          </div>
          <QrCameraFeed onScan={handleScan} isProcessing={processing} dark={false} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary-200/50 shrink-0">
              {rec.student?.firstName?.charAt(0)}{rec.student?.lastName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{rec.student?.firstName} {rec.student?.lastName}</p>
              <p className="text-[11px] text-gray-400">{rec.student?.section?.class?.name} {rec.student?.section?.name}</p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4">
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-amber-200/20 blur-lg" />
            <div className="relative flex justify-between items-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Balance Due</span>
              <span className="text-2xl font-extrabold text-amber-700 tabular-nums">{formatCurrency(balance)}</span>
            </div>
            {rec.paidAmount > 0 && (
              <p className="text-[10px] text-amber-500 mt-2 font-medium">
                Total: {formatCurrency(Number(rec.totalAmount))} · Paid: {formatCurrency(Number(rec.paidAmount))}
              </p>
            )}
          </div>

          <Button className="w-full !bg-gradient-to-r !from-emerald-500 !to-emerald-600 !shadow-lg !shadow-emerald-200/50 !border-0 !font-bold"
            loading={processing} onClick={() => pay(true)}>
            Pay Full — {formatCurrency(balance)}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">or pay partial</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Input label="Partial Amount" type="number" min={1} max={balance} step="0.01"
            value={partialAmt} onChange={(e) => setPartialAmt(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" loading={processing} onClick={() => pay(false)}>Pay Partial</Button>
            <Button variant="ghost" onClick={reset}>Rescan</Button>
          </div>
        </div>
      )}
      {status && <p className="mt-3 text-sm text-gray-700 font-medium">{status}</p>}
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={close}>Close</Button>
      </div>
    </Modal>
  );
}
