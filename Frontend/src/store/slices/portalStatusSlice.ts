import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrgStatus, SchoolStatus } from '@/types';

interface PortalStatusState {
  orgStatus: OrgStatus | null;
  schoolStatus: SchoolStatus | null;
}

const initialState: PortalStatusState = {
  orgStatus: null,
  schoolStatus: null,
};

const portalStatusSlice = createSlice({
  name: 'portalStatus',
  initialState,
  reducers: {
    syncPortalStatus(state, action: PayloadAction<Partial<PortalStatusState>>) {
      if (action.payload.orgStatus) state.orgStatus = action.payload.orgStatus;
      if (action.payload.schoolStatus) state.schoolStatus = action.payload.schoolStatus;
    },
    setOrgStatus(state, action: PayloadAction<OrgStatus>) {
      state.orgStatus = action.payload;
    },
    setSchoolStatus(state, action: PayloadAction<SchoolStatus>) {
      state.schoolStatus = action.payload;
    },
    resetPortalStatus() {
      return initialState;
    },
  },
});

export const { syncPortalStatus, setOrgStatus, setSchoolStatus, resetPortalStatus } =
  portalStatusSlice.actions;
export default portalStatusSlice.reducer;
