'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/features/shared/components';
import { useDebouncedValue } from '@/lib/utils/useDebouncedValue';

interface BranchesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function BranchesToolbar({ search, onSearchChange }: BranchesToolbarProps) {
  const [value, setValue] = useState(search);
  const debouncedValue = useDebouncedValue(value, 250);

  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  return (
    <div className="max-w-sm">
      <Input
        placeholder="Search by branch name, code, org or address…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
    </div>
  );
}
