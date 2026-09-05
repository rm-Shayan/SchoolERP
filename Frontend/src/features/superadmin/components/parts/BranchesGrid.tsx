import type { School } from '@/types';
import BranchCard from './BranchCard';

interface BranchesGridProps {
  schools: School[];
  deletingId: string | null;
  onDelete: (school: School) => void;
  onEdit: (school: School) => void;
  onBlock: (school: School) => void;
  onUnblock: (school: School) => void;
}

export default function BranchesGrid({ schools, deletingId, onDelete, onEdit, onBlock, onUnblock }: BranchesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schools.map((school) => (
        <BranchCard
          key={school.id}
          school={school}
          deleting={deletingId === school.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onBlock={onBlock}
          onUnblock={onUnblock}
        />
      ))}
    </div>
  );
}
