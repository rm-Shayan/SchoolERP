'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { admissionService, academicService } from '@/lib/api';
import type { AdmissionFunnelStats } from '@/lib/api/admissionService';
import type { Applicant, AdmissionStatus } from '@/types';
import { PageHeader, Button } from '@/features/shared/components';
import { useDebouncedValue } from '@/features/school/components/parts/helpers';
import toast from 'react-hot-toast';
import { PipelineSummary } from './parts/PipelineSummary';
import { AdmissionsToolbar } from './parts/AdmissionsToolbar';
import { AdmissionsTable } from './parts/AdmissionsTable';
import { AdmissionsPagination } from './parts/AdmissionsPagination';
import { AdmissionsSkeleton } from './parts/AdmissionsSkeleton';
import InquiryModal from './InquiryModal';
import AdmissionActionsModal from './AdmissionActionsModal';
import EditApplicantModal from './parts/EditApplicantModal';
import AdmissionImportModal from './parts/AdmissionImportModal';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

export default function AdmissionsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [total, setTotal] = useState(0);
  const [funnel, setFunnel] = useState<AdmissionFunnelStats>({} as AdmissionFunnelStats);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | ''>('');
  const [classFilter, setClassFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    const requestId = ++requestIdRef.current;
    // First load → skeleton; later fetches keep the table visible (no flicker).
    if (!hasLoadedRef.current) setLoading(true);
    else setRefetching(true);
    try {
      const [list, funnelData, classesData] = await Promise.all([
        admissionService.getPaginated({ schoolId, status: statusFilter || undefined, classId: classFilter || undefined, search: debouncedSearch || undefined, from: from || undefined, to: to || undefined, page, pageSize }),
        admissionService.getFunnel(schoolId),
        academicService.getClassesBySchool(schoolId),
      ]);
      if (requestId !== requestIdRef.current) return;
      setApplicants(list.items);
      setTotal(list.total);
      setFunnel(funnelData);
      setClasses(classesData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load admissions');
    } finally {
      if (requestId === requestIdRef.current) {
        hasLoadedRef.current = true;
        setLoading(false);
        setRefetching(false);
      }
    }
  }, [schoolId, page, pageSize, statusFilter, classFilter, debouncedSearch, from, to]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['admission_created', 'admission_approved', 'admission_enrolled', 'admission_status_updated', 'admission_deleted'], load);
  useEffect(() => { setPage(1); }, [statusFilter, classFilter, debouncedSearch, from, to]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const refresh = useCallback(async () => { await load(); setSelected(null); setEditing(null); }, [load]);
  const handleChanged = (updated: Applicant) => { setApplicants((prev) => prev.map((a) => (a.id === updated.id ? updated : a))); setSelected(updated); };
  const handleRemoved = async (id: string) => { setApplicants((prev) => prev.filter((a) => a.id !== id)); setSelected(null); await load(); };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Every applicant from inquiry to enrollment — paginated, searchable, full pipeline."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>Import Excel</Button>
            <Button size="sm" onClick={() => setShowInquiry(true)}>New Inquiry</Button>
          </>
        }
      />
      <PipelineSummary funnel={funnel} active={statusFilter} onSelect={setStatusFilter} />
      <AdmissionsToolbar
        schoolId={schoolId}
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        classFilter={classFilter} onClassChange={setClassFilter}
        from={from} onFromChange={setFrom}
        to={to} onToChange={setTo}
        classes={classes} classesLoading={loading && classes.length === 0} total={total}
      />
      {loading ? (
        <AdmissionsSkeleton />
      ) : (
        <AdmissionsTable
          applicants={applicants}
          total={total}
          refetching={refetching}
          onView={setSelected}
          onEdit={setEditing}
          onAdd={() => setShowInquiry(true)}
          onRefresh={refresh}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPage(1); setPageSize(size); }}
        />
      )}
      <AdmissionsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPage(1); setPageSize(size); }}
        onPageChange={setPage}
      />
      <InquiryModal open={showInquiry} onClose={() => setShowInquiry(false)} onCreated={refresh} />
      <AdmissionImportModal open={showImport} onClose={() => setShowImport(false)} onImported={refresh} />
      {selected && (
        <AdmissionActionsModal
          applicant={selected}
          onClose={() => setSelected(null)}
          onChanged={handleChanged}
          onRefresh={refresh}
          onEdit={setEditing}
          onRemoved={handleRemoved}
        />
      )}
      {editing && (
        <EditApplicantModal
          applicant={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { setEditing(null); setSelected(null); handleChanged(updated); load(); }}
        />
      )}
    </div>
  );
}
