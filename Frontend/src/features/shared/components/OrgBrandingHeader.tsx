import Logo from './Logo';

interface OrgBrandingHeaderProps {
  name: string;
  orgName?: string | null;
  logoUrl?: string | null;
  themeColor: string;
}

/** Branded login card header: org logo + name + theme accent bar. */
export default function OrgBrandingHeader({ name, orgName, logoUrl, themeColor }: OrgBrandingHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <Logo src={logoUrl} name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{name}</h1>
          {orgName && <p className="text-sm text-gray-500 truncate">{orgName}</p>}
        </div>
      </div>
      <div className="h-1 w-12 rounded-full mt-4" style={{ backgroundColor: themeColor }} />
    </div>
  );
}
