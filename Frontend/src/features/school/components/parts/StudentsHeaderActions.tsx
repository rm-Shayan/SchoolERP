import { Button } from '@/features/shared/components';

interface StudentsHeaderActionsProps {
  onAdd?: () => void;
  onImport?: () => void;
  onExport: () => void;
}

export function StudentsHeaderActions({ onAdd, onImport, onExport }: StudentsHeaderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {onAdd && (
        <Button size="sm" onClick={onAdd}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Button>
      )}
      {onImport && (
        <Button size="sm" variant="outline" onClick={onImport}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Import
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onExport}>
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </Button>
    </div>
  );
}
