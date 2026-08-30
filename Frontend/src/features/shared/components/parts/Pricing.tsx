'use client';

import { useState } from 'react';
import DemoCheckoutModal from './DemoCheckoutModal';

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  students: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    students: 'Up to 300 students',
    tagline: 'For small schools going digital for the first time.',
    features: [
      'Attendance & markbook',
      'Fee collection & receipts',
      'Parent portal',
      'Email + WhatsApp alerts',
      'Single campus',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$99',
    students: 'Up to 1,500 students',
    tagline: 'For growing schools that need multi-branch power.',
    features: [
      'Everything in Starter',
      'Multi-branch management',
      'Student ID cards',
      'Exam results & grading',
      'Advanced reports',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    students: 'Unlimited',
    tagline: 'For campus networks and high-roll institutions.',
    features: [
      'Everything in Growth',
      'Unlimited campuses',
      'Custom integrations',
      'Dedicated success manager',
      'On-premise option',
    ],
  },
];

export default function Pricing() {
  const [plan, setPlan] = useState<PricingPlan | null>(null);

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.06),_transparent_55%)]" />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">
          Simple, honest pricing
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Pick the plan that fits your school
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-gray-500">
          Every plan includes onboarding, training, and priority support. No hidden fees — cancel anytime.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              p.popular
                ? 'border-primary-300 shadow-lg shadow-primary-600/10 ring-1 ring-primary-200'
                : 'border-gray-200 hover:shadow-gray-900/5'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-primary-600/25">
                Most popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                {p.students}
              </span>
            </div>
            <div className="mt-5 flex items-end gap-1">
              <span className={`text-4xl font-black tracking-tight ${p.popular ? 'bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                {p.price}
              </span>
              {p.price !== 'Custom' && <span className="pb-1 text-sm font-medium text-gray-400">/month</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{p.tagline}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setPlan(p)}
              className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 ${
                p.popular
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25 hover:shadow-xl hover:brightness-110'
                  : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              Continue
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        Demo checkout only — no real payment is processed. SchoolERP is provisioned by our platform team.
      </p>

      {plan && <DemoCheckoutModal plan={plan} onClose={() => setPlan(null)} />}
    </section>
  );
}