import { Card, EmptyState, Button } from '@/features/shared/components';
import type { PlatformUserDirectory } from '@/lib/api/staffService';
import type { User } from '@/types';
import UserRow from './UserRow';
import UsersCardList from './UsersCardList';
import UsersPagination from './UsersPagination';
import { TableSkeleton } from './UsersSkeleton';
import { PAGE_SIZE } from './helpers';

interface UsersTableProps {
  loading: boolean;
  data: PlatformUserDirectory | null;
  pageItems: User[];
  totalCount: number;
  page: number;
  totalPages: number;
  currentUserId?: string;
  onToggleBlock: (member: User) => void;
  onOpenBlock: (member: User) => void;
  onView: (member: User) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export default function UsersTable({
  loading,
  data,
  pageItems,
  totalCount,
  page,
  totalPages,
  currentUserId,
  onToggleBlock,
  onOpenBlock,
  onView,
  onPageChange,
  onResetFilters,
}: UsersTableProps) {
  const noItems = !data || data.items.length === 0;
  const hasUsers = (data?.items.length ?? 0) > 0;
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <TableSkeleton />
      ) : noItems ? (
        <div className="p-8">
          <EmptyState
            icon={<svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            title={hasUsers ? 'No matches found' : 'No users yet'}
            description={
              hasUsers
                ? 'Try adjusting your search or filters.'
                : 'Staff accounts will appear here as they are created across organizations.'
            }
            action={
              hasUsers ? (
                <Button variant="outline" size="sm" onClick={onResetFilters}>
                  Reset filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <UsersCardList
            members={pageItems}
            currentUserId={currentUserId}
            onToggleBlock={onToggleBlock}
            onOpenBlock={onOpenBlock}
            onView={onView}
          />
          <div className="hidden md:block overflow-x-auto max-h-[560px]">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Name</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Role</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Organization</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Branch</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Status</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium">Joined</th>
                  <th className="sticky top-0 bg-white py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((member) => (
                  <UserRow
                    key={member.id}
                    member={member}
                    currentUserId={currentUserId}
                    onToggleBlock={onToggleBlock}
                    onOpenBlock={onOpenBlock}
                    onView={onView}
                  />
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
