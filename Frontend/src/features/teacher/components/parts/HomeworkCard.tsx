'use client';

import { memo } from 'react';
import type { Homework } from '@/lib/api/homeworkService';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import Button from '@/features/shared/components/Button';

interface HomeworkCardProps {
  homework: Homework;
  isOwner: boolean;
  onEdit: (hw: Homework) => void;
  onDelete: (hw: Homework) => void;
}

const HomeworkCard = memo(function HomeworkCard({
  homework: hw,
  isOwner,
  onEdit,
  onDelete,
}: HomeworkCardProps) {
  const themeColor = getOrgThemeColor();
  const borderStyle = themeColor ? `border-[${themeColor}30] shadow-[0_1px_3px_${themeColor}08]` : 'border-gray-200 shadow-sm';
  const dividerStyle = themeColor ? `border-t-[${themeColor}20]` : 'border-t-gray-100';
  return (
    <div className={`p-5 rounded-2xl ${borderStyle} bg-white shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{hw.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {hw.section?.class ? `${hw.section.class.name} — ${hw.section.name}` : 'Section'}
          </p>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{formatDate(hw.sentAt)}</span>
      </div>

      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{hw.content}</p>

      {isOwner && (
        <div className={`flex gap-2 mt-3 pt-3 ${dividerStyle}`}>
          <Button size="sm" variant="ghost" onClick={() => onEdit(hw)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(hw)}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
});

export default HomeworkCard;
