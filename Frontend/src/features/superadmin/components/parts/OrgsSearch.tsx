'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/features/shared/components';

interface OrgsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const DEBOUNCE_MS = 200;

function OrgsSearch({ value, onChange }: OrgsSearchProps) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, onChange]);

  return (
    <div className="relative w-full max-w-sm">
      <Input
        placeholder="Search by name, code or slug..."
        aria-label="Search organizations"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={query ? 'pr-10' : undefined}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 rounded-xl"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default OrgsSearch;
