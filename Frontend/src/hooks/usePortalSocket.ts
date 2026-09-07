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
  type PortalAttendanceEvent,
  type PortalHomeworkEvent,
  type PortalCircularEvent,
} from '@/store/slices/portalSocketSlice';
import {
  addPortalNotification,
  removePortalNotification,
  markPortalRead,
  markAllPortalRead,
} from '@/store/slices/notificationsSlice';
/**
 * Connects a socket for portal (parent/student) users.
 * Joins section:{id} rooms for the child's sections and school:{id} room.
 * Dispatches real-time events to the portalSocket + notifications Redux slices.
 */
export function usePortalSocket(sectionIds: string[], schoolId?: string) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sectionIds.length || !schoolId) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
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
      sectionIds.forEach((id) => socket.emit('join_room', `section:${id}`));
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

    socket.on('portal_notification_created', (payload: any) => {
      dispatch(addPortalNotification(payload));
    });

    socket.on('portal_notifications_deleted', (payload: { ids: string[] }) => {
      payload.ids.forEach((id: string) => dispatch(removePortalNotification(id)));
    });

    socket.on('portal_notifications_read', (payload: { ids: string[] }) => {
      dispatch(markPortalRead(payload.ids));
    });

    socket.on('portal_all_read', (payload: any) => {
      dispatch(markAllPortalRead(payload?.schoolId ?? schoolId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(clearPortalEvents());
    };
  }, [sectionIds.join(','), schoolId, dispatch]);

  return socketRef;
}
