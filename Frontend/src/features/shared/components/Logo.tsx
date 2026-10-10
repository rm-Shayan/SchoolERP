import { cn } from '@/lib/utils';
import { platformLogoFallback } from '@/lib/utils/logo';

interface LogoProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ src, name, size = 'md', className }: LogoProps) {
  const sizes = { xs: 'h-8 w-8 text-[10px]', sm: 'h-10 w-10 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' };

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
