'use client';

import { cn } from '@/lib/utils';

/** Shimmer placeholder — use with sizing utilities, e.g. <Sk className="h-4 w-40" />. */
export function Sk({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('sk', className)} style={style} aria-hidden="true" />;
}
