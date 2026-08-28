'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import { useAppDispatch } from '@/store/hooks';
import {
  setPortalConnected,
  addAttendanceEvent,
  addHomeworkEvent,
  addCircularEvent,
  clearPortalEvents,
  addPortalNotificationEvent,
  type PortalAttendanceEvent,
  type PortalHomeworkEvent,
  type PortalCircularEvent,
  type PortalNotificationEvent,
} from '@/store/slices/portalSocketSlice';
import type { PortalNotification } from '@/lib/api/notificationService';

/**
 * Connects a socket for portal (parent/student) users.
 * Joins section:{id} rooms for the child's sections and school:{id} room.
 * Dispatches real-time events to the portalSocket Redux slice.
 */
export function usePortalSocket(sectionIds: string[], schoolId?: string) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sectionIds.length || !schoolId) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    // Parent/student portals store tokens under different keys.
    const portalToken = typeof window !== 'undefined'
      ? localStorage.getItem('studentToken') || localStorage.getItem('parentToken') || getAccessToken()
      : null;
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: { token: portalToken },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch(setPortalConnected(true));
      // Join section rooms for scoped data (homework, attendance)
      sectionIds.forEach((id) => socket.emit('join_room', `section:${id}`));
      // Join school room for school-wide data (circulars)
      socket.emit('join_room', `school:${schoolId}`);
    });

    socket.on('disconnect', () => dispatch(setPortalConnected(false)));
    socket.on('connect_error', () => dispatch(setPortalConnected(false)));

    socket.on('portal:attendance_marked', (payload: PortalAttendanceEvent) => {
      dispatch(addAttendanceEvent(payload));
    });

    socket.on('portal:homework_broadcast', (payload: PortalHomeworkEvent) => {
      dispatch(addHomeworkEvent(payload));
    });

    socket.on('portal:circular_created', (payload: PortalCircularEvent) => {
      dispatch(addCircularEvent(payload));
    });

    socket.on('portal_notification_created', (payload: PortalNotificationEvent) => {
      dispatch(addPortalNotificationEvent(payload));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(clearPortalEvents());
    };
  }, [sectionIds.join(','), schoolId, dispatch]);

  return socketRef;
}
