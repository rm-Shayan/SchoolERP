import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  orgLogoUrl?: string | null;
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

const avatarGradients = [
  'from-violet-400 to-purple-600',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
];

function getGradient(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarGradients[hash % avatarGradients.length];
}

/**
 * User avatar with fallback chain:
 *   user profile picture → org logo → colored initials
 */
export default function UserAvatar({ src, orgLogoUrl, name, size = 'md', className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(sizes[size], 'rounded-full object-cover bg-white border border-gray-200 shrink-0', className)}
      />
    );
  }

  if (orgLogoUrl) {
    return (
      <img
        src={orgLogoUrl}
        alt={name}
        className={cn(sizes[size], 'rounded-full object-contain bg-white border border-gray-200 shrink-0 p-0.5', className)}
      />
    );
  }

  return (
    <div className={cn(sizes[size], `rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`, className)}>
      {getInitials(name)}
    </div>
  );
}
