import OrgLandingPage from '@/features/public/components/OrgLandingPage';
import { getServerOrgPublic, getAllOrgSlugs } from '@/lib/server/orgPublic';

// ISR: built static HTML refreshes in the background every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllOrgSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function OrgLandingPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getServerOrgPublic(slug);
  if (!org) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center"><div><h1 className="text-xl font-bold text-slate-900">Organization unavailable</h1><p className="mt-2 text-sm text-slate-500">We could not load this organization right now.</p></div></div>;
  return <OrgLandingPage initialOrg={org} />;
}
