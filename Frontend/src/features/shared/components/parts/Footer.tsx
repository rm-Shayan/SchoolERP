import Link from 'next/link';

const companyLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Why us', href: '#why-us' },
  { label: 'Get access', href: '#access' },
];

const socialLinks = [
  { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4V8h4v1.5A4.5 4.5 0 0116 8zM2 9h4v12H2zM4 4a2 2 0 100 4 2 2 0 000-4z' },
  { label: 'X / Twitter', path: 'M18.9 3H22l-7.2 8.2L23 21h-6.6l-5.2-6.8L5.3 21H2l7.7-8.8L1.5 3h6.8l4.7 6.2L18.9 3zm-1.1 16h1.8L7.1 4.9H5.2L17.8 19z' },
  { label: 'Facebook', path: 'M18 3H6a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3zm-1.5 9h-2v6h-3v-6h-2V9h2V7.5A2.5 2.5 0 0114 5h2.5v3H15a1 1 0 00-1 1v.5h2.5L16.5 12z' },
];

function FooterLogo() {
  return (
    <div className="sa-brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-primary-700/30">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-200 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <FooterLogo />
              <div>
                <p className="text-lg font-extrabold text-gray-900">SchoolERP</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">School Management</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-500">
              Helps educational institutions automate daily operations, improve parent communication, and deliver a better digital experience for staff and students.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((s) => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Company</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-gray-500 transition-colors hover:text-primary-600">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Resources</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/login" className="text-gray-500 transition-colors hover:text-primary-600">Login</Link></li>
              <li><Link href="/admin/login" className="text-gray-500 transition-colors hover:text-primary-600">Admin access</Link></li>
              <li><a href="#" className="text-gray-500 transition-colors hover:text-primary-600">Documentation</a></li>
              <li><a href="#" className="text-gray-500 transition-colors hover:text-primary-600">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Contact</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-500">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                hello@schoolerp.com
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                +1 (415) 849-2239
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                24/7 support for your campus
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200 pt-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SchoolERP. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-primary-600">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-primary-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}