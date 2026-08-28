'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

interface SuperAdminSidebarLink {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SuperAdminSidebarProps {
  links: SuperAdminSidebarLink[];
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItem({ link, isActive, compact, onMobileClose }: { link: SuperAdminSidebarLink; isActive: boolean; compact: boolean; onMobileClose?: () => void }) {
  return (
    <Link
      href={link.path}
      onClick={onMobileClose}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200',
        compact ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
        isActive
          ? 'bg-white/[0.16] text-white shadow-sm shadow-black/10 ring-1 ring-white/10'
          : 'text-white/75 hover:bg-white/[0.09] hover:text-white'
      )}
      title={compact ? link.label : undefined}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] sa-active-indicator" />
      )}
      <span className={cn(
        'shrink-0 transition-transform duration-200',
        isActive ? 'text-white' : 'text-white/65 group-hover:text-white group-hover:scale-105',
        compact ? 'w-5 h-5' : 'w-[18px] h-[18px]'
      )}>
        {link.icon}
      </span>
      {!compact && <span className="truncate">{link.label}</span>}
    </Link>
  );
}

function UserCard({ expanded, compact, onMobileClose }: { expanded: boolean; compact: boolean; onMobileClose?: () => void }) {
  const { user } = useAppSelector((s) => s.auth);
  return (
    <div className={cn('p-2.5 border-t border-white/[0.08]', compact && 'px-2')}>
      <Link href="/admin/settings" onClick={onMobileClose} className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.06] ring-1 ring-white/[0.08]',
        'hover:bg-white/[0.12] hover:ring-white/[0.15] transition-all duration-200 cursor-pointer group/user',
        compact && 'justify-center px-0'
      )}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-xl object-cover ring-2 ring-white/25 shrink-0 group-hover/user:ring-white/40 transition-all" />
        ) : (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-white/20 to-white/[0.08] flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white/20 group-hover/user:ring-white/30 transition-all">
            {user ? getInitials(user.name) : 'SA'}
          </div>
        )}
        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-white/35 truncate mt-0.5">{user?.email}</p>
          </div>
        )}
        {expanded && (
          <svg className="w-3.5 h-3.5 text-white/25 group-hover/user:text-white/50 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </Link>
    </div>
  );
}

export default function SuperAdminSidebar({ links, collapsed, onToggle, mobileOpen, onMobileClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const expanded = !collapsed || !!mobileOpen;
  const compact = !!collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity" onClick={onMobileClose} />
      )}

      <aside className={cn(
        'sa-brand-gradient fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ease-out border-r border-white/10',
        'w-[252px]', compact ? 'lg:w-[76px]' : 'lg:w-[252px]',
        'lg:translate-x-0', mobileOpen ? 'translate-x-0 shadow-2xl shadow-black/40' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className={cn('flex items-center gap-3 px-5 py-6 border-b border-white/[0.1]', compact && 'justify-center px-2')}>
          <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-white/20 shrink-0 shadow-lg bg-white">
            <img src="/screen.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold leading-tight tracking-tight text-white">SchoolERP</h1>
              <p className="text-[10px] font-medium text-indigo-200/60 uppercase tracking-[0.18em] mt-1">Control center</p>
            </div>
          )}
          {expanded && (
            <button onClick={onMobileClose} className="text-white/40 hover:text-white lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close menu">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {links.map((link) => (
            <NavItem key={link.path} link={link} isActive={pathname === link.path || pathname.startsWith(link.path + '/')} compact={!!compact} onMobileClose={onMobileClose} />
          ))}
        </nav>

        {/* Powered by — app logo ke saath */}
        {expanded && (
          <div className="mx-2.5 mb-2 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3">
            <img src="/screen.png" alt="SchoolERP" className="h-8 w-8 shrink-0 rounded-full bg-white/10 object-contain p-1 ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white/85">Powered by SchoolERP</p>
              <p className="mt-0.5 truncate text-[10px] text-white/35">Digital campus suite</p>
            </div>
          </div>
        )}

        <UserCard expanded={expanded} compact={compact} onMobileClose={onMobileClose} />

        <button onClick={onToggle} className="absolute -right-3 top-[72px] w-6 h-6 bg-primary-600 border-2 border-white rounded-full hidden lg:flex items-center justify-center text-white hover:bg-primary-500 z-10 shadow-lg shadow-primary-900/30 transition-all duration-200 hover:scale-110" aria-label="Toggle sidebar">
          <svg className={cn('w-2.5 h-2.5 transition-transform duration-300', collapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}
