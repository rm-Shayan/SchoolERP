'use client';

import { Button } from '@/features/shared/components';

interface Props {
  isLastClass: boolean;
  ready: boolean;
  studentsCount: number;
  selectedCount: number;
  promoting: boolean;
  gradBusy: boolean;
  onPromoteAll: () => void;
  onPromoteSelected: () => void;
  onGraduate: () => void;
  onGraduateSelected: () => void;
  onDropout: () => void;
}

export default function PromotionActions({
  isLastClass, ready, studentsCount, selectedCount, promoting, gradBusy,
  onPromoteAll, onPromoteSelected, onGraduate, onGraduateSelected, onDropout,
}: Props) {
  if (isLastClass) {
    return (
      <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/40 px-5 py-3">
        <Button disabled={!ready || !studentsCount} loading={gradBusy} onClick={onGraduate}>
          Graduate All ({studentsCount})
        </Button>
        <Button variant="outline" disabled={!ready || !selectedCount} loading={gradBusy} onClick={onGraduateSelected}>
          Graduate Selected ({selectedCount})
        </Button>
        <div className="w-px bg-gray-200 mx-1" />
        <Button variant="danger" disabled={!ready || !studentsCount} loading={gradBusy} onClick={onDropout}>
          Drop Out All ({studentsCount})
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/40 px-5 py-3">
      <Button disabled={!ready || !studentsCount} loading={promoting} onClick={onPromoteAll}>
        Promote All ({studentsCount})
      </Button>
      <Button variant="outline" disabled={!ready || !selectedCount || selectedCount === studentsCount} loading={promoting} onClick={onPromoteSelected}>
        Promote Selected ({selectedCount})
      </Button>
    </div>
  );
}
