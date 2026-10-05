'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { TemplateColumn } from './types';

/** 0 -> "A", 25 -> "Z", 26 -> "AA" (Excel column lettering). */
function columnLetter(index: number): string {
  let n = index;
  let out = '';
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

interface Props {
  columns: readonly TemplateColumn[];
  className?: string;
}

const HEAD_CELL =
  'min-w-[9rem] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left align-bottom';
const ROW_HEAD_CELL =
  'sticky left-0 z-10 w-10 min-w-[2.5rem] border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center align-middle';
const DATA_CELL = 'min-w-[9rem] border-r border-slate-200 bg-white px-3 py-2 align-middle';

/**
 * Excel-style preview of the sheet the importer reads: column letters, row
 * numbers and a real cell grid. Row 1 is the header row and row 2 is a sample
 * record — the header is rendered exactly once, in the table head.
 */
const ExcelPreviewGrid = memo(function ExcelPreviewGrid({ columns, className }: Props) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-slate-200', className)}>
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Excel sheet preview — row 1 holds the column headers the importer reads, row 2 holds a
          sample record.
        </caption>
        <thead>
          <tr>
            <th scope="col" aria-label="Row" className={cn(ROW_HEAD_CELL, 'sticky top-0 z-20')} />
            {columns.map((c, i) => (
              <th key={c.col} scope="col" className={HEAD_CELL}>
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {columnLetter(i)}
                </span>
                <span className="mt-0.5 block text-xs font-bold text-slate-800">{c.col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={ROW_HEAD_CELL}>
              <span className="text-[11px] font-bold text-slate-500">2</span>
            </th>
            {columns.map((c) => (
              <td key={c.col} className={cn(DATA_CELL, 'font-mono text-[11px] text-slate-600')}>
                {c.example}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default ExcelPreviewGrid;