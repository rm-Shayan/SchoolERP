import { cn, getInitials } from '@/lib/utils';

interface LogoProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ src, name, size = 'md', className }: LogoProps) {
  const sizes = { xs: 'h-6 w-6 text-[9px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(sizes[size], 'rounded-lg object-contain bg-white p-0.5 border border-gray-200', className)}
      />
    );
  }

  return (
    <div className={cn(sizes[size], 'rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shrink-0', className)}>
      {getInitials(name)}
    </div>
  );
}
