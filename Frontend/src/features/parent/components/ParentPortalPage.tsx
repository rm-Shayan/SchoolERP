'use client';

import { useEffect, useState } from 'react';
import PortalDashboard from './PortalDashboard';
import PageLoader from '@/components/PageLoader';

export default function ParentPortalPage() {
  // localStorage sirf mount ke baad — warna SSR tree aur client tree alag bante
  // hain (hydration mismatch). Pehla render dono jagah PageLoader hai.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <PageLoader />;
  return <PortalDashboard />;
}
