'use client';

import { useAppSelector } from '@/store/hooks';

/** Select real-time portal events from the Redux store. */
export function usePortalEvents() {
  return useAppSelector((s) => ({
    connected: s.portalSocket.connected,
    attendanceEvents: s.portalSocket.attendanceEvents,
    homeworkEvents: s.portalSocket.homeworkEvents,
    circularEvents: s.portalSocket.circularEvents,
    portalNotifications: s.portalSocket.notifications,
  }));
}
