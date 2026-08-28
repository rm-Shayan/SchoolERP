'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface CredentialsBannerProps {
  credentials: { email: string; password: string };
  onDismiss: () => void;
}

export default function CredentialsBanner({ credentials, onDismiss }: CredentialsBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${credentials.email}\n${credentials.password}`);
      setCopied(true);
      toast.success('Credentials copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 sm:p-5 bg-gradient-to-r from-primary-50 via-primary-50/70 to-white border border-primary-200/80 rounded-2xl shadow-sm shadow-primary-100/50 sa-fade-in overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary-400" />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary-900">Branch admin created</p>
          <p className="text-xs text-primary-700">
            Credentials were emailed. Save them now — the password won&apos;t be shown again.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-primary-400 hover:text-primary-700 hover:bg-primary-100 p-1.5 rounded-xl shrink-0 transition-all duration-200"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl bg-white/70 border border-primary-200/50 px-3 py-2.5">
        <div className="flex-1 min-w-0 grid grid-cols-1 gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary-600 font-semibold w-16 shrink-0">Email</span>
            <span className="font-mono text-gray-800 truncate">{credentials.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary-600 font-semibold w-16 shrink-0">Password</span>
            <span className="font-mono text-gray-800 truncate">{credentials.password}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary-700 bg-primary-100 hover:bg-primary-200 transition-all duration-200"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
