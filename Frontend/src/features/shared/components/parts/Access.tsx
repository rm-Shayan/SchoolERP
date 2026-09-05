import Link from 'next/link';

export default function Access() {
  return (
    <section id="access" className="relative overflow-hidden py-24 text-white">
      <div className="sa-brand-gradient absolute inset-0" />
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-10 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/8 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-200">Portal access</p>
        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          Your school portal, provisioned by your platform administrator.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">
          SchoolERP is deployed to schools and campus networks by the platform team. Once your organization is
          onboarded, every role gets access instantly with no signup forms.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-base font-bold text-primary-800 shadow-xl shadow-black/10 transition-all duration-200 hover:shadow-2xl hover:brightness-105">
            School &amp; staff sign in
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/10">
            Parent &amp; student sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-primary-200/80">
          Already part of the platform? Your administrator has your portal ready.
        </p>
        <a
          href="#pricing"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white/90 underline-offset-4 transition hover:text-white hover:underline"
        >
          Review plans &amp; pricing
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" /></svg>
        </a>
      </div>
    </section>
  );
}
