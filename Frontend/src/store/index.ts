import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer, { hydrateFromStorage } from './slices/authSlice';
import branchReducer from './slices/branchSlice';
import socketReducer from './slices/socketSlice';
import notificationsReducer from './slices/notificationsSlice';
import portalStatusReducer from './slices/portalStatusSlice';
import portalSocketReducer from './slices/portalSocketSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    branch: branchReducer,
    socket: socketReducer,
    notifications: notificationsReducer,
    portalStatus: portalStatusReducer,
    portalSocket: portalSocketReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { hydrateFromStorage };
