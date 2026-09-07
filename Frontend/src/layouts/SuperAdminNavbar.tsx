'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutAction } from '@/store/slices/authSlice';
import { cn, getInitials } from '@/lib/utils';
import NotificationMenu from './parts/NotificationMenu';

interface SuperAdminNavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function SuperAdminNavbar({ title, onMenuClick }: SuperAdminNavbarProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutAction());
    router.push('/admin/login');
  };

  return (
    <header className="h-14 sm:h-16 sm:h-[72px] bg-white/90 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30">
      <div className="h-full px-3 sm:px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-500 hover:text-gray-700 lg:hidden -ml-2 shrink-0 rounded-xl hover:bg-gray-100 transition-all duration-200"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {/* App logo — on mobile the sidebar is hidden, so the logo appears here */}
          <img src="/screen.png" alt="SchoolERP" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-contain bg-white ring-1 ring-primary-200/60 lg:hidden" />
          <div className="min-w-0"><p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h2 className="text-sm sm:text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">{title}</h2></div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationMenu />
          <div className="hidden sm:block h-6 w-px bg-gray-200/60 mx-1" aria-hidden="true" />
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 p-1.5 pr-2 rounded-2xl hover:bg-gray-100/80 transition-all duration-200"
              aria-label="User menu"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-2xl object-cover ring-2 ring-primary-200/60 transition-shadow hover:ring-primary-300/80" />
              ) : (
                <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm shadow-primary-500/20 transition-transform hover:scale-105">
                  {user ? getInitials(user.name) : '?'}
                </div>
              )}                <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{user?.name}</p>
              </div>
              <svg
                className={cn('w-4 h-4 text-gray-400 hidden md:block transition-transform duration-200', open && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100/80 z-50 overflow-hidden origin-top-right sa-fade-in">
                  <div className="sa-brand-gradient px-4 py-4">
                    <div className="flex items-center gap-3">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white/50 shrink-0" />
                      ) : (
                        <div className="h-11 w-11 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {user ? getInitials(user.name) : '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-white/70 truncate">{user?.email}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mt-0.5">
                          Super Admin
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/admin/settings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200"
                    >
                      <span className="h-8 w-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      Profile & Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
                    >
                      <span className="h-8 w-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </span>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
