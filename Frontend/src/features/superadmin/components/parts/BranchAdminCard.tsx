'use client';

import { memo } from 'react';
import type { School, SchoolAdmin } from '@/types';
import { Card, Button, Badge } from '@/features/shared/components';
import { getInitials } from '@/lib/utils';

interface PrincipalRowProps {
  admin: SchoolAdmin;
}

const PrincipalRow = memo(function PrincipalRow({ admin }: PrincipalRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
          {getInitials(admin.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
          <p className="text-xs text-gray-500 truncate">{admin.email}</p>
        </div>
      </div>
      <Badge variant={admin.isActive ? 'success' : 'danger'}>
        {admin.isActive ? 'Branch Principal' : 'Deactivated'}
      </Badge>
    </div>
  );
});

const NoAdminRow = memo(function NoAdminRow() {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <div className="text-sm text-gray-600 min-w-0">
        <p className="font-medium">No principal assigned</p>
        <p className="mt-0.5 text-xs text-gray-500">
          This branch has no admin account yet. Assign a dedicated principal to manage this campus.
        </p>
      </div>
    </div>
  );
});

interface BranchAdminCardProps {
  school: School;
  onChangeAdmin: () => void;
}

export default function BranchAdminCard({ school, onChangeAdmin }: BranchAdminCardProps) {
  const admins = school.admins ?? [];
  return (
    <Card className="overflow-hidden hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] transition-shadow duration-300">
      <div className="h-1.5 bg-gradient-to-r from-primary-500 to-violet-600" />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-200 pb-4 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">People</p>
            <h2 className="text-lg font-semibold text-gray-900">Branch Admin / Principal</h2>
            <p className="text-sm text-gray-500 mt-0.5">Who manages this branch.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onChangeAdmin}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Change Admin
          </Button>
        </div>

        <div className="space-y-3">
          {admins.length > 0 ? (
            admins.map((admin) => <PrincipalRow key={admin.id} admin={admin} />)
          ) : (
            <NoAdminRow />
          )}
        </div>
      </div>
    </Card>
  );
}
