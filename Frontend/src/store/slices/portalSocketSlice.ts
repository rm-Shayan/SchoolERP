import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PortalAttendanceEvent {
  studentId: string;
  studentName: string;
  sectionId: string;
  status: string;
  scanType: string;
  scannedAt: string;
  checkIn?: string;
  checkOut?: string;
}

export interface PortalHomeworkEvent {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  sentAt: string;
  sectionId: string;
  section: { id: string; name: string; class: { name: string } };
  createdBy?: { id: string; name: string };
}

export interface PortalCircularEvent {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  audience: string;
  createdAt: string;
}

export interface PortalNotificationEvent {
  id: string;
  title: string;
  body: string;
  category: string;
  senderName: string;
  createdAt: string;
}

interface PortalSocketState {
  connected: boolean;
  attendanceEvents: PortalAttendanceEvent[];
  homeworkEvents: PortalHomeworkEvent[];
  circularEvents: PortalCircularEvent[];
  notifications: PortalNotificationEvent[];
}

const initialState: PortalSocketState = {
  connected: false,
  attendanceEvents: [],
  homeworkEvents: [],
  circularEvents: [],
  notifications: [],
};

const portalSocketSlice = createSlice({
  name: 'portalSocket',
  initialState,
  reducers: {
    setPortalConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    addAttendanceEvent(state, action: PayloadAction<PortalAttendanceEvent>) {
      const ev = action.payload;
      // Dedupe by studentId + scannedAt
      const exists = state.attendanceEvents.some(
        (e) => e.studentId === ev.studentId && e.scannedAt === ev.scannedAt,
      );
      if (!exists) {
        state.attendanceEvents = [ev, ...state.attendanceEvents].slice(0, 50);
      }
    },
    addHomeworkEvent(state, action: PayloadAction<PortalHomeworkEvent>) {
      const ev = action.payload;
      const exists = state.homeworkEvents.some((e) => e.id === ev.id);
      if (!exists) {
        state.homeworkEvents = [ev, ...state.homeworkEvents].slice(0, 30);
      }
    },
    addCircularEvent(state, action: PayloadAction<PortalCircularEvent>) {
      const ev = action.payload;
      const exists = state.circularEvents.some((e) => e.id === ev.id);
      if (!exists) {
        state.circularEvents = [ev, ...state.circularEvents].slice(0, 30);
      }
    },
    clearPortalEvents() {
      return initialState;
    },
    addPortalNotificationEvent(state, action: PayloadAction<PortalNotificationEvent>) {
      const ev = action.payload;
      const exists = state.notifications.some((n) => n.id === ev.id);
      if (!exists) {
        state.notifications = [ev, ...state.notifications].slice(0, 30);
      }
    },
  },
});

export const {
  setPortalConnected,
  addAttendanceEvent,
  addHomeworkEvent,
  addCircularEvent,
  clearPortalEvents,
  addPortalNotificationEvent,
} = portalSocketSlice.actions;

export default portalSocketSlice.reducer;
