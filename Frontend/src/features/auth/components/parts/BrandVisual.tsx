import { getInitials } from '@/lib/utils';

interface BrandVisualProps {
  name: string;
  logoUrl?: string | null;
}

export default function BrandVisual({ name, logoUrl }: BrandVisualProps) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className="h-full w-full object-contain" />;
  }
  return <span className="text-lg font-extrabold tracking-tight text-slate-700">{getInitials(name)}</span>;
}
