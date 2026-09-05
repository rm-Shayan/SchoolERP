'use client';

import { type ReactNode, useRef, useEffect, useState } from 'react';
import { Button } from '@/features/shared/components';
import type { DirectoryItem } from '@/lib/api/staffService';

interface ActionsMenuProps {
  member: DirectoryItem;
  onEdit: (m: DirectoryItem) => void;
  onDelete: (m: DirectoryItem) => void;
  onResetPassword: (m: DirectoryItem) => void;
  onBlock: (m: DirectoryItem) => void;
  onUnblock: (m: DirectoryItem) => void;
  blocked: boolean;
}

export default function ActionsMenu({
  member, onEdit, onDelete, onResetPassword, onBlock, onUnblock, blocked,
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(!open)}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          <MenuItem icon="edit" label="Edit" onClick={act(() => onEdit(member))} />
          <MenuItem icon="key" label="Reset Password" onClick={act(() => onResetPassword(member))} />
          <div className="border-t border-gray-100 my-1" />
          {blocked ? (
            <MenuItem icon="check" label="Unblock" onClick={act(() => onUnblock(member))} color="text-green-600 hover:bg-green-50" />
          ) : (
            <MenuItem icon="block" label="Block" onClick={act(() => onBlock(member))} color="text-red-600 hover:bg-red-50" />
          )}
          <div className="border-t border-gray-100 my-1" />
          <MenuItem icon="trash" label="Deactivate" onClick={act(() => onDelete(member))} color="text-red-600 hover:bg-red-50" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, color }: { icon: string; label: string; onClick: React.MouseEventHandler; color?: string }) {
  const icons: Record<string, ReactNode> = {
    edit: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    key: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    check: <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    block: <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    trash: <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  };
  return (
    <button className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${color ?? ''}`} onClick={onClick}>
      {icons[icon]}
      {label}
    </button>
  );
}
