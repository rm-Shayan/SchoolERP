'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { orgService } from '@/lib/api';
import type { OrgPublicData } from '@/lib/api/orgService';
import Logo from '@/features/shared/components/Logo';
import Loading from '@/features/shared/components/Loading';
import { darkenHex } from '@/features/shared/components/authLayoutTheme';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';
import PublicAdmissionForm from './PublicAdmissionForm';

export default function PublicAdmissionPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [org, setOrg] = useState<OrgPublicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
    return () => {
      alive = false;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-2xl font-black text-gray-900">{error}</h1>
        <Link href="/" className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
          Back to home
        </Link>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loading label={undefined} />
      </div>
    );
  }

  const theme = org.themeColor || '#2563eb';

  useEffect(() => {
    applyPortalThemeToRoot(org.themeColor);
    return () => clearPortalThemeFromRoot();
  }, [org.themeColor]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="text-white"
        style={{ background: `linear-gradient(135deg, ${theme}, ${darkenHex(theme) ?? theme})` }}
      >
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Logo src={org.logoUrl} name={org.name} size="md" />
              <div className="min-w-0">
                <h1 className="text-lg font-black truncate">{org.name}</h1>
                <p className="text-xs text-white/80">Admission Form</p>
              </div>
            </div>
            <Link
              href={`/o/${org.slug}`}
              className="shrink-0 rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {submitted ? (
          <SuccessScreen onNew={() => setSubmitted(false)} theme={theme} />
        ) : (
          <PublicAdmissionForm org={org} onSubmitted={() => setSubmitted(true)} />
        )}
      </main>
    </div>
  );
}

function SuccessScreen({ onNew, theme }: { onNew: () => void; theme: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: theme }}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      </div>
      <h2 className="mt-5 text-2xl font-black text-gray-900">Application received!</h2>
      <p className="mt-2 text-sm text-gray-500">
        The school office will contact you soon regarding the admission process. Your inquiry
        has been received — the school will reach out to you shortly.
      </p>
      <button
        onClick={onNew}
        className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: theme }}
      >
        Submit another application
      </button>
    </div>
  );
}
