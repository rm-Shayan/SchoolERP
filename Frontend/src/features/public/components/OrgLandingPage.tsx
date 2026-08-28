'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { orgService } from '@/lib/api';
import type { OrgPublicData } from '@/lib/api/orgService';
import { darkenHex } from '@/features/shared/components/authLayoutTheme';
import PageLoader from '@/components/PageLoader';
import OrgNav from './parts/OrgNav';
import OrgHero from './parts/OrgHero';
import OrgStats from './parts/OrgStats';
import OrgAbout from './parts/OrgAbout';
import OrgPrograms from './parts/OrgPrograms';
import OrgCampuses from './parts/OrgCampuses';
import OrgAdmissionCta from './parts/OrgAdmissionCta';
import OrgLoginSection from './parts/OrgLoginSection';
import OrgFooter from './parts/OrgFooter';

export default function OrgLandingPage({ initialOrg }: { initialOrg?: OrgPublicData }) {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [org, setOrg] = useState<OrgPublicData | null>(initialOrg ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (initialOrg) return () => { alive = false; };
    (async () => {
      try {
        const data = await orgService.getPublicBySlug(slug);
        if (alive) setOrg(data);
      } catch {
        if (alive) setError('Organization not found');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (error) return <NotFound message={error} />;
  if (!org) return <PageSpinner />;

  const theme = org.themeColor || '#0f172a';
  const gradient = `linear-gradient(135deg, ${theme}, ${darkenHex(theme) ?? theme})`;

  return (
    <div className="bg-white text-gray-900">
      <OrgNav org={org} />
      <main className="pt-0">
        <OrgHero org={org} gradient={gradient} />
        <OrgLoginSection org={org} theme={theme} />
        <OrgStats org={org} theme={theme} />
        <OrgAbout org={org} theme={theme} />
        <OrgPrograms theme={theme} />
        <OrgCampuses org={org} theme={theme} />
        <OrgAdmissionCta org={org} gradient={gradient} />
      </main>
      <OrgFooter org={org} theme={theme} />
    </div>
  );
}

function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <PageLoader />
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-2xl font-black text-gray-900">{message}</h1>
      <Link href="/" className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to home
      </Link>
    </div>
  );
}
