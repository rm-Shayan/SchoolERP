'use client';

import { memo } from 'react';
import type { Homework } from '@/lib/api/homeworkService';
import { Card } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';

interface HomeworkTeacherCardProps {
  name: string;
  items: Homework[];
  onEdit?: (hw: Homework) => void;
  onDelete?: (hw: Homework) => void;
}

function sectionLabel(hw: Homework): string {
  if (hw.section?.class) return `${hw.section.class.name} — ${hw.section.name}`;
  return 'Section';
}

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/** A grouped card for one teacher — all their homework in a compact table layout. */
const HomeworkTeacherCard = memo(function HomeworkTeacherCard({ name, items, onEdit, onDelete }: HomeworkTeacherCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/70">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/70 shadow-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[52%] w-[52%] text-slate-400">
            <path d="M12 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 14.5c-5.13 0-9.5 2.23-9.5 5.5v.5h19v-.5c0-3.27-4.37-5.5-9.5-5.5Z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-[11px] text-gray-400">
            {items.length} {items.length === 1 ? 'homework post' : 'homework posts'}
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
        {items.map((hw) => (
          <div key={hw.id} className="px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">{sectionLabel(hw)}</p>
                <h4 className="text-sm font-medium text-gray-900 mt-0.5 leading-snug">{hw.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap mt-0.5 leading-relaxed">{hw.content}</p>
                <p className="sm:hidden text-[11px] text-gray-400 mt-1">{formatDate(hw.sentAt)}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                <span className="hidden sm:block text-[11px] text-gray-400 mr-1.5">{formatDate(hw.sentAt)}</span>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(hw)}
                    aria-label={`Edit ${hw.title}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <PencilIcon />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(hw)}
                    aria-label={`Delete ${hw.title}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

export default HomeworkTeacherCard;
