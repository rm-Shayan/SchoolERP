import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
};

/**
 * User avatar with fallback chain:
 *   user profile picture → colored initials
 */
export default function UserAvatar({ src, name, size = 'md', className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(sizes[size], 'rounded-full object-cover bg-white border border-gray-200 shrink-0', className)}
      />
    );
  }

  return (
    <div className={cn(sizes[size], 'flex items-center justify-center rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 ring-1 ring-inset ring-white/70 shadow-sm shrink-0', className)}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[52%] w-[52%] text-slate-400">
        <path d="M12 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 14.5c-5.13 0-9.5 2.23-9.5 5.5v.5h19v-.5c0-3.27-4.37-5.5-9.5-5.5Z" />
      </svg>
    </div>
  );
}
