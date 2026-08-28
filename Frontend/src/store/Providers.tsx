'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store, hydrateFromStorage } from './index';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);

  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </Provider>
  );
}
