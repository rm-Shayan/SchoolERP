'use client';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { School } from '@/types';

interface BranchState {
  activeBranch: School | null;
  activeBranchId: string | null;
}

const initialState: BranchState = {
  activeBranch: null,
  // SSR-safe: prerender ke waqt localStorage exist nahi karta
  activeBranchId: typeof window !== 'undefined' ? localStorage.getItem('activeBranchId') : null,
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setActiveBranch(state, action: PayloadAction<School>) {
      state.activeBranch = action.payload;
      state.activeBranchId = action.payload.id;
      localStorage.setItem('activeBranchId', action.payload.id);
    },
    clearActiveBranch(state) {
      state.activeBranch = null;
      state.activeBranchId = null;
      localStorage.removeItem('activeBranchId');
    },
  },
});

export const { setActiveBranch, clearActiveBranch } = branchSlice.actions;
export default branchSlice.reducer;
