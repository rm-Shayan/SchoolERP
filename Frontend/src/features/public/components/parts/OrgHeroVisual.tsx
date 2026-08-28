import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';

interface OrgHeroVisualProps {
  org: OrgPublicData;
  theme: string;
}

const bars = [38, 55, 44, 68, 60, 82, 74, 92];
const ledger = [
  { label: 'Tuition fee', amount: 'Paid', tone: 'emerald' },
  { label: 'Attendance', amount: '96%', tone: 'blue' },
  { label: 'Homework', amount: 'Done', tone: 'amber' },
];

export default function OrgHeroVisual({ org, theme }: OrgHeroVisualProps) {
  return (
    <div className="relative hidden h-full min-h-[560px] items-center justify-center lg:flex">
      {/* Glow ring behind card */}
      <div className="absolute h-[420px] w-[420px] rounded-full blur-[90px] opacity-50" style={{ backgroundColor: `${theme}40` }} />

      {/* Main dashboard card */}
      <div className="pu-float relative w-full max-w-[440px] rounded-[28px] border border-white/20 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-2xl">
        <div className="overflow-hidden rounded-[22px] bg-white text-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              {org.name}
            </span>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-gray-100 p-1.5 shadow-sm">
                <Logo src={org.logoUrl} name={org.name} size="sm" />
              </div>
              <div>
                <p className="text-sm font-black">{org.name}</p>
                <p className="text-[11px] text-gray-400">Welcome back</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                Open
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {ledger.map((row, i) => (
                <div key={row.label} className="rounded-2xl bg-gray-50 px-3 py-3">
                  <p className="text-lg font-black text-gray-900">{row.amount}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{row.label}</p>
                  <div className="mt-2 flex gap-1">
                    <span
                      className="h-1 flex-1 rounded-full"
                      style={{ backgroundColor: theme, opacity: 1 - i * 0.22 }}
                    />
                    <span className="h-1 flex-1 rounded-full bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-500">Weekly attendance</p>
                <p className="text-[11px] font-bold text-gray-900">92%</p>
              </div>
              <div className="mt-3 flex h-16 items-end gap-1.5">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="pu-bar-grow flex-1 rounded-t-md"
                    style={{ height: `${h}%`, backgroundColor: theme, opacity: 0.5 + (h / 100) * 0.5 }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-white">
              <span className="text-[11px] font-bold text-white/70">Admission open</span>
              <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10px] font-black" style={{ color: theme }}>
                Apply
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chips */}
      <FloatChip className="pu-float left-[-10px] top-8" theme={theme} title="New admission" sub="enrolled today" icon="check" />
      <FloatChip className="pu-float right-[-6px] top-1/3 [animation-delay:1.2s]" theme={theme} title="Fee paid" sub="Rs. 12,400" icon="card" />
      <FloatChip className="pu-float bottom-6 left-8 [animation-delay:0.6s]" theme={theme} title="Attendance" sub="96% present" icon="users" />
    </div>
  );
}

function FloatChip({ className, theme, title, sub, icon }: {
  className: string;
  theme: string;
  title: string;
  sub: string;
  icon: 'check' | 'card' | 'users';
}) {
  return (
    <div className={`absolute z-10 flex items-center gap-2.5 rounded-2xl border border-white/25 bg-white/95 py-2.5 pl-3 pr-4 shadow-xl ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ backgroundColor: theme }}>
        {icon === 'check' && <CheckIcon />}
        {icon === 'card' && <CardIcon />}
        {icon === 'users' && <UsersIcon />}
      </span>
      <span>
        <span className="block text-xs font-black text-gray-900">{title}</span>
        <span className="block text-[11px] font-medium text-gray-400">{sub}</span>
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM5 12.5a.75.75 0 000 1.5h4a.75.75 0 000-1.5H5z" clipRule="evenodd" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  );
}
