import Link from 'next/link';
import type { PricingPlan } from './Pricing';

interface Props {
  plan: PricingPlan;
  democode: string;
  onClose: () => void;
}

export default function CheckoutSuccess({ plan, democode, onClose }: Props) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-50 ring-8 ring-secondary-50/40">
        <svg className="h-8 w-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="mt-5 text-xl font-black text-gray-900">You&apos;re all set!</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        This was a demo checkout — no real charge. Our team will provision your {plan.name} school portal shortly.
      </p>
      <div className="mt-5 rounded-2xl border border-dashed border-primary-300 bg-primary-50/60 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Your demo school code</p>
        <p className="mt-1 font-mono text-2xl font-black tracking-widest text-gray-900">{democode}</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/login"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:brightness-110"
        >
          Sign in to demo portal
        </Link>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border-2 border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-primary-300 hover:bg-primary-50/50"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}