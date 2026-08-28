'use client';

import { useState } from 'react';
import type { Section } from '@/types';
import { Card, CardHeader, CardContent, Button } from '@/features/shared/components';
import SectionForm from './SectionForm';

interface SectionFormValues {
  name: string;
  capacity: string;
  roomNumber: string;
}

interface ClassCardProps {
  className: string;
  classId: string;
  sections: Section[];
  onEditClass: () => void;
  onDeleteClass: () => void;
  onCreateSection: (classId: string, v: SectionFormValues) => void | Promise<void>;
  onUpdateSection: (id: string, v: SectionFormValues) => void | Promise<void>;
  onDeleteSection: (id: string, name: string) => void;
}

const PencilIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function ClassCard({
  className,
  classId,
  sections,
  onEditClass,
  onDeleteClass,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
}: ClassCardProps) {
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const closeSectionForm = () => {
    setShowSectionForm(false);
    setEditingSection(null);
  };

  const submitSection = (v: SectionFormValues) => {
    if (editingSection) return onUpdateSection(editingSection.id, v);
    return onCreateSection(classId, v);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{className}</h3>
          <p className="text-xs text-gray-500">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={onEditClass}>Edit</Button>
          <Button size="sm" variant="danger" onClick={onDeleteClass}>Delete</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          {sections.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full text-xs">
              <span className="font-medium">{s.name}</span>
              {(s.capacity != null || s.roomNumber) && (
                <span className="text-primary-600/80">
                  {[s.capacity != null ? `cap ${s.capacity}` : null, s.roomNumber ? `room ${s.roomNumber}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              <button
                type="button"
                title="Edit section"
                className="text-primary-400 hover:text-primary-700"
                onClick={() => { setShowSectionForm(false); setEditingSection(s); }}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                title="Delete section"
                className="text-primary-400 hover:text-red-600"
                onClick={() => onDeleteSection(s.id, s.name)}
              >
                ×
              </button>
            </span>
          ))}
          {sections.length === 0 && <span className="text-xs text-gray-400">No sections</span>}
        </div>

        {showSectionForm || editingSection ? (
          <SectionForm
            key={editingSection?.id ?? 'new'}
            initial={editingSection
              ? {
                  name: editingSection.name,
                  capacity: editingSection.capacity != null ? String(editingSection.capacity) : '',
                  roomNumber: editingSection.roomNumber ?? '',
                }
              : undefined}
            onClose={closeSectionForm}
            onSubmit={submitSection}
          />
        ) : (
          <div className="flex justify-end border-t border-gray-100 pt-2">
            <Button size="sm" variant="outline" onClick={() => setShowSectionForm(true)}>Add Section</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
