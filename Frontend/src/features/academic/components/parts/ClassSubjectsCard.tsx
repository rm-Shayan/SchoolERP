import { Card, Button } from '@/features/shared/components';

interface SubjectItem { id: string; name: string; code?: string; }

interface ClassSubjectsCardProps {
  name: string;
  subjects: SubjectItem[];
  onRemove: (id: string, name: string) => void;
  onLink: () => void;
}

export default function ClassSubjectsCard({ name, subjects, onRemove, onLink }: ClassSubjectsCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
        <span className="text-xs text-gray-400 shrink-0">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {subjects.length === 0 ? (
          <span className="text-xs text-gray-400">No subjects linked</span>
        ) : (
          subjects.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {s.name}
              {s.code && <span className="text-gray-400">· {s.code}</span>}
              <button
                type="button"
                title="Remove subject"
                className="text-gray-400 hover:text-red-600"
                onClick={() => onRemove(s.id, s.name)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
        <Button size="sm" variant="ghost" onClick={onLink}>+ Link Subject</Button>
      </div>
    </Card>
  );
}
