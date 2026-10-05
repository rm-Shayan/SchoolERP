'use client';

import { type RefObject } from 'react';
import { Button, Card, Select } from '@/features/shared/components';
import ImportDropzone from './ImportDropzone';
import BranchImportProgress from './BranchImportProgress';
import useBranchImport from './useBranchImport';
import type { ImportMode } from './types';

type BranchImportHook = ReturnType<typeof useBranchImport>;

interface Props {
  hook: BranchImportHook;
}

const BRANCH_DROPZONE_HINT =
  'Excel format only, up to 10 MB · Required: Name, Code · Optional: Address, Phone, AdminEmail';

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

  const busy = progress.phase === 'uploading' || progress.phase === 'processing';

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">
          Step 1 · Scope
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">Choose what to import</h2>
        <p className="mt-1 text-xs text-slate-500">
          Import branches for a single organization, or for every organization at once.
        </p>
      </div>

      <div className="p-5 sm:p-6">
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
            <div className="flex items-end">
              <p className="rounded-lg border border-primary-100 bg-primary-50/60 px-3.5 py-2.5 text-xs text-slate-600">
                Every row needs an{' '}
                <span className="font-bold text-slate-800">OrganizationCode</span> column so
                branches are matched to their organization.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <ImportDropzone
            file={file}
            dragging={dragging}
            inputRef={inputRef as RefObject<HTMLInputElement | null>}
            hint={BRANCH_DROPZONE_HINT}
            onFileChange={setFile}
            onDraggingChange={setDragging}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={handleUpload} disabled={!file || busy} loading={progress.phase === 'uploading'}>
            {progress.phase === 'uploading' ? 'Uploading…' : 'Start Import'}
          </Button>
          {(file || progress.phase !== 'idle') && (
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
          )}
        </div>

        <BranchImportProgress progress={progress} />
      </div>
    </Card>
  );
}