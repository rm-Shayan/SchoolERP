import { cn } from '@/lib/utils';

interface OrgSectionHeadingProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
  theme: string;
  center?: boolean;
  className?: string;
}

export default function OrgSectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  theme,
  center = true,
  className,
}: OrgSectionHeadingProps) {
  return (
    <div className={cn(center ? 'mx-auto text-center' : '', 'max-w-2xl', className)}>
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `${theme}0f`, color: theme }}
      >
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: theme }} />
        {eyebrow}
      </span>
      <h2 className="mt-6 text-balance text-4xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
        {title}
        {highlight && (
          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400 bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </h2>
      {description && (
        <p className="mt-5 text-pretty text-base leading-relaxed text-gray-500 sm:text-lg">{description}</p>
      )}
    </div>
  );
}
