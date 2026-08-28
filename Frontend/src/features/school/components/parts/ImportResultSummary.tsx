interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: { row: number; error: string }[];
}

export function ImportResultSummary({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-700 tabular-nums">{result.successCount}</p>
          <p className="text-xs text-green-600">Students added</p>
        </div>
        <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-700 tabular-nums">{result.failedCount}</p>
          <p className="text-xs text-red-600">Rows skipped</p>
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Row errors</p>
          {result.errors.slice(0, 8).map((e) => (
            <p key={e.row} className="text-xs text-gray-600 py-0.5">Row {e.row}: {e.error}</p>
          ))}
          {result.errors.length > 8 && (
            <p className="text-xs text-gray-400 pt-1">…and {result.errors.length - 8} more</p>
          )}
        </div>
      )}
    </div>
  );
}
