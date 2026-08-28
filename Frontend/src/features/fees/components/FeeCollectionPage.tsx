'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studentService, feeService } from '@/lib/api';
import type { Student, FeeRecord } from '@/types';
import { PageHeader, Input, Card, EmptyState } from '@/features/shared/components';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import StudentFeeCard from './parts/StudentFeeCard';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-200" />
            <div className="space-y-2"><div className="h-4 w-28 bg-gray-200 rounded-lg" /><div className="h-3 w-16 bg-gray-100 rounded-lg" /></div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function FeeCollectionPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [recsByStudent, setRecsByStudent] = useState<Record<string, FeeRecord[]>>({});
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [paying, setPaying] = useState<FeeRecord | null>(null);

  const runSearch = async (q: string) => {
    if (!q) { setResults([]); setRecsByStudent({}); return; }
    setSearching(true);
    try {
      const students = await studentService.getAll({ schoolId, status: 'ACTIVE', search: q, pageSize: 100 });
      setResults(students);
      // Bulk fetch — single query instead of N individual calls (N+1 eliminate)
      if (students.length > 0) {
        const bulkMap = await feeService.getBulkRecords({
          schoolId: schoolId!,
          studentIds: students.map((s) => s.id),
        });
        setRecsByStudent(bulkMap);
      }
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Search failed'); }
    finally { setSearching(false); }
  };

  useEffect(() => { const t = setTimeout(() => runSearch(query.trim()), 200); return () => clearTimeout(t); }, [query]);

  // Auto-refresh fee data when payments are recorded elsewhere
  useRealtimeRefresh(['fee_payment_recorded', 'fees_generated'], () => {
    if (selected) select(selected);
  });

  const select = async (student: Student) => {
    setSelected(student);
    try {
      const bulkMap = await feeService.getBulkRecords({
        schoolId: schoolId!,
        studentIds: [student.id],
      });
      setRecsByStudent((prev) => ({ ...prev, [student.id]: bulkMap[student.id] ?? [] }));
    } catch { setRecsByStudent((prev) => ({ ...prev, [student.id]: [] })); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Fee Collection" description="Counter payment collection and instant receipts." />

      {/* Search bar */}
      <form onSubmit={(e) => { e.preventDefault(); runSearch(query.trim()); }} className="relative max-w-2xl">
        <Input placeholder="Search by name, roll number or QR code..." value={query} onChange={(e) => setQuery(e.target.value)}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Results */}
      {searching && results.length === 0 && <SearchSkeleton />}

      {!searching && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((s) => (
            <StudentFeeCard key={s.id} student={s} records={recsByStudent[s.id] ?? []}
              isSelected={selected?.id === s.id} onSelect={() => select(s)} onPay={setPaying} />
          ))}
        </div>
      )}

      {!searching && results.length === 0 && query.trim() !== '' && (
        <Card><EmptyState title="No students found" description="Try a different roll number, name or QR code."
          icon={<svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} /></Card>
      )}

      {!query.trim() && results.length === 0 && (
        <Card className="!border-0 !shadow-none !bg-gradient-to-br !from-gray-50 !to-gray-100/50">
          <EmptyState title="Search for a student" description="Type a name, roll number or scan a QR code to find a student and collect fees."
            icon={<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg shadow-primary-100/50">
              <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>} />
        </Card>
      )}

      {paying && <PaymentModal record={paying} records={selected ? recsByStudent[selected.id] : undefined} onClose={() => setPaying(null)} onPaid={() => { setPaying(null); if (selected) select(selected); }} />}
    </div>
  );
}
