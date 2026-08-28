'use client';

import Link from 'next/link';
import { Button } from '@/features/shared/components';

interface OrgsToolbarProps {
  exporting: boolean;
  onExport: () => void;
  onCreate: () => void;
}

function OrgsToolbar({ exporting, onExport, onCreate }: OrgsToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        loading={exporting}
        className="w-full sm:w-auto"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Export Excel
      </Button>
      <Link href="/admin/import" className="flex w-full sm:w-auto">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Excel
        </Button>
      </Link>
      <Button size="sm" onClick={onCreate} className="w-full sm:w-auto">
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Organization
      </Button>
    </div>
  );
}

export default OrgsToolbar;
