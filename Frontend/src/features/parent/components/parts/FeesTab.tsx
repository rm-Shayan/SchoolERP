'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalFeeRecord, PortalFeeSummary } from '@/types/portal';
import { cn, formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { FeesSkeleton } from './PortalSkeletonsA';

export default function FeesTab() {
  const [records, setRecords] = useState<PortalFeeRecord[]>([]);
  const [summary, setSummary] = useState<PortalFeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    portalDataService.getFees().then((d) => { setRecords(d.records); setSummary(d.summary); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <FeesSkeleton />;

  return (
    <div className="space-y-4">
      {summary && <FeeSummaryCards summary={summary} />}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">Fee Records</h3></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No fee records found</p>
          ) : (
            <div className="space-y-2">
              {records.map((r) => <FeeRow key={r.id} record={r} expanded={expandedId === r.id} onToggle={() => setExpandedId((p) => p === r.id ? null : r.id)} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeeRow({ record, expanded, onToggle }: { record: PortalFeeRecord; expanded: boolean; onToggle: () => void }) {
  const theme = getOrgThemeColor();
  const balance = Number(record.totalAmount) - Number(record.paidAmount);
  const hasPayments = record.payments.length > 0;

  return (
    <div className={cn('rounded-xl border transition-all', expanded ? 'shadow-sm' : 'border-gray-100 hover:bg-gray-50')}
      style={expanded ? { borderColor: theme ? `${theme}40` : '#bfdbfe', background: theme ? `${theme}05` : '#eff6ff' } : undefined}>
      <button type="button" onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <p className="font-medium text-gray-900 truncate">{record.student.firstName} {record.student.lastName}</p>
            <p className="text-xs text-gray-400">Due {formatDate(record.dueDate)}</p>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-gray-500 text-xs sm:hidden">Total</p>
            <p className="font-semibold text-gray-900">{formatCurrency(Number(record.totalAmount))}</p>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-gray-500 text-xs sm:hidden">Paid</p>
            <p className={cn('font-semibold', Number(record.paidAmount) > 0 ? 'text-green-600' : 'text-gray-900')}>
              {formatCurrency(Number(record.paidAmount))}
            </p>
          </div>
          <div className="flex items-center justify-end sm:justify-start gap-2">
            <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(record.status))}>{record.status}</span>
            {hasPayments && (
              <svg className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {balance > 0 && (
            <div className="flex items-center justify-between text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-red-600 font-medium">Outstanding Balance</span>
              <span className="text-red-700 font-bold">{formatCurrency(balance)}</span>
            </div>
          )}
          {hasPayments ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment History</p>
              {record.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-white border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">{p.method}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.paidAt)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">{formatCurrency(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">No payments recorded yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function FeeSummaryCards({ summary }: { summary: PortalFeeSummary }) {
  const theme = getOrgThemeColor();
  const outstanding = Number(summary.outstanding);
  const cards = [
    { label: 'Total Charged', value: formatCurrency(Number(summary.totalCharged)), color: theme || '#6366f1' },
    { label: 'Total Paid', value: formatCurrency(Number(summary.totalPaid)), color: '#22c55e' },
    { label: 'Outstanding', value: formatCurrency(outstanding), color: outstanding > 0 ? '#ef4444' : '#22c55e' },
    { label: 'Records', value: String(summary.recordCount), color: theme || '#6366f1' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 text-center">
          <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.label}</p>
        </Card>
      ))}
    </div>
  );
}
