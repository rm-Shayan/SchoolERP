import type { OrgPublicData } from '@/lib/api/orgService';

interface OrgStatsProps {
  org: OrgPublicData;
  theme: string;
}

const stats = [
  {
    key: 'campuses',
    label: 'Campuses',
    getVal: (org: OrgPublicData) => String(org.branches.length),
    icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
  },
  {
    key: 'admissions',
    label: 'Admissions',
    value: 'Open',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    key: 'portal',
    label: 'Parent Portal',
    value: '24/7',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    key: 'fees',
    label: 'Fee Tracking',
    value: 'Online',
    icon: 'M3 10h18M7 15h3m-6-9h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z',
  },
];

export default function OrgStats({ org, theme }: OrgStatsProps) {
  return (
    <section className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl shadow-gray-900/5 sm:gap-5 sm:p-6 lg:grid-cols-4 lg:p-8">
        {stats.map((s) => {
          const value = s.value || (s.getVal ? s.getVal(org) : '—');
          return (
            <div key={s.key} className="group flex items-center gap-3.5 rounded-2xl p-3 transition-colors hover:bg-gray-50 sm:gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 sm:h-14 sm:w-14"
                style={{ backgroundColor: `${theme}10`, color: theme }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 sm:h-6 sm:w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </span>
              <div>
                <p className="text-xl font-black text-gray-900 sm:text-2xl">{value}</p>
                <p className="text-[11px] font-medium text-gray-500 sm:text-xs">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
