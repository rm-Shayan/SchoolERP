import { Input, Select } from '@/features/shared/components';
import { getRoleLabel } from '@/lib/utils';

// Staff roles only — branch admin (Principal) staff list mein dikhta hi nahi.
const ROLES = ['TEACHER', 'RECEPTIONIST'];

interface StaffToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
}

export default function StaffToolbar({ search, onSearchChange, roleFilter, onRoleFilterChange }: StaffToolbarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
      <Input
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      <Select
        placeholder="All roles"
        options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))}
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
      />
    </div>
  );
}
