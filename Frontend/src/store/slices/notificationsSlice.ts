import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logoutAction } from './authSlice';
import type { PortalNotification } from '@/lib/api/notificationService';

interface NotificationsState {
  portalItems: PortalNotification[];
  portalUnread: number;
}

const initialState: NotificationsState = {
  portalItems: [],
  portalUnread: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPortalNotifications(state, action: PayloadAction<PortalNotification[]>) {
      state.portalItems = action.payload;
    },
    setPortalUnread(state, action: PayloadAction<number>) {
      state.portalUnread = action.payload;
    },
    addPortalNotification(state, action: PayloadAction<PortalNotification>) {
      const exists = state.portalItems.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.portalItems = [action.payload, ...state.portalItems].slice(0, 50);
        if (!action.payload.isRead) state.portalUnread += 1;
      }
    },
    removePortalNotification(state, action: PayloadAction<string>) {
      const removed = state.portalItems.find((n) => n.id === action.payload);
      state.portalItems = state.portalItems.filter((n) => n.id !== action.payload);
      if (removed && !removed.isRead) state.portalUnread = Math.max(0, state.portalUnread - 1);
    },
    markPortalRead(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload);
      let decremented = 0;
      state.portalItems.forEach((n) => {
        if (ids.has(n.id) && !n.isRead) { n.isRead = true; decremented++; }
      });
      state.portalUnread = Math.max(0, state.portalUnread - decremented);
    },
    markAllPortalRead(state, action: PayloadAction<string | undefined>) {
      const filterSchoolId = action.payload;
      let decremented = 0;
      state.portalItems.forEach((n) => {
        if (!n.isRead) {
          if (filterSchoolId) {
            if (n.schoolId === filterSchoolId || n.recipientId) return;
          }
          n.isRead = true;
          decremented++;
        }
      });
      state.portalUnread = Math.max(0, state.portalUnread - decremented);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutAction.fulfilled, () => ({ portalItems: [], portalUnread: 0 }));
  },
});

export const {
  setPortalNotifications,
  setPortalUnread,
  addPortalNotification,
  removePortalNotification,
  markPortalRead,
  markAllPortalRead,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
