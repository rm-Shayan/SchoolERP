'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addScanEvent } from '@/store/slices/socketSlice';
import { attendanceService } from '@/lib/api/attendanceService';
import QrCameraFeed from './QrCameraFeed';
import ScanResultCard from './ScanResultCard';
import ScanHistoryTable from './ScanHistoryTable';
import OfflineSyncButton from './OfflineSyncButton';
import ManualEntryCard from './parts/ManualEntryCard';
import { addToOfflineBuffer } from '@/features/attendance/utils/offlineBuffer';
import { PageHeader } from '@/features/shared/components';
import type { ScanResult } from '@/lib/api/attendanceService';

interface GateScanPageProps { embedded?: boolean; }

export default function GateScanPage({ embedded = false }: GateScanPageProps) {
  const dispatch = useAppDispatch();
  const { scanHistory } = useAppSelector((s) => s.socket);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const handleScan = useCallback(async (identifierCode: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setScanning(true);
    setError(null);
    if (!navigator.onLine) {
      addToOfflineBuffer({ identifierCode, method: 'QR', scannedAt: new Date().toISOString() });
      setError('Offline — scan saved. It will sync when you\'re back online.');
      busyRef.current = false;
      setScanning(false);
      return;
    }
    try {
      const result = await attendanceService.scan({ identifierCode, method: 'QR' });
      setLastResult(result);
      dispatch(addScanEvent({
        studentId: result.studentId, studentName: result.studentName,
        rollNumber: result.rollNumber, imageUrl: result.imageUrl,
        identifierCode: result.identifierCode, checkIn: result.checkIn,
        status: result.status, scannedAt: result.scannedAt,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Scan failed. Check the code and try again.');
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, [dispatch]);

  if (embedded) {
    return (
      <div className="space-y-4">
        <PageHeader title="Gate Attendance" description="Scan student QR codes at the entry gate" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 space-y-4">
            <QrCameraFeed onScan={handleScan} isProcessing={scanning} dark={false} />
            <ManualEntryCard dark={false} scanning={scanning} onScan={handleScan} />
            {error && <div className="rounded-xl p-3 text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>}
            {lastResult && <ScanResultCard result={lastResult} dark={false} />}
          </div>
          <div className="xl:col-span-2">
            <ScanHistoryTable scans={scanHistory} dark={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/60 text-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 border border-primary-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950">Gate Attendance</h1>
                <p className="text-sm text-slate-500">Scan student QR cards at entry gate</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OfflineSyncButton dark={false} />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-semibold text-slate-800">{scanHistory.length}</span>
              <span className="text-xs text-slate-500">scans</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Left column — scanner + manual + result */}
          <div className="xl:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                <h2 className="text-sm font-semibold text-slate-800">QR Scanner</h2>
              </div>
              <QrCameraFeed onScan={handleScan} isProcessing={scanning} dark={false} />
            </div>

            <ManualEntryCard dark={false} scanning={scanning} onScan={handleScan} />

            {error && (
              <div className="rounded-xl p-3.5 text-sm bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {lastResult && <ScanResultCard result={lastResult} dark={false} />}
          </div>

          {/* Right column — scan history */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Today's Scan History</h2>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-medium">{scanHistory.length} scans</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScanHistoryTable scans={scanHistory} dark={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
