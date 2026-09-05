import { Card, CardHeader, Badge, Button, EmptyState } from '@/features/shared/components';
import type { Applicant } from '@/types';
import { AdmissionsRow } from './AdmissionsRow';
import { AdmissionsMobileCard } from './AdmissionsMobileCard';

interface AdmissionsTableProps {
  applicants: Applicant[];
  total: number;
  refetching: boolean;
  onView: (applicant: Applicant) => void;
  onEdit: (applicant: Applicant) => void;
  onAdd: () => void;
  onRefresh: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function AdmissionsTable({ applicants, total, refetching, onView, onEdit, onAdd, onRefresh, pageSize, onPageSizeChange }: AdmissionsTableProps) {
  if (applicants.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No applicants found"
          description="Register a new inquiry or import applicants via Excel to start building the pipeline."
          action={<Button size="sm" onClick={onAdd}>New Inquiry</Button>}
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 bg-gradient-to-r from-primary-50/60 via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900">Applicants</h2>
          <Badge variant="info">{total}</Badge>
        </div>
        <div className="flex items-center gap-4">
          {pageSize <= 5 && (
            <button type="button" onClick={() => onPageSizeChange(10)} className="group inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800">
              Expand list
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
          {refetching && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating…
            </span>
          )}
        </div>
      </CardHeader>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-gray-100">
        {applicants.map((applicant) => (
          <AdmissionsMobileCard key={applicant.id} applicant={applicant} onView={onView} onEdit={onEdit} onRefresh={onRefresh} />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-y border-gray-200 bg-slate-50/90">
            <tr className="h-11">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Slot</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applicants.map((applicant) => (
              <AdmissionsRow key={applicant.id} applicant={applicant} onView={onView} onEdit={onEdit} onRefresh={onRefresh} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
