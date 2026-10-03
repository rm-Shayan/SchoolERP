'use client';

import { cn } from '@/lib/utils';

interface CredentialsSectionToggleProps {
  open: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  /** Icon paths drawn inside the coloured square */
  iconPaths: string[];
  /** Status chips rendered under the title row — hidden until a branch is picked */
  showStatus: boolean;
  status?: React.ReactNode;
}

/** Collapsible header row shared by the branch credential sections (SMTP/storage). */
export default function CredentialsSectionToggle({
  open, onToggle, title, subtitle, iconPaths, showStatus, status,
}: CredentialsSectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full bg-gradient-to-r from-slate-50 to-white px-4 py-4 text-left transition-colors hover:from-primary-50/60 sm:px-6 sm:py-5"
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200 sm:h-12 sm:w-12">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {iconPaths.map((d) => (
              <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
            ))}
          </svg>
        </div>
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
        </div>
        <svg
          className={cn('h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {showStatus && (
        <div className="mt-4 border-t border-slate-200/80 pt-4 sm:ml-16">{status}</div>
      )}
    </button>
  );
}