import { cn } from '@/lib/utils';
import { platformLogoFallback } from '@/lib/utils/logo';

interface LogoProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ src, name, size = 'md', className }: LogoProps) {
  const sizes = { xs: 'h-6 w-6 text-[9px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

  // Fallback chain: given logo → platform logo (broken URLs swap via onError).
  return (
    <img
      src={src || '/screen.png'}
      alt={name}
      onError={platformLogoFallback}
      className={cn(sizes[size], 'rounded-lg object-contain bg-white border border-gray-200', className)}
    />
  );
}
