import { cn } from '@/lib/utils';
import { platformLogoFallback } from '@/lib/utils/logo';

interface LogoProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ src, name, size = 'md', className }: LogoProps) {
  const boxes = {
    xs: 'h-8 w-8 rounded-md',
    sm: 'h-11 w-11 rounded-lg',
    md: 'h-14 w-14 rounded-lg',
    lg: 'h-20 w-20 rounded-xl',
  };

  // Sized box div + img h-full w-full => logo always fills 100% of its box
  // (object-contain keeps it fully inside, never cropped).
  return (
    <div
      className={cn(
        boxes[size],
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-white border border-gray-200',
        className
      )}
    >
      <img
        src={src || '/screen.png'}
        alt={name}
        onError={platformLogoFallback}
        className="h-full w-full object-contain"
      />
    </div>
  );
}