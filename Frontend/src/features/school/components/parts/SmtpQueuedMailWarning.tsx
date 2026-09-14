'use client';

import type { SmtpQueuedMail } from '@/types';

interface SmtpQueuedMailWarningProps {
  queuedMail?: SmtpQueuedMail | null;
  /** Label of the scope shown in the message, e.g. "this branch" / organization name */
  scopeLabel?: string;
}

/**
 * Amber warning shown on SMTP settings when school mail (fee reminders,
 * announcements, notices) is stuck in the outbox because no tenant SMTP is
 * configured or the configured one keeps failing. School mail never uses the
 * platform SMTP, so parents are not receiving anything until this is fixed.
 */
export default function SmtpQueuedMailWarning({ queuedMail, scopeLabel = 'this organization' }: SmtpQueuedMailWarningProps) {
  if (!queuedMail || queuedMail.count <= 0) return null;

  const oldest = queuedMail.oldestAt
    ? new Date(queuedMail.oldestAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="alert">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-800">
            {queuedMail.count} email{queuedMail.count !== 1 ? 's' : ''} queued — not delivered
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            School emails for {scopeLabel} are waiting in the outbox because{' '}
            {queuedMail.hasTenantSmtp
              ? 'the configured SMTP keeps failing (check the error shown on the status chips and send a test email).'
              : 'no tenant SMTP is configured. School mail never goes out from the platform account.'}{' '}
            Parents will receive everything automatically once outgoing mail is working
            {oldest ? ` — oldest item queued since ${oldest}` : ''}.
          </p>
        </div>
      </div>
    </div>
  );
}
