import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="text-sm text-gray-600 leading-relaxed">{message}</div>
      {children}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
