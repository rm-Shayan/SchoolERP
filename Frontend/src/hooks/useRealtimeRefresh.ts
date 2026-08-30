'use client';

import { useEffect, useRef, useMemo } from 'react';
import { getSocket } from '@/lib/socket';

/**
 * Subscribe to socket events and call `refresh` when any arrive.
 * Debounced (300ms) to prevent burst re-fetches.
 * Events array is compared by value (joined string), not reference.
 */
export function useRealtimeRefresh(events: string[], refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Memoize the joined key so the effect only re-runs when events actually change
  const eventsKey = useMemo(() => events.join(','), [events.join(',')]);

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
  }, [eventsKey]);
}
