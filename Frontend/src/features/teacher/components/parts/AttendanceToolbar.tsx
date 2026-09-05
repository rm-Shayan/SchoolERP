import { Button } from '@/features/shared/components';
import type { SectionOption } from './helpers';

const selectCls = 'h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300';

interface Props {
  classOptions: { id: string; name: string }[];
  classId: string;
  sections: SectionOption[];
  sectionsLoading?: boolean;
  sectionId: string;
  date: string;
  saving: boolean;
  onClassChange: (id: string) => void;
  onSectionChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onSave: () => void;
}

export default function AttendanceToolbar({
  classOptions, classId, sections, sectionsLoading, sectionId,
  date, saving, onClassChange, onSectionChange, onDateChange, onSave,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Class</label>
        <select value={classId} onChange={(e) => onClassChange(e.target.value)}
          disabled={sectionsLoading} className={selectCls}>
          <option value="">{sectionsLoading ? 'Loading classes…' : 'Select class'}</option>
          {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Section</label>
        <select value={sectionId} onChange={(e) => onSectionChange(e.target.value)}
          disabled={!classId || sectionsLoading} className={selectCls}>
          <option value="">{classId ? 'Select section' : 'Pick a class first'}</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.sectionName}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
      </div>
      <div className="ml-auto">
        <Button onClick={onSave} loading={saving} disabled={!sectionId}>Save Attendance</Button>
      </div>
    </div>
  );
}
