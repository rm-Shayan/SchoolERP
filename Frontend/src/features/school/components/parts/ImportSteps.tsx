'use client';

import { memo } from 'react';

const STEPS = [
  {
    title: 'Download Template',
    description: 'Sample .xlsx file download karein — sahi column headers already included hain.',
  },
  {
    title: 'Fill Your Data',
    description: 'Rows bharein. Red-marked columns zaroori hain, baaki optional hain.',
  },
  {
    title: 'Upload & Import',
    description: 'Filled file Super Admin → Import Data se upload karein. Results live show hote hain.',
  },
];

const StepIcon = ({ n }: { n: number }) => (
  <span className="w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm ring-4 ring-primary-100">
    {n}
  </span>
);

const ImportSteps = memo(function ImportSteps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {STEPS.map((step, i) => (
        <div
          key={step.title}
          className="relative bg-white rounded-2xl border border-gray-200/60 p-5 flex items-start gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
        >
          <StepIcon n={i + 1} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>
          </div>
          {i < STEPS.length - 1 && (
            <svg
              className="hidden sm:block absolute top-1/2 -right-3 w-6 h-6 text-gray-300 z-10 bg-white rounded-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
});

export default ImportSteps;
