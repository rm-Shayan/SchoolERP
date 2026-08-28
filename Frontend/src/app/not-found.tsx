import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
        <span className="text-6xl font-black text-slate-300">404</span>
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Go to Login
      </Link>
    </div>
  );
}
