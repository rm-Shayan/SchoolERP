import { Card, EmptyState, Button } from '@/features/shared/components';
import type { PlatformDirectory, DirectoryItem } from '@/lib/api/staffService';
import UserRow from './UserRow';
import UsersCardList from './UsersCardList';
import UsersPagination from './UsersPagination';
import { TableSkeleton } from './UsersSkeleton';
import { PAGE_SIZE } from './helpers';

interface UsersTableProps {
  loading: boolean;
  data: PlatformDirectory | null;
  pageItems: DirectoryItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  currentUserId?: string;
  onToggleBlock: (m: DirectoryItem) => void;
  onOpenBlock: (m: DirectoryItem) => void;
  onView: (m: DirectoryItem) => void;
  onEdit: (m: DirectoryItem) => void;
  onDelete: (m: DirectoryItem) => void;
  onResetPassword: (m: DirectoryItem) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export default function UsersTable({
  loading, data, pageItems, totalCount, page, totalPages,
  currentUserId, onToggleBlock, onOpenBlock, onView,
  onEdit, onDelete, onResetPassword, onPageChange, onResetFilters,
}: UsersTableProps) {
  const noItems = !data || pageItems.length === 0;
  const hasItems = (data?.total ?? 0) > 0;

  return (
    <Card className="overflow-hidden">
      {loading ? (
        <TableSkeleton />
      ) : noItems ? (
        <div className="p-8">
          <EmptyState
            icon={<svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            title={hasItems ? 'No matches found' : 'No users yet'}
            description={hasItems ? 'Try adjusting your search or filters.' : 'Staff and students will appear here.'}
            action={hasItems ? <Button variant="outline" size="sm" onClick={onResetFilters}>Reset filters</Button> : undefined}
          />
        </div>
      ) : (
        <>
          <UsersCardList members={pageItems} currentUserId={currentUserId}
            onToggleBlock={onToggleBlock} onOpenBlock={onOpenBlock} onView={onView}
            onEdit={onEdit} onDelete={onDelete} onResetPassword={onResetPassword} />
          <div className="hidden md:block overflow-x-auto max-h-[560px]">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Name</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Type / Role</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Organization</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Branch</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Status</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Joined</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((m) => (
                  <UserRow key={`${m.type}-${m.id}`} member={m} currentUserId={currentUserId}
                    onToggleBlock={onToggleBlock} onOpenBlock={onOpenBlock} onView={onView}
                    onEdit={onEdit} onDelete={onDelete} onResetPassword={onResetPassword} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {totalCount > PAGE_SIZE && (
        <UsersPagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={onPageChange} />
      )}
    </Card>
  );
}
