import { Button, Badge } from '@/features/shared/components';
import type { Student } from '@/types';

interface Props {
  students: Student[];
  saving: boolean;
  onSave: () => void;
  onPickStudent: (s: Student) => void;
}

export default function ResultActionsBar({ students, saving, onSave, onPickStudent }: Props) {
  return (
    <>
      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {students.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPickStudent(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-primary-300 hover:text-primary-700"
            >
              {s.firstName} {s.lastName} · Card
            </button>
          ))}
        </div>
        <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
          Save Results
        </Button>
      </div>
      {students.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          <Badge variant="info">Tip</Badge> Click a student to generate/view their result card.
        </p>
      )}
    </>
  );
}