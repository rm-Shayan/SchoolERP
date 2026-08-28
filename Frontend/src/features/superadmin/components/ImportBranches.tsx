import BranchImportForm from './parts/BranchImportForm';
import BranchImportTemplate from './parts/BranchImportTemplate';
import useBranchImport from './parts/useBranchImport';

export default function ImportBranches() {
  const hook = useBranchImport();

  return (
    <div className="space-y-6">
      <BranchImportForm hook={hook} />
      <BranchImportTemplate
        mode={hook.mode}
        downloadingTemplate={hook.downloadingTemplate}
        onDownload={hook.handleDownloadTemplate}
      />
    </div>
  );
}
