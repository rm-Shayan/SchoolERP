'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { StatsCard, Reveal } from '@/features/shared/components';
import { formatCurrency } from '@/lib/utils';
import DashboardSkeleton from './parts/DashboardSkeleton';
import { AttendanceChart, FeeStatusPie } from './parts/DashboardCharts';
import { FunnelCard, Icon } from './parts/DashboardCards';
import { LiveScansCard } from './parts/DashboardScans';
import { useDashboardData } from '../hooks/useDashboardData';

const FADE_MS = 400;

export default function AdminDashboard() {
  const { user, school, organization } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const scanHistory = useAppSelector((s) => s.socket.scanHistory);
  const { data, loading, hydrating } = useDashboardData(schoolId);

  const prevLoading = useRef(loading);
  const [showSkeleton, setShowSkeleton] = useState(loading);
  const [contentVisible, setContentVisible] = useState(!loading);

  useEffect(() => {
    if (prevLoading.current && !loading) {
      // loading just went false → start crossfade
      setContentVisible(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, FADE_MS);
      return () => clearTimeout(timer);
    }
    prevLoading.current = loading;
  }, [loading]);

  return (
    <div className="space-y-6">
      {showSkeleton && (
        <div
          className={`transition-opacity duration-400 ease-out ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <DashboardSkeleton />
        </div>
      )}
      <div className={`transition-opacity duration-400 ease-out ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 p-6 md:p-8 text-white shadow-lg border border-primary-900">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-primary-700/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-1 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-300 bg-primary-950/40 px-2.5 py-1 rounded-full w-fit border border-primary-800/30">{organization?.name || 'School ERP'}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-white">{school?.name ?? 'Branch Dashboard'}</h1>
            <p className="text-slate-200 text-sm md:text-base mt-2 font-medium leading-relaxed">Welcome back, {user?.name?.split(' ')[0]} — here's your school status today.</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatsCard title="Active Students" value={data.activeStudents} icon={<Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />} />
          <StatsCard title="Present Today" value={data.presentToday} subtitle="via QR gate scans" icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} />
          <StatsCard title="Fees Collected" value={formatCurrency(data.feesCollected)} icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} />
          <StatsCard title="Today's Scans" value={scanHistory.length} subtitle="live at the gate" icon={<Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />} />
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AttendanceChart data={data.classAttendance} loading={hydrating} />
          <FeeStatusPie data={data.feeStatus} loading={hydrating} />
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <FunnelCard funnel={data.funnel} loading={hydrating} />
          <LiveScansCard scans={scanHistory} />
        </div>
      </Reveal>
      </div>
    </div>
  );
}
