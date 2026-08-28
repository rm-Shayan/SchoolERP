'use client';

import { Suspense, lazy, useState } from 'react';
import { PageHeader } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import SuspenseLoader from '@/components/SuspenseLoader';

const AcademicYearsSection = lazy(() => import('./AcademicYearsSection'));
const SectionsSection = lazy(() => import('./SectionsSection'));
const ClassesSection = lazy(() => import('./ClassesSection'));
const SubjectsSection = lazy(() => import('./SubjectsSection'));

type Tab = 'years' | 'sections' | 'classes' | 'subjects';

const TABS: { id: Tab; label: string; hint: string; icon: string }[] = [
  { id: 'years', label: 'Academic Year', hint: 'Year + terms', icon: '📅' },
  { id: 'sections', label: 'Sections', hint: 'A, B, Morning…', icon: '🏷️' },
  { id: 'classes', label: 'Classes', hint: 'Assign sections', icon: '🏫' },
  { id: 'subjects', label: 'Subjects', hint: 'Link to classes', icon: '📚' },
];

const STEP_MAP: Record<Tab, number> = { years: 0, sections: 1, classes: 2, subjects: 3 };

export default function AcademicSetupPage() {
  const [tab, setTab] = useState<Tab>('years');
  const step = STEP_MAP[tab];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Setup"
        description="Set up your academic year step by step: year → sections → classes → subjects."
      />

      {/* Step indicator — desktop */}
      <div className="hidden sm:flex items-center gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                : i < step
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <span className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              tab === t.id ? 'bg-primary-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            )}>{i + 1}</span>
            <span className="hidden lg:inline">{t.label}</span>
            <span className="lg:hidden">{t.icon}</span>
          </button>
        ))}
      </div>

      {/* Tab bar — mobile */}
      <div className="flex sm:hidden gap-1 border-b border-gray-200 overflow-x-auto pb-px -mx-4 px-4 scrollbar-thin">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500'
            )}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <SuspenseLoader variant="skeleton" count={5}>
        {tab === 'years' && <AcademicYearsSection />}
        {tab === 'sections' && <SectionsSection />}
        {tab === 'classes' && <ClassesSection />}
        {tab === 'subjects' && <SubjectsSection />}
      </SuspenseLoader>
    </div>
  );
}
