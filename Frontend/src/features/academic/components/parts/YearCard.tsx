'use client';

import { useState } from 'react';
import type { AcademicYear } from '@/types';
import type { Term } from '@/lib/api/academicService';
import { Card, CardHeader, CardContent, Button, Badge } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';
import TermForm from './TermForm';

interface TermFormValues {
  name: string;
  startDate: string;
  endDate: string;
}

interface YearCardProps {
  year: AcademicYear;
  terms: Term[];
  onToggleCurrent: (year: AcademicYear) => void;
  onEditYear: (year: AcademicYear) => void;
  onDeleteYear: (year: AcademicYear) => void;
  onCreateTerm: (yearId: string, v: TermFormValues) => void | Promise<void>;
  onUpdateTerm: (id: string, v: TermFormValues) => void | Promise<void>;
  onDeleteTerm: (id: string, name: string) => void;
}

const PencilIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function YearCard({
  year,
  terms,
  onToggleCurrent,
  onEditYear,
  onDeleteYear,
  onCreateTerm,
  onUpdateTerm,
  onDeleteTerm,
}: YearCardProps) {
  const [showTermForm, setShowTermForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  const closeTermForm = () => {
    setShowTermForm(false);
    setEditingTerm(null);
  };

  const submitTerm = (v: TermFormValues) => {
    if (editingTerm) return onUpdateTerm(editingTerm.id, v);
    return onCreateTerm(year.id, v);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-900">{year.name}</h3>
          <span className="text-xs text-gray-500">{formatDate(year.startDate)} → {formatDate(year.endDate)}</span>
          {year.isCurrent && <Badge variant="success">Current</Badge>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!year.isCurrent && (
            <Button size="sm" variant="outline" onClick={() => onToggleCurrent(year)}>Set Current</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEditYear(year)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => onDeleteYear(year)}>Delete</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terms ({terms.length})</p>
          <span className="text-[10px] text-gray-400">{year.startDate.slice(0, 4)}–{year.endDate.slice(0, 4)} session</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {terms.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
              {t.name}
              <button
                type="button"
                title="Edit term"
                className="text-gray-400 hover:text-primary-600"
                onClick={() => { setShowTermForm(false); setEditingTerm(t); }}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                title="Delete term"
                className="text-gray-400 hover:text-red-600"
                onClick={() => onDeleteTerm(t.id, t.name)}
              >
                ×
              </button>
            </span>
          ))}
          {terms.length === 0 && <span className="text-xs text-gray-400">No terms</span>}
        </div>

        {showTermForm || editingTerm ? (
          <TermForm
            key={editingTerm?.id ?? 'new'}
            initial={editingTerm
              ? { name: editingTerm.name, startDate: editingTerm.startDate.slice(0, 10), endDate: editingTerm.endDate.slice(0, 10) }
              : undefined}
            onClose={closeTermForm}
            onSubmit={submitTerm}
          />
        ) : (
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <Button size="sm" variant="outline" onClick={() => setShowTermForm(true)}>Add Term</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
