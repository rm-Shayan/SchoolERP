'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/features/shared/components';

function StepIcon({ step, icon, title }: { step: number; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">Step {step}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
  );
}

interface SectionCardProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  required?: boolean;
}

export default function SectionCard({ step, icon, title, children, defaultOpen = true, required = false }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full">
        <CardHeader className="cursor-pointer hover:bg-gray-50/80 transition-colors">
          <div className="flex items-center justify-between">
            <StepIcon step={step} icon={icon} title={title} />
            <div className="flex items-center gap-2">
              {required && <span className="text-[10px] font-bold text-red-500 uppercase">Required</span>}
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </CardHeader>
      </button>
      {open && <CardContent className="space-y-4 border-t border-gray-100/80">{children}</CardContent>}
    </Card>
  );
}
