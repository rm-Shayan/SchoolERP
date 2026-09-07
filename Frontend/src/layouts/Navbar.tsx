'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutAction } from '@/store/slices/authSlice';
import { getInitials, getRoleLabel } from '@/lib/utils';
import NotificationMenu from './parts/NotificationMenu';
import PortalStatusPill from './parts/PortalStatusPill';

interface NavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Navbar({ title, onMenuClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { user, school, organization } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const logo = school?.logoUrl || organization?.logoUrl || '/screen.png';
  // Organization branding is the source of truth across every org portal page.
  // A branch may have its own color for branch-only contexts, but it must not
  // override the organization's theme in the org admin portal.
  const themeColor = organization?.themeColor || school?.themeColor || '#6d28d9';

  const handleLogout = async () => {
    await dispatch(logoutAction());
    // On logout, redirect to the unified login page with the org slug
    router.push(organization?.slug ? `/login?org=${organization.slug}` : '/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm shadow-slate-100/30">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}cc, ${themeColor})` }} />

      <div className="flex h-20 items-center gap-2 md:gap-3 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="-ml-1 shrink-0 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl lg:hidden transition-colors"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {logo && (
            <img
              src={logo}
              alt={school?.name ?? organization?.name ?? 'logo'}
              className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg object-contain"
            />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold tracking-tight text-slate-900 md:text-lg">
              {school?.name ?? organization?.name ?? title}
            </h2>
            {!isSuperAdmin && organization?.name && school?.name !== organization.name && (
              <p className="truncate text-xs font-semibold text-slate-400">{organization.name}</p>
            )}
          </div>
          {!isSuperAdmin && (
            <span className="hidden shrink-0 sm:inline-flex ml-2.5">
              <PortalStatusPill />
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <NotificationMenu />
          <div className="mx-1.5 hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-xl p-1 px-2.5 border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300"
              aria-label="User menu"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-100/50" />
              ) : logo ? (
                <img src={logo} alt={school?.name ?? organization?.name ?? 'logo'} className="h-8 w-8 rounded-full object-contain ring-2 ring-primary-100/50 bg-white p-0.5" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white border border-white/20" style={{ backgroundColor: themeColor }}>
                  {user ? getInitials(user.name) : '?'}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-950 leading-tight">{user?.name}</p>
                {user && user.role !== 'SUPER_ADMIN' && (
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{getRoleLabel(user.role)}</p>
                )}
              </div>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 z-50 mt-2.5 w-60 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50">
                  <div className="border-b border-slate-100 px-4 py-3.5 mb-1">
                    <p className="text-xs font-bold text-slate-950">{user?.name}</p>
                    <p className="truncate text-[11px] font-medium text-slate-400 mt-0.5">{user?.email}</p>
                    {school && <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-wide" style={{ color: themeColor }}>{school.name}</p>}
                  </div>
                  {isSuperAdmin && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setOpen(false)}
                      className="block w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Profile & Settings
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
