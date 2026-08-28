'use client';

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { User, Organization, School, LoginRequest, UserType } from '@/types';
import { authService, setTokens, clearAuth, orgService, schoolService } from '@/lib/api';
import { getUserType } from '@/lib/utils';
import { getNestedOrg, getNestedSchool, pickActiveSchool, persistAuth } from './authHelpers';

interface AuthState {
  user: User | null;
  userType: UserType | null;
  organization: Organization | null;
  school: School | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function parseStored<T>(value: string | null): T | null {
  if (!value || value === 'undefined' || value === 'null') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: null,
  userType: null,
  organization: null,
  school: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      setTokens(result.accessToken, result.refreshToken);
      // Backend nests school/org under user; honor top-level too for safety.
      const org = getNestedOrg(result.user) ?? result.organization;
      const school = pickActiveSchool(result.user, result.school);
      persistAuth(result.user, org, school);
      return { ...result, organization: org ?? null, school: school ?? null };
    } catch (err) {
      // Surface the backend's message (e.g. blocked org/branch/account)
      // instead of axios's generic "Request failed with status code 401".
      const axiosErr = err as AxiosError<{ message?: string }>;
      return rejectWithValue(axiosErr.response?.data?.message || axiosErr.message || 'Login failed');
    }
  }
);

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const user = await authService.getMe();
  // /auth/me already returns nested school/org — prefer them. Fallback
  // fetches only when the profile lacks nested relations.
  let org = getNestedOrg(user);
  let school = getNestedSchool(user);
  if (user.role === 'SUPER_ADMIN' && !org && user.organizationId) {
    try { org = await orgService.getById(user.organizationId); } catch { /* ignore */ }
  }
  if (!school && user.schoolId) {
    try {
      school = await schoolService.getById(user.schoolId);
      if (!org && school.organizationId && user.role === 'SUPER_ADMIN') {
        try { org = await orgService.getById(school.organizationId); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  const activeSchool = pickActiveSchool(user, school);
  persistAuth(user, org, activeSchool);
  return { user, organization: org ?? null, school: activeSchool ?? null };
});

export const logoutAction = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    try { await authService.logout(refreshToken); } catch { /* ignore */ }
  }
  clearAuth();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setOrganizationForSchool(state, action: PayloadAction<Organization>) {
      state.organization = action.payload;
      localStorage.setItem('organization', JSON.stringify(action.payload));
    },
    // Branch Switcher: switch the active branch for org-level admins.
    setActiveSchool(state, action: PayloadAction<School>) {
      state.school = action.payload;
      if (state.user) state.user.school = action.payload;
      localStorage.setItem('school', JSON.stringify(action.payload));
    },
    hydrateFromStorage(state) {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = parseStored<User>(userStr);
        if (!user) {
          localStorage.removeItem('user');
          state.loading = false;
          return;
        }
        state.user = user;
        state.userType = getUserType(user.role);
        state.isAuthenticated = true;
        const orgStr = localStorage.getItem('organization');
        const schoolStr = localStorage.getItem('school');
        const organization = parseStored<Organization>(orgStr);
        const school = parseStored<School>(schoolStr);
        if (organization) state.organization = organization;
        else if (orgStr) localStorage.removeItem('organization');
        if (school) state.school = school;
        else if (schoolStr) localStorage.removeItem('school');
      }
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userType = getUserType(action.payload.user.role);
        state.organization = action.payload.organization || null;
        state.school = action.payload.school || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string | undefined) ?? action.error.message ?? 'Login failed';
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.userType = getUserType(action.payload.user.role);
        state.organization = action.payload.organization || state.organization;
        state.school = action.payload.school || state.school;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        // IMPORTANT: do NOT wipe the session here. A transient getMe failure
        // (e.g. backend briefly unreachable during dev) must not log the user
        // out — the response interceptor already clears auth on a GENUINE 401/403.
        // Keeping the hydrated-from-storage state lets the user ride out a
        // momentary backend error and retry on the next navigation.
      })
      .addCase(logoutAction.fulfilled, (state) => {
        Object.assign(state, { ...initialState, loading: false });
      });
  },
});

export const { clearError, hydrateFromStorage, setOrganizationForSchool, setActiveSchool, setUser } = authSlice.actions;
export default authSlice.reducer;
