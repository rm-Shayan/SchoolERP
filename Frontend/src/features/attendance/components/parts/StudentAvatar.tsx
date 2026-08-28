import { cn } from '@/lib/utils';

interface Props {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md';
}

const SIZES = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs' };

export function StudentAvatar({ imageUrl, firstName, lastName, size = 'md' }: Props) {
  const initials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  const s = SIZES[size];

  return (
    <>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className={cn(s, 'rounded-full object-cover shrink-0')}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div
        className={cn(
          s,
          'rounded-full flex items-center justify-center shrink-0 bg-primary-50 border border-primary-200',
          imageUrl && 'hidden'
        )}
      >
        <span className="font-bold text-primary-600">{initials || '?'}</span>
      </div>
    </>
  );
}
