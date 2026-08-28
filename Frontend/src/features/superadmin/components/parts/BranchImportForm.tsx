import { cn } from '@/lib/utils';
import { Button, Card, Select } from '@/features/shared/components';
import BranchImportProgress from './BranchImportProgress';
import useBranchImport from './useBranchImport';
import type { ImportMode } from './useBranchImport';

type BranchImportHook = ReturnType<typeof useBranchImport>;

interface Props {
  hook: BranchImportHook;
}

export default function BranchImportForm({ hook }: Props) {
  const {
    mode,
    setMode,
    orgs,
    organizationId,
    setOrganizationId,
    file,
    setFile,
    dragging,
    setDragging,
    progress,
    handleUpload,
    reset,
    inputRef,
  } = hook;

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Import scope"
          value={mode}
          onChange={(e) => setMode(e.target.value as ImportMode)}
          options={[
            { value: 'specific', label: 'Branches of one organization' },
            { value: 'all', label: 'Branches across all organizations' },
          ]}
        />
        {mode === 'specific' ? (
          <Select
            label="Organization"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            placeholder="Select an organization…"
            options={orgs.map((o) => ({ value: o.id, label: `${o.name} (${o.code})` }))}
            required
          />
        ) : (
          <div className="pt-6">
            <p className="text-xs text-gray-500">
              Each row must include an{' '}
              <span className="font-medium text-gray-700">OrganizationCode</span> column so
              branches are matched to their organization.
            </p>
          </div>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-10',
          dragging
            ? 'border-primary-500 bg-primary-50/60 scale-[1.01]'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sa-tint-1 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">
          {file ? file.name : 'Drag & drop your Excel file here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {file
            ? `${(file.size / 1024).toFixed(1)} KB`
            : 'Columns: Name, Code (required) · Address, Phone, AdminEmail (optional)'}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={handleUpload}
          disabled={!file || progress.phase === 'uploading' || progress.phase === 'processing'}
          loading={progress.phase === 'uploading'}
        >
          {progress.phase === 'uploading' ? 'Uploading…' : 'Start Import'}
        </Button>
        {(file || progress.phase !== 'idle') && (
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        )}
      </div>

      <BranchImportProgress progress={progress} />
    </Card>
  );
}
