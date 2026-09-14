'use client';
import type { OrgPublicData } from '@/lib/api/orgService';

export default function OrgContactDetails({ org, theme }: { org: OrgPublicData; theme: string }) {
  return (
    <div className="space-y-5">
      {org.phone && (
        <a href={`tel:${org.phone}`} className="flex items-center gap-5 rounded-3xl border border-gray-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Phone</p>
            <p className="mt-1 text-base font-bold text-gray-900">{org.phone}</p>
          </div>
        </a>
      )}

      {org.email && (
        <a href={`mailto:${org.email}`} className="flex items-center gap-5 rounded-3xl border border-gray-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Email</p>
            <p className="mt-1 truncate text-base font-bold text-gray-900">{org.email}</p>
          </div>
        </a>
      )}

      {org.website && (
        <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 rounded-3xl border border-gray-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Website</p>
            <p className="mt-1 truncate text-base font-bold text-gray-900">{org.website.replace(/^https?:\/\//, '')}</p>
          </div>
        </a>
      )}

      <div className="rounded-3xl border border-gray-200/80 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Campuses</p>
        <ul className="mt-4 space-y-3">
          {org.branches.map((b) => (
            <li key={b.id} className="text-sm font-semibold text-gray-700">
              {b.name}
              {b.phone && <span className="mt-0.5 block text-xs font-normal text-gray-400">{b.phone}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}