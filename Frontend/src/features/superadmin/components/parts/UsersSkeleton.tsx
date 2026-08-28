import { Sk } from '@/features/shared/components/Skeleton';

export function UsersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Sk className="h-8 w-40" />
        <Sk className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-gray-200/70 bg-white p-4 flex items-center gap-3">
            <Sk className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-3 w-16" />
              <Sk className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
      <Sk className="h-12 w-full sm:w-72 rounded-xl" />
      <TableSkeleton />
    </div>
  );
}

const HEADERS = ['Name', 'Role', 'Organization', 'Branch', 'Status', 'Joined', ''];

export function TableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200/70 bg-white">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-gray-200">
            {HEADERS.map((h, i) => (
              <th key={`${h}-${i}`} className="py-3 px-4">
                <Sk className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Sk className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-2">
                    <Sk className="h-3 w-28" />
                    <Sk className="h-2.5 w-40" />
                  </div>
                </div>
              </td>
              <td className="py-3 px-4"><Sk className="h-5 w-16 rounded-full" /></td>
              <td className="py-3 px-4"><Sk className="h-3 w-24" /></td>
              <td className="py-3 px-4"><Sk className="h-3 w-20" /></td>
              <td className="py-3 px-4"><Sk className="h-5 w-14 rounded-full" /></td>
              <td className="py-3 px-4"><Sk className="h-3 w-16" /></td>
              <td className="py-3 px-4"><Sk className="h-8 w-20 rounded-lg ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
