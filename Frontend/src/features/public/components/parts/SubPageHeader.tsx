import type { OrgPublicData } from '@/lib/api/orgService';
import { darkenHex } from '@/features/shared/components/authLayoutTheme';

interface SubPageHeaderProps {
  org: OrgPublicData;
  theme: string;
  eyebrow: string;
  title: string;
  description: string;
}

export default function SubPageHeader({ org, theme, eyebrow, title, description }: SubPageHeaderProps) {
  const gradient = `linear-gradient(135deg, ${theme}, ${darkenHex(theme) || theme})`;
  return (
    <section className="relative overflow-hidden text-white" style={{ background: gradient }}>
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-white/[0.07] blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
          {description}
        </p>
        {org.phone && (
          <p className="mt-8 text-sm text-white/70">
            Questions? Call us at{' '}
            <a href={`tel:${org.phone}`} className="font-bold text-white underline-offset-4 hover:underline">
              {org.phone}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}