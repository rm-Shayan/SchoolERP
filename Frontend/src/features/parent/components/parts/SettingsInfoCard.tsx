'use client';

import { Card, CardContent } from '@/features/shared/components';

interface SettingsInfoCardProps {
  color: string;
}

const INFO_ITEMS = [
  {
    icon: 'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.75 3h16.5a1.5 1.5 0 011.5 1.5v15a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 013.75 3z',
    title: 'Profile Managed by School',
    desc: 'Your roll number, class, section and other academic details are maintained by your school administrator.',
  },
  {
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    title: 'Need Help?',
    desc: 'Contact your school office for any changes to your account or profile information.',
  },
  {
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    title: 'Account Security',
    desc: 'Your portal password is shared among all students. Keep it confidential and do not share it with others.',
  },
];

export default function SettingsInfoCard({ color }: SettingsInfoCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}66, ${color}22)` }} />
      <CardContent className="p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Important Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INFO_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors"
              style={{ background: `${color}08` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: `${color}cc` }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
