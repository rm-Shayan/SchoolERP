'use client';

import { useState, type ReactNode } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  /** Fixed row height in px — used to calculate windowing. */
  rowHeight: number;
  getKey: (item: T, index: number) => string;
  renderRow: (item: T, index: number) => ReactNode;
  /** Scroll container height in px. */
  height?: number;
  /** Extra rows above/below viewport (prevents scroll flicker). */
  overscan?: number;
  className?: string;
  empty?: ReactNode;
}

/**
 * Lightweight virtualization — no library needed. For large lists (10,000+ records),
 * only the visible slice is in the DOM (window calculated from scrollTop); the
 * remaining rows are just spacer height — so instead of rendering ~100 nodes, ~20 are rendered.
 */
export function VirtualizedList<T>({
  items,
  rowHeight,
  getKey,
  renderRow,
  height = 480,
  overscan = 6,
  className = '',
  empty,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);
  const totalHeight = items.length * rowHeight;

  if (items.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <div
      className={`overflow-y-auto overscroll-contain ${className}`}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {slice.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={getKey(item, index)}
              style={{
                position: 'absolute',
                top: index * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
            >
              {renderRow(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
