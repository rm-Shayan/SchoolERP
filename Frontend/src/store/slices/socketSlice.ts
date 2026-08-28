import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface LiveScanEvent {
  studentId: string;
  studentName: string;
  rollNumber: string;
  imageUrl?: string;
  identifierCode: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  scannedAt: string;
}

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SocketState {
  status: SocketStatus;
  lastScanEvent: LiveScanEvent | null;
  scanHistory: LiveScanEvent[];
}

const initialState: SocketState = {
  status: 'disconnected',
  lastScanEvent: null,
  scanHistory: [],
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketStatus(state, action: PayloadAction<SocketStatus>) {
      state.status = action.payload;
    },
    addScanEvent(state, action: PayloadAction<LiveScanEvent>) {
      const event = action.payload;
      const duplicate = state.scanHistory.some(
        (s) => s.identifierCode === event.identifierCode && s.scannedAt === event.scannedAt,
      );
      if (duplicate) return;
      state.lastScanEvent = event;
      // Keep up to 100 scan events in history
      state.scanHistory = [event, ...state.scanHistory].slice(0, 100);
    },
    clearScanHistory(state) {
      state.scanHistory = [];
      state.lastScanEvent = null;
    },
  },
});

export const { setSocketStatus, addScanEvent, clearScanHistory } = socketSlice.actions;
export default socketSlice.reducer;
