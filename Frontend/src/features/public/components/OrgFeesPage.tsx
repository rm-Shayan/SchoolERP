'use client';
import Link from 'next/link';
import OrgPageShell from './OrgPageShell';
import SubPageHeader from './parts/SubPageHeader';
import OrgSectionHeading from './parts/OrgSectionHeading';

const feeItems = [
  { title: 'Tuition Fee', amount: 'Monthly', desc: 'Core tuition covering classroom teaching across all subjects.' },
  { title: 'Exam Fee', amount: 'Per term', desc: 'Conducted term examinations, papers and result processing.' },
  { title: 'Computer Lab', amount: 'Monthly', desc: 'Computer literacy and practical IT sessions in the lab.' },
  { title: 'Late Fee', amount: 'After due date', desc: 'A small late charge applies after the monthly due date.' },
  { title: 'Admission Fee', amount: 'One time', desc: 'One-time registration at the time of admission.' },
  { title: 'Security Deposit', amount: 'Refundable', desc: 'Refundable deposit, returned when the student leaves.' },
];

const paymentMethods = [
  { icon: 'M20 12V8H4v4a2 2 0 010 4v4h16v-4a2 2 0 010-4z', title: 'Cash', text: 'Pay at the school office during working hours.' },
  { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', title: 'Bank Transfer', text: 'Transfer to the school bank account and share the receipt.' },
  { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 6h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', title: 'Online', text: 'Pay securely online and get your receipt instantly.' },
];

export default function OrgFeesPage() {
  return (
    <OrgPageShell>
      {(org, theme) => (
        <main>
          <SubPageHeader
            org={org}
            theme={theme}
            eyebrow="Fee Structure"
            title="Clear, transparent fees for every family"
            description="Know exactly what you pay and when. Our fee records are transparent and parents can view payments anytime through the parent portal."
          />

          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <OrgSectionHeading
              eyebrow="What You Pay"
              title="Our fee "
              highlight="components"
              description="The monthly structure is printed on every fee voucher and tracked digitally, so there are never surprises."
              theme={theme}
            />

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {feeItems.map((f) => (
                <div key={f.title} className="rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/8">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                    <span className="shrink-0 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ backgroundColor: `${theme}0f`, color: theme }}>
                      {f.amount}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-gray-100 bg-gray-50 p-8 sm:p-10">
              <p className="text-sm leading-relaxed text-gray-600">
                <b className="text-gray-900">Note:</b> The exact monthly amount is shared with
                parents at admission along with the full breakdown. For any billing question,
                contact the office and ask for the fee desk.
              </p>
            </div>
          </section>

          <section className="bg-gray-50 py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <OrgSectionHeading
                eyebrow="Payments"
                title="Multiple ways "
                highlight="to pay"
                description="Choose whichever is easiest for your family. Every payment is recorded and a receipt is issued."
                theme={theme}
              />
              <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paymentMethods.map((m) => (
                  <div key={m.title} className="rounded-3xl border border-gray-200/80 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gray-900/8">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: theme }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                      </svg>
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-gray-900">{m.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">{m.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4 rounded-[32px] border border-gray-100 bg-white p-10 text-center shadow-xl shadow-gray-900/5 sm:p-14">
                <h3 className="text-2xl font-black text-gray-900 sm:text-3xl">Start your admission journey</h3>
                <p className="max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                  Questions about fees? Talk to our office â€” or simply apply online and we will
                  guide you through every step, including the fee structure for your child&apos;s grade.
                </p>
                <Link
                  href={`/o/${org.slug}/admission`}
                  className="mt-2 inline-flex rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                  style={{ backgroundColor: theme }}
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}
    </OrgPageShell>
  );
}