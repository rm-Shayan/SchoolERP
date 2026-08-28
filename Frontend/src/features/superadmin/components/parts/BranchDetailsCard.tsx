import type { Organization, School } from '@/types';
import { Card } from '@/features/shared/components';

interface BranchDetailsCardProps {
  org: Organization;
  school: School;
}

export default function BranchDetailsCard({ org, school }: BranchDetailsCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] transition-shadow duration-300">
      <div className="h-1.5 bg-gradient-to-r from-primary-500 to-violet-600" />
      <div className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Overview</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-1">Branch Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
          <DetailRow label="Organization" value={org.name} />
          <DetailRow label="Branch Code" value={school.code} />
          {school.address && <DetailRow label="Address" value={school.address} full />}
          {school.phone && <DetailRow label="Phone" value={school.phone} full />}
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0 ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 break-words text-right">{value}</span>
    </div>
  );
}
