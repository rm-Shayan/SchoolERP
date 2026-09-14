'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { orgService } from '@/lib/api';
import type { OrgPublicData } from '@/lib/api/orgService';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';
import PageLoader from '@/components/PageLoader';
import OrgNav from './parts/OrgNav';
import OrgFooter from './parts/OrgFooter';

interface OrgPageShellProps {
  children: (org: OrgPublicData, theme: string) => ReactNode;
}

export default function OrgPageShell({ children }: OrgPageShellProps) {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [org, setOrg] = useState<OrgPublicData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await orgService.getPublicBySlug(slug);
        if (alive) setOrg(data);
      } catch {
        if (alive) setError('Organization not found');
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!org?.themeColor) return;
    applyPortalThemeToRoot(org.themeColor);
    return () => clearPortalThemeFromRoot();
  }, [org?.themeColor]);

  if (error) return <Notfound message={error} />;
  if (!org) return <Spinner />;

  const theme = org.themeColor || '#0f172a';
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <OrgNav org={org} />
      {children(org, theme)}
      <OrgFooter org={org} theme={theme} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <PageLoader />
    </div>
  );
}

function Notfound({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-2xl font-black text-gray-900">{message}</h1>
      <Link href="/" className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to home
      </Link>
    </div>
  );
}