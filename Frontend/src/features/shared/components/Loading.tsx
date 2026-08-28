import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  label?: string;
}

export default function Loading({ className }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 rounded-[20px] border-2 border-primary-100" />
        <span
          className="absolute inset-0 rounded-[20px] border-2 border-transparent border-t-primary-600 border-r-primary-400 animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <img
          src="/screen.png"
          alt=""
          className="absolute inset-2 rounded-[14px] object-contain p-1"
        />
      </div>
    </div>
  );
}
