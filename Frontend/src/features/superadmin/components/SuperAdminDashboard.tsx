'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { getSocket } from '@/lib/socket';
import { orgService } from '@/lib/api';
import type { PlatformOverview } from '@/types';
import { Card, Button, EmptyState, Reveal } from '@/features/shared/components';
import { getCachedOverview, setCachedOverview, buildChartData } from './parts/helpers';
import Skeleton from './parts/Skeleton';
import WelcomeHeader from './parts/WelcomeHeader';
import StatCards from './parts/StatCards';
import StatusStats from './parts/StatusStats';
import OverviewChart from './parts/OverviewChart';
import GrowthChart from './parts/GrowthChart';
import QuickActions from './parts/QuickActions';
import OrganizationsGrid from './parts/OrganizationsGrid';

export default function SuperAdminDashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const socketStatus = useAppSelector((s) => s.socket.status);
  const [overview, setOverview] = useState<PlatformOverview | null>(getCachedOverview());
  const [loading, setLoading] = useState(() => !getCachedOverview());
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await orgService.getOverview();
    setCachedOverview(data);
    setOverview(data);
    setLastUpdated(new Date());
  }, []);

  // Wrap load so callers never crash on failure
  const safeLoad = useCallback(async () => {
    try { await load(); } catch (err) { console.error('Dashboard load failed:', err); }
  }, [load]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await load();
      setError(null);
    } catch (err) {
      setError('Failed to load platform overview');
      console.error('Failed to reload dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await safeLoad();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError('Failed to load platform overview');
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [safeLoad]);

  const debounceRef = useRef<number | null>(null);
  const attachedRef = useRef(false);
  useEffect(() => {
    const handleUpdate = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setRefreshing(true);
      try {
        await safeLoad();
        setError(null);
      } catch (err) {
        console.error('Live dashboard refresh failed:', err);
      } finally {
        setRefreshing(false);
      }
    }, 250);
    };

    const attach = () => {
      const socket = getSocket();
      if (!socket || attachedRef.current) return false;
      socket.on('overview_updated', handleUpdate);
      socket.on('import_completed', handleUpdate);
      attachedRef.current = true;
      return true;
    };

    const onConnect = () => attach();
    if (!attach()) getSocket()?.once('connect', onConnect);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    return () => {
      const socket = getSocket();
      socket?.off('overview_updated', handleUpdate);
      socket?.off('import_completed', handleUpdate);
      socket?.off('connect', onConnect);
      attachedRef.current = false;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [load]);

  const chartData = useMemo(() => buildChartData(overview), [overview]);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-8">
      <WelcomeHeader firstName={user?.name?.split(' ')[0]} />
      {error ? (
        <Card className="p-12">
          <EmptyState
            title="Couldn't load the dashboard"
            description={error}
            action={<Button onClick={handleRetry}>Retry</Button>}
          />
        </Card>
      ) : (
        <>
          <Reveal><StatCards stats={overview?.stats} /></Reveal>
          <Reveal delay={0.08}><StatusStats stats={overview?.stats} /></Reveal>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <OverviewChart
              chartData={chartData}
              socketStatus={socketStatus}
              lastUpdated={lastUpdated}
              refreshing={refreshing}
            />
            <GrowthChart growth={overview?.growth ?? []} />
          </div>
          <QuickActions />
          <Reveal delay={0.12}><OrganizationsGrid organizations={overview?.organizations ?? []} /></Reveal>
        </>
      )}
    </div>
  );
}
