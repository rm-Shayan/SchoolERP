'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '@/lib/api/attendanceService';
import { getOfflineBuffer, clearOfflineBuffer } from '@/features/attendance/utils/offlineBuffer';

export default function OfflineSyncButton({ dark = true }: { dark?: boolean }) {
  // SSR-safe: navigator sirf browser me hai — pehla render dono jagah false,
  // phir effect actual status sync karta hai (hydration mismatch se bachne ke liye).
  const [isOnline, setIsOnline] = useState(false);
  const [bufferCount, setBufferCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBufferCount(getOfflineBuffer().length), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    const buffer = getOfflineBuffer();
    if (!buffer.length) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await attendanceService.syncOffline(buffer);
      clearOfflineBuffer();
      setBufferCount(0);
      setSyncResult(`✓ Synced ${result.synced} scans`);
      setTimeout(() => setSyncResult(null), 3000);
    } catch {
      setSyncResult('✗ Sync failed');
      setTimeout(() => setSyncResult(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Network Status */}
      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
        isOnline
          ? dark ? 'bg-primary-900/30 border-primary-700/50 text-primary-400' : 'bg-primary-50 border-primary-200 text-primary-700'
          : dark ? 'bg-red-900/30 border-red-700/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary-400' : 'bg-red-400 animate-pulse'}`} />
        {isOnline ? 'Online' : 'Offline'}
      </div>

      {/* Sync Button — only when buffer has items */}
      {bufferCount > 0 && (
        <button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
        >
          {syncing ? (
            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Sync {bufferCount} offline scans
        </button>
      )}

      {syncResult && <span className={dark ? 'text-xs text-gray-400' : 'text-xs text-gray-600'}>{syncResult}</span>}
    </div>
  );
}
