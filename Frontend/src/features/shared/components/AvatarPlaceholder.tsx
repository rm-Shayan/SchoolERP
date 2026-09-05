import { cn } from '@/lib/utils';

interface AvatarPlaceholderProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Generic avatar placeholder — soft neutral gradient + person silhouette.
 *  Jab koi photo nahi hai (ya load fail ho jaye) to profile/child tiles ke liye. */
export default function AvatarPlaceholder({ className, style }: AvatarPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 ring-1 ring-inset ring-white/70 shadow-sm',
        className
      )}
      style={style}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[52%] w-[52%] text-slate-400">
        <path d="M12 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 14.5c-5.13 0-9.5 2.23-9.5 5.5v.5h19v-.5c0-3.27-4.37-5.5-9.5-5.5Z" />
      </svg>
    </div>
  );
}
