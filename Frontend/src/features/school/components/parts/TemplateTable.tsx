import type { ImportColumn } from './importColumns';

function RequiredChip({ req }: { req: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        req ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {req ? 'Required' : 'Optional'}
    </span>
  );
}

export default function TemplateTable({ columns }: { columns: ImportColumn[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-400 bg-gray-50/80">
            <th className="py-2.5 pl-4 pr-4 font-semibold">Column</th>
            <th className="py-2.5 pr-4 font-semibold">Status</th>
            <th className="py-2.5 pr-4 font-semibold">Example</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {columns.map(({ col, req, example }) => (
            <tr key={col} className="hover:bg-gray-50/60 transition-colors">
              <td className="py-2.5 pl-4 pr-4 font-medium text-gray-900 whitespace-nowrap">{col}</td>
              <td className="py-2.5 pr-4">
                <RequiredChip req={req} />
              </td>
              <td className="py-2.5 pr-4 text-gray-500">{example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
