'use client';

import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api/client';
import { store } from '@/store';
import { setSocketStatus, addScanEvent, type LiveScanEvent } from '@/store/slices/socketSlice';
import { addPortalNotification, removePortalNotification, markPortalRead, markAllPortalRead } from '@/store/slices/notificationsSlice';
import type { PortalNotification } from '@/lib/api/notificationService';
import { registerSocketHandlers } from './socketToasts';

let socket: Socket | null = null;

function toLiveScanEvent(payload: any): LiveScanEvent {
  const student = payload.student ?? {};
  return {
    studentId: student.id ?? payload.studentId,
    studentName: student.name ?? payload.studentName,
    rollNumber: student.rollNumber ?? payload.rollNumber,
    imageUrl: student.imageUrl ?? payload.imageUrl,
    identifierCode: student.identifierCode ?? payload.identifierCode,
    checkIn: payload.checkIn ?? null,
    checkOut: payload.checkOut ?? null,
    status: payload.status ?? 'PRESENT',
    scannedAt: payload.scannedAt ?? new Date().toISOString(),
  };
}

/**
 * Real-time scope guard — always mirror the server's list()/unreadCount()
 * rules so no socket event leaks another person's/another branch's
 * notification into this client's store.
 */
function canReceive(n: PortalNotification): boolean {
  const user = store.getState().auth.user;
  if (!user) return false;

  // Super admin: sab dekh sakta hai apne actions ke alawa.
  if (user.role === 'SUPER_ADMIN') return n.senderId !== user.id;

  // Branch scope — other org/branch ki notifications nahi dikhni.
  if (n.schoolId && user.schoolId && n.schoolId !== user.schoolId) return false;
  if (n.organizationId && user.organizationId && n.organizationId !== user.organizationId) return false;

  if (user.role === 'ADMIN') {
    // Targeted to me
    if (n.recipientId === user.id) return true;
    // School-wide broadcast (no recipient)
    if (!n.recipientId && n.schoolId === user.schoolId) return true;
    // Org-wide broadcast (no school, no recipient)
    if (!n.recipientId && !n.schoolId && n.organizationId === user.organizationId) return true;
    return false;
  }

  // Teacher / staff / receptionist:
  if (n.recipientId) return n.recipientId === user.id;
  // School-wide broadcast
  if (!n.recipientId && n.schoolId === user.schoolId) return true;
  // Org-wide broadcast (no school)
  if (!n.recipientId && !n.schoolId && n.organizationId === user.organizationId) return true;
  return false;
}

export function connectSocket(schoolId?: string, organizationId?: string) {
  if (socket?.connected) return socket;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  socket = io(url, {
    transports: ['websocket', 'polling'],
    auth: { token: getAccessToken() },
  });

  socket.on('connect', () => {
    store.dispatch(setSocketStatus('connected'));
    if (schoolId) socket?.emit('join_room', `school:${schoolId}`);
    if (organizationId) socket?.emit('join_room', `org:${organizationId}`);
    if (!schoolId && !organizationId) socket?.emit('join_room', 'super_admins');
  });

  socket.on('disconnect', () => store.dispatch(setSocketStatus('disconnected')));
  socket.on('connect_error', () => store.dispatch(setSocketStatus('error')));

  socket.on('gate_scan_event', (payload: any) => {
    store.dispatch(addScanEvent(toLiveScanEvent(payload)));
  });

  socket.on('portal_notification_created', (payload: any) => {
    if (canReceive(payload)) store.dispatch(addPortalNotification(payload));
  });

  socket.on('portal_notifications_deleted', (payload: any) => {
    payload.ids.forEach((id: string) => store.dispatch(removePortalNotification(id)));
  });

  socket.on('portal_notifications_read', (payload: any) => {
    store.dispatch(markPortalRead(payload.ids));
  });

  socket.on('portal_all_read', (payload: any) => {
    store.dispatch(markAllPortalRead(payload?.schoolId ?? undefined));
  });

  registerSocketHandlers(socket);
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  store.dispatch(setSocketStatus('disconnected'));
}

export function getSocket() {
  return socket;
}
