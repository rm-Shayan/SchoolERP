'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';

/**
 * Subscribe to one or more socket events and call `refresh` when any arrive.
 * The callback is debounced (300ms) so rapid bursts (e.g. bulk imports) don't
 * hammer the API.
 *
 * Usage:
 *   const { refetch } = useStudentsQuery(schoolId);
 *   useRealtimeRefresh(['admission_created', 'admission_enrolled'], refetch);
 */
export function useRealtimeRefresh(events: string[], refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !events.length) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        refreshRef.current();
      }, 300);
    };

    events.forEach((event) => socket.on(event, debouncedRefresh));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => socket.off(event, debouncedRefresh));
    };
  }, [events.join(',')]);
}
