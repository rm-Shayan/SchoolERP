import type { SubjectOption } from './HomeworkForm';

interface SubjectChipsProps {
  subjects: SubjectOption[];
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}

export default function SubjectChips({ subjects, loading, selected, onToggle, onSelectAll }: SubjectChipsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-gray-700">Subjects</label>
        {subjects.length > 0 && (
          <button type="button" onClick={onSelectAll} className="text-xs font-medium text-primary-600 hover:text-primary-700">
            Select All
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : subjects.length === 0 ? (
        <p className="text-xs text-gray-400">No subjects found for this class</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {subjects.map((s) => {
            const active = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {active ? '✓ ' : ''}{s.label}
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <p className="mt-1.5 text-[11px] text-gray-400">{selected.length} subject{selected.length > 1 ? 's' : ''} selected</p>
      )}
    </div>
  );
}
