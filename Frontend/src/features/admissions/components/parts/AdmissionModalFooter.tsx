import { Button, ConfirmDialog } from '@/features/shared/components';
import type { Applicant } from '@/types';

interface AdmissionModalFooterProps {
  applicant: Applicant;
  onEdit: (applicant: Applicant) => void;
  onReject: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  confirmDelete: boolean;
}

export default function AdmissionModalFooter({
  applicant,
  onEdit,
  onReject,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  confirmDelete,
}: AdmissionModalFooterProps) {
  const enrolled = applicant.status === 'ENROLLED';

  return (
    <>
      <div className="flex justify-between pt-3 border-t border-gray-100">
        {!enrolled ? (
          <>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(applicant)}>Edit Details</Button>
              {applicant.status !== 'REJECTED' && <Button size="sm" variant="danger" onClick={onReject}>Reject</Button>}
            </div>
            <Button size="sm" variant="ghost" onClick={onDeleteRequest}>Delete</Button>
          </>
        ) : (
          <span className="text-xs text-gray-400">Enrolled applicant — manage from Students section.</span>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete applicant?"
        message={`${applicant.firstName} ${applicant.lastName}'s admission record will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </>
  );
}