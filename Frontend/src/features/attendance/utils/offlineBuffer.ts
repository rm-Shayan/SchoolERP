'use client';

import type { OfflineScan } from '@/lib/api/attendanceService';

const OFFLINE_BUFFER_KEY = 'offline_scan_buffer';

export function addToOfflineBuffer(scan: OfflineScan) {
  try {
    const existing: OfflineScan[] = JSON.parse(localStorage.getItem(OFFLINE_BUFFER_KEY) ?? '[]');
    existing.push(scan);
    localStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(existing));
  } catch { /* storage full */ }
}

export function getOfflineBuffer(): OfflineScan[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_BUFFER_KEY) ?? '[]');
  } catch { return []; }
}

export function clearOfflineBuffer() {
  localStorage.removeItem(OFFLINE_BUFFER_KEY);
}
