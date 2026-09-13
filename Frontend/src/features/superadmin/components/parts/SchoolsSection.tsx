'use client';

import { memo } from 'react';
import { Button, SectionHeader, EmptyState, Card } from '@/features/shared/components';
import type { Organization, School } from '@/types';
import SchoolCard from './SchoolCard';

interface SchoolsSectionProps {
  org: Organization;
  schools: School[];
  exporting: boolean;
  onExport: () => void;
  onAdd: () => void;
  onDeleteSchool: (school: School) => void;
  onBlockSchool: (school: School) => void;
  onUnblockSchool: (school: School) => void;
}

function SchoolsSection({ org, schools, exporting, onExport, onAdd, onDeleteSchool, onBlockSchool, onUnblockSchool }: SchoolsSectionProps) {
  return (
    <>
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/70 via-white to-white p-4 sm:p-5 shadow-sm">
      <SectionHeader
        title="Branches / Campuses"
        subtitle={`${schools.length} location${schools.length === 1 ? '' : 's'} under this organization.`}
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" onClick={onExport} loading={exporting} disabled={schools.length === 0} title={schools.length === 0 ? 'No branches to export' : undefined} className="rounded-xl">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </Button>
            <Button size="sm" onClick={onAdd} className="rounded-xl">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Branch
            </Button>
          </div>
        }
      /></div>

      {schools.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            title="No Branches Yet"
            description="Add your first branch/campus under this organization."
            action={<Button size="sm" onClick={onAdd} className="rounded-xl">Add Branch</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 sa-stagger">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              org={org}
              school={school}
              onDelete={onDeleteSchool}
              onBlock={onBlockSchool}
              onUnblock={onUnblockSchool}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default memo(SchoolsSection);
