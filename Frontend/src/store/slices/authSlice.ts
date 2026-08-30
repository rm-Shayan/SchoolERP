'use client';

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { User, Organization, School, LoginRequest, UserType } from '@/types';
import { authService, setTokens, clearAuth, getRefreshToken, orgService, schoolService } from '@/lib/api';
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
  try { return JSON.parse(value) as T; } catch { return null; }
}

const initialState: AuthState = {
  user: null, userType: null, organization: null, school: null,
  isAuthenticated: false, loading: false, error: null,
};
const errMessage = (err: unknown, fallback: string): string => {
  const a = err as AxiosError<{ message?: string }>;
  return a.response?.data?.message || a.message || fallback;
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginRequest, { rejectWithValue }) => {
  try {
    const result = await authService.login(credentials);
    setTokens(result.accessToken, result.refreshToken);
    const org = getNestedOrg(result.user) ?? result.organization;
    const school = pickActiveSchool(result.user, result.school);
    persistAuth(result.user, org, school);
    return { ...result, organization: org ?? null, school: school ?? null };
  } catch (err) { return rejectWithValue(errMessage(err, 'Login failed')); }
});

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const user = await authService.getMe();
  let org = getNestedOrg(user) ?? null;
  let school = getNestedSchool(user) ?? null;
  if (user.role === 'SUPER_ADMIN' && user.organizationId) {
    try { org = org ?? await orgService.getById(user.organizationId); } catch { /* ignore */ }
  }
  if (!school && user.schoolId) {
    try { school = await schoolService.getById(user.schoolId); } catch { /* ignore */ }
  }
  const activeSchool = pickActiveSchool(user, school);
  persistAuth(user, org, activeSchool);
  return { user, organization: org, school: activeSchool };
});

// Branch switcher: same account, no new credentials — token re-scoped to target branch.
export const switchBranch = createAsyncThunk('auth/switchBranch', async (schoolId: string, { rejectWithValue }) => {
  try {
    const result = await authService.switchBranch(schoolId);
    setTokens(result.accessToken, getRefreshToken() ?? '');
    const org = getNestedOrg(result.user) ?? null;
    const school = pickActiveSchool(result.user, null);
    persistAuth(result.user, org, school);
    return { user: result.user, organization: org, school };
  } catch (err) { return rejectWithValue(errMessage(err, 'Failed to switch branch')); }
});
export const logoutAction = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) { try { await authService.logout(refreshToken); } catch { /* ignore */ } }
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
        if (!user) { localStorage.removeItem('user'); state.loading = false; return; }
        state.user = user;
        state.userType = getUserType(user.role);
        state.isAuthenticated = true;
        const organization = parseStored<Organization>(localStorage.getItem('organization'));
        const school = parseStored<School>(localStorage.getItem('school'));
        if (organization) state.organization = organization;
        if (school) state.school = school;
      }
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false; state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userType = getUserType(action.payload.user.role);
        state.organization = action.payload.organization || null;
        state.school = action.payload.school || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false; state.error = (action.payload as string | undefined) ?? action.error.message ?? 'Login failed';
      })
      .addCase(switchBranch.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(switchBranch.fulfilled, (state, action) => {
        state.loading = false; state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userType = getUserType(action.payload.user.role);
        state.organization = action.payload.organization || state.organization;
        state.school = action.payload.school;
      })
      .addCase(switchBranch.rejected, (state, action) => {
        state.loading = false; state.error = (action.payload as string | undefined) ?? action.error.message ?? 'Failed to switch branch';
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false; state.isAuthenticated = true;
        state.user = action.payload.user;
        state.userType = getUserType(action.payload.user.role);
        state.organization = action.payload.organization || state.organization;
        state.school = action.payload.school || state.school;
      })
      // Interceptor hi genuine 401/403 par logout karta hai — transient getMe failure par session mat girao.
      .addCase(loadUser.rejected, (state) => { state.loading = false; })
      .addCase(logoutAction.fulfilled, (state) => { Object.assign(state, { ...initialState, loading: false }); });
  },
});

export const { clearError, hydrateFromStorage, setOrganizationForSchool, setActiveSchool, setUser } = authSlice.actions;
export default authSlice.reducer;