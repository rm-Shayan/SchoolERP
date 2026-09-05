'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { getApiErrorMessage } from '@/lib/utils';
import { parentService, PARENT_PROFILE_UPDATED_EVENT } from '@/lib/api/parentService';
import PortalNotificationBell from './notifications/PortalNotificationBell';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';

interface Props {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  canEditPhoto?: boolean;
  onMenuClick?: () => void;
  onLogout: () => void;
}

export default function PortalTopBar({ title, subtitle, avatarUrl, canEditPhoto, onMenuClick, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const color = getOrgThemeColor() || '#6366f1';

  const avatar = avatarUrl && !imgFailed ? (
    <img src={avatarUrl} alt={title} onError={() => setImgFailed(true)} className="h-8 w-8 rounded-full object-cover ring-2" style={{ boxShadow: `0 0 0 2px ${color}55` }} />
  ) : (
    <AvatarPlaceholder className="h-8 w-8 rounded-full" />
  );

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await parentService.uploadAvatar(file);
      setOpen(false);
      toast.success('Profile photo updated');
      window.dispatchEvent(new Event(PARENT_PROFILE_UPDATED_EVENT));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Photo upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 shadow-sm shadow-slate-100/30 backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}cc, ${color})` }} />
      <div className="flex h-16 items-center gap-2 px-4 md:gap-3 md:px-6">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="-ml-1 shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="truncate text-xs font-medium text-slate-400">{subtitle}</p>
        </div>

        <PortalNotificationBell />

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-xl border border-transparent p-1 px-2 hover:border-slate-100 hover:bg-slate-50 transition-all duration-300"
            aria-label="User menu"
          >
            {avatar}
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-tight text-slate-950">{title}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {subtitle.includes('·') ? subtitle.split('·')[0].trim() : subtitle}
              </p>
            </div>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-50 mt-2.5 w-60 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50">
                <div className="mb-1 border-b border-slate-100 px-4 py-3.5">
                  <p className="truncate text-xs font-bold text-slate-950">{title}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{subtitle}</p>
                </div>
                {canEditPhoto && (
                  <>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex w-full items-center gap-2.5 rounded-lg px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      {uploading ? 'Uploading…' : 'Change photo'}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                  </>
                )}
                <button onClick={onLogout} className="w-full rounded-lg px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
