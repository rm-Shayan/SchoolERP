'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/features/shared/components';
import type { TemplateColumn } from './types';

/** Consistent card header for both template panels (eyebrow + title + download). */
export function TemplateCardHeader({
  eyebrow,
  title,
  description,
  downloading,
  onDownload,
}: {
  eyebrow: string;
  title: string;
  description: string;
  downloading: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <Button
        size="sm"
        loading={downloading}
        onClick={onDownload}
        className="shrink-0 !border-0 bg-primary-600 text-white"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        Download Template (.xlsx)
      </Button>
    </div>
  );
}

const RequiredPill = memo(function RequiredPill({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        required
          ? 'bg-rose-50 text-rose-700 ring-rose-200/70'
          : 'bg-slate-100 text-slate-500 ring-slate-200'
      )}
    >
      {required ? 'Required' : 'Optional'}
    </span>
  );
});

const TemplateColumnRow = memo(function TemplateColumnRow({
  col,
  required,
  example,
}: TemplateColumn) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
      <td className="px-4 py-2.5 font-mono text-xs font-bold whitespace-nowrap text-slate-800">{col}</td>
      <td className="px-4 py-2.5 text-center whitespace-nowrap">
        <RequiredPill required={required} />
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{example}</td>
    </tr>
  );
});

/** Required/optional columns table for the import sheet. */
export default function TemplateColumnsTable({ columns }: { columns: readonly TemplateColumn[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Column
            </th>
            <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Required
            </th>
            <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Example
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <TemplateColumnRow key={c.col} col={c.col} required={c.required} example={c.example} />
          ))}
        </tbody>
      </table>
    </div>
  );
}