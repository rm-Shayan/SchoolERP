'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface OrgCreatedPanelProps {
  credentials: { email: string; password: string };
  emailConfigured: boolean;
  defaultBranch: { id: string; name: string; code: string } | null;
  onDashboard: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
    >
      {copied ? (
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"
          />
        </svg>
      )}
    </button>
  );
}

export default function OrgCreatedPanel({ credentials, emailConfigured, defaultBranch, onDashboard }: OrgCreatedPanelProps) {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardContent className="p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Organization Created!</h2>
          <p className="mb-6 text-gray-500">
            Super Admin credentials{emailConfigured ? ' (also emailed)' : ''}:
          </p>
          {!emailConfigured && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-700">
              Email could not be delivered — SMTP is not configured on the server. Save these
              credentials now and share them manually.
            </p>
          )}
          <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-left">
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-16 shrink-0 text-left text-sm text-gray-500">Email:</span>
              <span className="min-w-0 flex-1 break-all font-mono text-sm font-medium text-gray-900">
                {credentials.email}
              </span>
              <CopyButton value={credentials.email} label="Email" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-16 shrink-0 text-left text-sm text-gray-500">Password:</span>
              <span className="min-w-0 flex-1 break-all font-mono text-sm font-medium text-gray-900">
                {credentials.password}
              </span>
              <CopyButton value={credentials.password} label="Password" />
            </div>
            {defaultBranch && (
              <div className="flex min-w-0 items-center gap-2 border-t border-gray-200 pt-2">
                <span className="w-16 shrink-0 text-left text-sm text-gray-500">Branch:</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {defaultBranch.name} ({defaultBranch.code})
                </span>
              </div>
            )}
          </div>
          <p className="mb-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-600">
            Save these credentials. The password will not be shown again.
          </p>
          <Button onClick={onDashboard} className="w-full sm:w-auto">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
