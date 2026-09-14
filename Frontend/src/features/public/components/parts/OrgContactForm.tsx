'use client';
import { useState } from 'react';
import type { OrgPublicData } from '@/lib/api/orgService';
import OrgSectionHeading from './OrgSectionHeading';

export default function OrgContactForm({ org, theme }: { org: OrgPublicData; theme: string }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[32px] border border-gray-200/80 bg-white p-8 text-center shadow-2xl shadow-gray-900/5 sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ backgroundColor: theme }}>
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
          </svg>
        </span>
        <h3 className="mt-5 text-2xl font-black text-gray-900">Thank you!</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          {org.email ? (
            <>Our office is best reached at <b><a href={`mailto:${org.email}`} className="underline">{org.email}</a></b>. You can also call us on the number shown.</>
          ) : (
            <>Please call us on the number above — our team usually responds right away.</>
          )}
        </p>
        <button onClick={() => setSent(false)} className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ backgroundColor: theme }}>
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="rounded-[32px] border border-gray-200/80 bg-white p-8 shadow-2xl shadow-gray-900/5 sm:p-10"
    >
      <OrgSectionHeading
        center={false}
        eyebrow="Send a Message"
        title="Drop us a "
        highlight="quick message"
        description="Fill in the form below and our office team will get back to you."
        theme={theme}
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required placeholder="Full name" />
        <Field label="Phone or WhatsApp" required placeholder="03xx xxxxxxx" />
      </div>
      <div className="mt-5">
        <Field label="Email" placeholder="you@example.com" />
      </div>
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-bold text-gray-700">Message</label>
        <textarea
          required
          rows={5}
          placeholder="How can we help you?"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:bg-white"
        />
      </div>
      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-base font-bold text-white transition hover:brightness-110"
        style={{ backgroundColor: theme, boxShadow: `0 8px 32px ${theme}30` }}
      >
        Send Message
      </button>
    </form>
  );
}

function Field({ label, required, placeholder }: { label: string; required?: boolean; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-gray-700">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:bg-white"
      />
    </div>
  );
}