'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props { dark: boolean; scanning: boolean; onScan: (code: string) => void; }

export default function ManualEntryCard({ dark, scanning, onScan }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) { setError('Enter an identifier code'); return; }
    if (value.length < 4) { setError('Code must be at least 4 characters'); return; }
    setError(null);
    onScan(value);
    setCode('');
  };

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden',
      dark ? 'bg-gray-900/80 border-gray-800/50 backdrop-blur-sm' : 'bg-white border-gray-200 shadow-sm'
    )}>
      <div className={cn('px-4 py-2.5 border-b', dark ? 'border-gray-800/50' : 'border-gray-100')}>
        <h3 className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-gray-500' : 'text-gray-400')}>
          Manual Entry
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="p-3 flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
          placeholder="Type student ID code..."
          className={cn(
            'flex-1 rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all',
            dark
              ? 'bg-gray-800/60 border-gray-700/50 text-white placeholder-gray-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
          )}
        />
        <button
          type="submit"
          disabled={scanning || !code.trim()}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            dark
              ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20'
              : 'bg-primary-600 hover:bg-primary-500 text-white'
          )}
        >
          {scanning ? '...' : 'Scan'}
        </button>
      </form>
      {error && (
        <div className="px-4 pb-3">
          <p className={cn('text-xs', dark ? 'text-red-400' : 'text-red-600')}>{error}</p>
        </div>
      )}
    </div>
  );
}
