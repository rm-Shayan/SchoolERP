'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PricingPlan } from './Pricing';
import CheckoutSuccess from './CheckoutSuccess';

type Step = 'setup' | 'payment' | 'done';

interface Props {
  plan: PricingPlan;
  onClose: () => void;
}

export default function DemoCheckoutModal({ plan, onClose }: Props) {
  const [step, setStep] = useState<Step>('setup');
  const [migrating, setMigrating] = useState(true);
  const [paying, setPaying] = useState(false);
  const [democode, setDemocode] = useState('');
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', exp: '12/26', cvc: '123' });
  const inputClass =
    'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100';
  const updateCard = (field: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((c) => ({ ...c, [field]: e.target.value }));

  const cardIncomplete = card.number.replace(/\s/g, '').length < 15 || card.exp.length < 4 || card.cvc.length < 3;

  const finishPay = () => {
    if (cardIncomplete) return;
    setPaying(true);
    window.setTimeout(() => {
      setDemocode(`SCH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
      setPaying(false);
      setStep('done');
    }, 1400);
  };

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">SchoolERP checkout</h3>
              <p className="text-xs font-semibold text-gray-400">{plan.name} plan · {plan.price}{plan.price !== 'Custom' && '/month'}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex gap-1.5 px-6 pt-5">
            {(['setup', 'payment', 'done'] as Step[]).map((s) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${step === s ? 'bg-primary-500' : 'bg-gray-100'}`} />
            ))}
          </div>

          <div className="px-6 py-6">
            {step === 'setup' && (
              <div>
                <p className="text-sm font-semibold text-gray-700">What best describes you?</p>
                <div className="mt-3 grid gap-3">
                  {[
                    { v: true, t: 'We already run a school system', d: 'Switching from another software — migration support included.' },
                    { v: false, t: "We're new to SchoolERP", d: 'Starting fresh — we will help you set everything up.' },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      onClick={() => setMigrating(o.v)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        migrating === o.v ? 'border-primary-400 bg-primary-50/70 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${migrating === o.v ? 'border-primary-500' : 'border-gray-300'}`}>
                          {migrating === o.v && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                        </span>
                        {o.t}
                      </p>
                      <p className="mt-1 pl-7 text-xs text-gray-500">{o.d}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep('payment')}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:brightness-110"
                >
                  Continue to payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Demo payment · {plan.price}{plan.price !== 'Custom' && '/month'}{migrating ? ' · migration' : ' · new setup'}
                </p>
                <div className="mt-3 grid gap-3">
                  <input value={card.number} onChange={updateCard('number')} aria-label="Card number" className={inputClass} />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={card.exp} onChange={updateCard('exp')} aria-label="Expiry" className={inputClass} />
                    <input value={card.cvc} onChange={updateCard('cvc')} aria-label="CVC" className={inputClass} />
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-secondary-50 px-4 py-2.5 text-xs font-medium text-secondary-700 ring-1 ring-secondary-200">
                  This is a preview checkout — nothing is charged and no card is stored.
                </p>
                <button
                  onClick={finishPay}
                  disabled={paying || cardIncomplete}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {paying ? 'Processing…' : `Pay ${plan.price} (demo)`}
                </button>
              </div>
            )}

            {step === 'done' && <CheckoutSuccess plan={plan} democode={democode} onClose={onClose} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}