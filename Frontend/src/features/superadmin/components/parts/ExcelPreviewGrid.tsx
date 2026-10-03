'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

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
  headers: readonly string[];
  /** One sample data row, aligned to `headers`. */
  row: readonly string[];
  className?: string;
}

const HEAD_CELL =
  'sticky top-0 z-20 min-w-[8rem] border border-slate-300 bg-slate-100 px-3 py-1.5 text-left align-bottom';
const ROW_HEAD_CELL =
  'sticky left-0 z-10 w-9 min-w-[2.25rem] border border-slate-300 bg-slate-100 px-2 py-1.5 text-center align-middle';
const DATA_CELL =
  'min-w-[8rem] border border-slate-300 bg-white px-3 py-1.5 align-middle';

/**
 * Excel-style preview of the import sheet: column letters, row numbers and a
 * real cell grid, so the format in the guide matches the downloaded .xlsx
 * instead of looking like loose text.
 */
const ExcelPreviewGrid = memo(function ExcelPreviewGrid({ headers, row, className }: Props) {
  return (
    <div className={cn('overflow-auto rounded-xl border border-slate-300 bg-white', className)}>
      <table className="w-full border-collapse">
        <caption className="sr-only">Excel sheet preview — row 1 holds the column headers, row 2 holds a sample record.</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(ROW_HEAD_CELL, 'sticky left-0 top-0 z-30')} />
            {headers.map((h, i) => (
              <th key={h} scope="col" className={HEAD_CELL}>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {columnLetter(i)}
                </span>
                <span className="block text-xs font-bold text-slate-800">{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={ROW_HEAD_CELL}>
              <span className="text-[11px] font-bold text-slate-500">1</span>
            </th>
            {headers.map((h, i) => (
              <td key={h} className={cn(DATA_CELL, 'bg-slate-50/70 font-bold text-slate-800')}>
                {h}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className={ROW_HEAD_CELL}>
              <span className="text-[11px] font-bold text-slate-500">2</span>
            </th>
            {headers.map((h, i) => (
              <td key={h} className={cn(DATA_CELL, 'font-mono text-[11px] text-slate-700')}>
                {row[i] ?? ''}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className={ROW_HEAD_CELL}>
              <span className="text-[11px] font-bold text-slate-300">3</span>
            </th>
            {headers.map((h) => (
              <td key={h} className={cn(DATA_CELL, 'bg-slate-50/40 text-[11px] italic text-slate-300')}>
                &nbsp;
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default ExcelPreviewGrid;
