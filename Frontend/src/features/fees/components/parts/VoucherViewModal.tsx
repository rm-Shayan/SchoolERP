'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button } from '@/features/shared/components';
import { feeService } from '@/lib/api';
import type { FeeRecord } from '@/types';
import toast from 'react-hot-toast';

const mLabel = (d: string) => new Date(d).toLocaleString('en-PK', { month: 'long', year: 'numeric' });
const outstanding = (r: FeeRecord) => Math.max(0, Number(r.totalAmount) + Number(r.dueCharges || 0) - Number(r.paidAmount || 0));

interface VoucherViewModalProps {
  open: boolean;
  feeRecordId: string | null;
  onClose: () => void;
}

export default function VoucherViewModal({ open, feeRecordId, onClose }: VoucherViewModalProps) {
  const [months, setMonths] = useState<FeeRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customize, setCustomize] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Track which state the current URL was generated with (avoids duplicate fetches)
  const urlForSel = useRef('');
  const urlForCust = useRef(false);

  const selectedIds = useMemo(() => Array.from(selected).sort(), [selected]);
  const total = useMemo(() => months.filter((m) => selected.has(m.id)).reduce((s, m) => s + outstanding(m), 0), [months, selected]);

  // Generate URL with explicit params (no state dependency → no render loop)
  const fetchUrl = async (ids: string[], isCustom: boolean) => {
    const key = `${ids.join(',')}:${isCustom}`;
    if (urlForSel.current === key && urlForCust.current === isCustom) return;
    urlForSel.current = key;
    urlForCust.current = isCustom;
    setLoading(true); setError(false);
    try {
      const newUrl = await feeService.getVoucherViewUrl(feeRecordId!, ids.length ? ids : undefined);
      setUrl((old) => { if (old) URL.revokeObjectURL(old); return newUrl; });
    } catch { setError(true); toast.error('Failed to load voucher'); }
    finally { setLoading(false); }
  };

  // Effect 1: Record changed → fetch months + initial URL
  useEffect(() => {
    if (!open || !feeRecordId) return;
    let active = true;
    setSelected(new Set()); setMonths([]); setUrl(null); setError(false);
    (async () => {
      try {
        const rec = await feeService.getRecord(feeRecordId);
        const studentId = rec.student?.id;
        const schoolId = rec.student?.schoolId;
        let all: FeeRecord[] = [];
        if (schoolId && studentId) {
          const bulk = await feeService.getBulkRecords({ schoolId, studentIds: [studentId] });
          all = bulk[studentId] || [];
        } else { all = [rec]; }
        const open = all.filter((r) => r.status !== 'PAID').sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
        if (!active) return;
        setMonths(open);
        const ids = open.map((r) => r.id);
        setSelected(new Set(ids));
        // Fetch initial merged URL directly (no state trigger)
        setLoading(true); setError(false);
        try {
          const u = await feeService.getVoucherViewUrl(feeRecordId, ids.length ? ids : undefined);
          if (!active) { URL.revokeObjectURL(u); return; }
          urlForSel.current = `${ids.join(',')}:true`;
          urlForCust.current = true;
          setUrl(u);
        } catch { if (active) setError(true); }
        finally { if (active) setLoading(false); }
      } catch { if (active) { setError(true); toast.error('Failed to load voucher'); } }
    })();
    return () => { active = false; };
  }, [open, feeRecordId]);

  // Effect 2: Customize toggle → reload with current selection
  const prevCust = useRef(customize);
  useEffect(() => {
    if (prevCust.current === customize || months.length === 0) { prevCust.current = customize; return; }
    prevCust.current = customize;
    if (customize) fetchUrl(selectedIds, true);
    else fetchUrl([], false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customize, months.length]);

  // Effect 3: Selection changed in customize mode → reload
  const prevSelKey = useRef(selectedIds.join(','));
  useEffect(() => {
    const newKey = selectedIds.join(',');
    if (prevSelKey.current === newKey || !customize || months.length === 0) { prevSelKey.current = newKey; return; }
    prevSelKey.current = newKey;
    fetchUrl(selectedIds, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(','), customize, months.length]);

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Modal open={open} onClose={onClose} title="Fee Voucher" size="xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
        <p className="text-xs font-semibold text-primary-800">{customize ? `${selectedIds.length} month(s) selected` : 'All open months included'}</p>
        <button onClick={() => setCustomize((c) => !c)} className="text-[11px] font-bold text-primary-700 underline">
          {customize ? 'Show all months' : 'Customize months'}
        </button>
      </div>

      {customize && (
        <div className="mb-3 max-h-44 overflow-y-auto space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2">
          {months.map((m) => (
            <label key={m.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-gray-100 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="accent-primary-600" />
              <span className="flex-1">{mLabel(m.dueDate)}</span>
              <span className="font-semibold text-gray-700">Rs {outstanding(m).toLocaleString()}</span>
            </label>
          ))}
          {selectedIds.length > 0 && <p className="px-1 text-right text-xs font-bold text-primary-700">Total: Rs {total.toLocaleString()}</p>}
        </div>
      )}

      <div className="flex h-[58vh] min-h-[320px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:min-h-[420px]">
        {loading && <div className="flex flex-1 items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" /></div>}
        {!loading && error && <div className="flex flex-1 items-center justify-center text-sm text-red-500">Could not load voucher. <button onClick={() => { urlForSel.current = ''; fetchUrl(customize ? selectedIds : [], customize); }} className="ml-2 underline font-bold">Retry</button></div>}
        {!loading && !error && url && <iframe src={url} title="Fee Voucher" className="min-h-0 flex-1 w-full border-0 bg-white" key={url} />}
      </div>

      <div className="sticky bottom-0 mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 bg-white pt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {url && feeRecordId && (
          <>
            <Button size="sm" variant="outline" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>Open full screen</Button>
            <Button size="sm" variant="outline" onClick={() => feeService.getVoucherA5Pdf(feeRecordId, customize ? selectedIds : undefined)}>A5</Button>
            <Button size="sm" onClick={() => feeService.getVoucherPdf(feeRecordId, customize ? selectedIds : undefined)}>Download</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
