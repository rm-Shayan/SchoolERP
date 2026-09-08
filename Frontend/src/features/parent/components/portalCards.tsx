'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, Badge } from '@/features/shared/components';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

export const PortalBrandIcon = () => (
  <img src="/screen.png" alt="Logo" className="h-6 w-6 object-contain" />
);

/** Shared avatar tile — shows photo if available (even if load fails), otherwise a generic placeholder. */
export function PortalAvatar({ src, name, color, className = '' }: { src?: string | null; name: string; color?: string; className?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [src]);
  if (src && !imgFailed) {
    return <img src={src} alt={name} onError={() => setImgFailed(true)} className={`${className} object-cover`} />;
  }
  return <AvatarPlaceholder className={className} style={color ? { boxShadow: `0 0 0 2px ${color}30` } : undefined} />;
}

interface PortalHeaderProps {
  title: string;
  subtitle: string;
  onLogout: () => void;
}

export function PortalHeader({ title, subtitle, onLogout }: PortalHeaderProps) {
  const color = getOrgThemeColor();
  return (
    <header
      className="sticky top-0 z-20 text-white shadow-lg"
      style={{ background: color ? `linear-gradient(135deg, ${color}, ${color}dd)` : undefined }}
    >
      {!color && <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600" />}
      <div className="relative max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-white/70 hover:text-white transition px-2 py-1">Home</Link>
          <button onClick={onLogout} className="text-sm bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-3 py-1.5 font-medium transition">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

interface ChildSummaryProps {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  schoolName?: string | null;
  className?: string | null;
  sectionName?: string | null;
  rollNumber: string;
  status: string;
  isActive: boolean;
}

export function ChildSummaryCard({ firstName, lastName, imageUrl, schoolName, className, sectionName, rollNumber, status, isActive }: ChildSummaryProps) {
  const color = getOrgThemeColor();
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: color || undefined }} />
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <PortalAvatar src={imageUrl} name={`${firstName} ${lastName}`} color={color || undefined} className="w-12 h-12 rounded-xl shrink-0 shadow-sm" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{firstName} {lastName}</h2>
            <p className="text-xs text-gray-500 truncate">
              {[schoolName, className, sectionName].filter(Boolean).join(' · ')} · Roll #{rollNumber}
            </p>
          </div>
          <Badge variant={isActive ? 'success' : 'danger'}>{status.replace('_', ' ')}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="School" value={schoolName ?? '—'} color={color} />
          <MiniStat label="Class" value={className ?? '—'} color={color} />
          <MiniStat label="Section" value={sectionName ?? '—'} color={color} />
          <MiniStat label="Roll #" value={rollNumber} color={color} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: color ? `${color}10` : undefined }}>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}

export function PortalInfoCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InfoCard icon="attendance" title="Attendance" note="Daily check-in and absence alerts delivered by email." color="#22c55e" />
      <InfoCard icon="fees" title="Fees" note="Fee reminders and payment receipts are delivered by email." color="#f59e0b" />
      <InfoCard icon="notice" title="Circulars & Homework" note="New circulars and homework assignments are notified in real time." color="#6366f1" />
    </div>
  );
}

const ICONS: Record<string, string> = {
  attendance: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  fees: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  notice: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

function InfoCard({ icon, title, note, color }: { icon: string; title: string; note: string; color: string }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS[icon]} />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{note}</p>
    </Card>
  );
}
