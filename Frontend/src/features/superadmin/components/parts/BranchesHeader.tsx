import { PageHeader, Button } from '@/features/shared/components';

interface BranchesHeaderProps {
  exporting: boolean;
  onExport: () => void;
  onAdd: () => void;
}

export default function BranchesHeader({ exporting, onExport, onAdd }: BranchesHeaderProps) {
  return (
    <PageHeader
      title="Branches"
      description="Every campus across all organizations on the platform."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAdd}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Branch
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} loading={exporting}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export Excel
          </Button>
        </div>
      }
    />
  );
}
