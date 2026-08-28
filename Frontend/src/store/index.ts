import { configureStore } from '@reduxjs/toolkit';
import authReducer, { hydrateFromStorage } from './slices/authSlice';
import branchReducer from './slices/branchSlice';
import socketReducer from './slices/socketSlice';
import notificationsReducer from './slices/notificationsSlice';
import portalStatusReducer from './slices/portalStatusSlice';
import portalSocketReducer from './slices/portalSocketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    branch: branchReducer,
    socket: socketReducer,
    notifications: notificationsReducer,
    portalStatus: portalStatusReducer,
    portalSocket: portalSocketReducer,
  },
});

// hydrateFromStorage ab Providers me useEffect se call hota hai
// taake SSR aur client ka initial render same rahe (hydration mismatch fix).

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export so Providers can dispatch it
export { hydrateFromStorage };
