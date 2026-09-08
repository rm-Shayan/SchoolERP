'use client';

import { motion } from 'framer-motion';
import { Badge, Button } from '@/features/shared/components';
import type { Circular } from '@/lib/api/circularService';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { AUDIENCE_BADGE, AUDIENCE_LABEL, AUDIENCE_ICON } from './audienceMeta';

interface CircularItemProps {
  circular: Circular;
  deleting: boolean;
  onDelete?: (c: Circular) => void;
}

export default function CircularItem({ circular: c, deleting, onDelete }: CircularItemProps) {
  const themeColor = getOrgThemeColor();
  const iconBg = themeColor
    ? `bg-gradient-to-br from-[${themeColor}15] to-[${themeColor}25] text-[${themeColor}] ring-[${themeColor}30]`
    : 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 ring-1 ring-primary-100';
  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex gap-4 rounded-2xl border bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(124,58,237,0.09)]"
      style={themeColor ? { borderColor: `${themeColor}30`, boxShadow: `0 1px 3px ${themeColor}08` } : { borderColor: '#e2e8f0' }}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${iconBg}`}>
        {AUDIENCE_ICON[c.audience]}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-800">{c.title}</h3>
          <Badge variant={AUDIENCE_BADGE[c.audience]}>{AUDIENCE_LABEL[c.audience]}</Badge>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600 line-clamp-4">{c.content}</p>
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(c.createdAt)}
        </p>
      </div>

      {onDelete && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 self-start text-red-600 hover:bg-red-50"
          loading={deleting}
          onClick={() => onDelete(c)}
        >
          Delete
        </Button>
      )}
    </motion.li>
  );
}
