'use client';
import Link from 'next/link';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgContactDetails from './parts/OrgContactDetails';
import OrgContactForm from './parts/OrgContactForm';

export default function OrgContactPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="Contact Us"
            title="We would love to hear from you"
            description="Whether it is an admission query, a fee question or a visit to the campus â€” our team is ready to help."
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <OrgContactDetails org={org} theme={theme} />
              <OrgContactForm org={org} theme={theme} />
            </div>
          </section>

          <section className="bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-gray-200/80 bg-white p-8 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Prefer to start with an application?</h3>
                  <p className="mt-1 text-sm text-gray-500">Skip the questions â€” apply online and we will take it from there.</p>
                </div>
                <Link href={`/o/${org.slug}/admission`} className="shrink-0 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:brightness-110" style={{ backgroundColor: theme }}>
                  Apply for Admission
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}