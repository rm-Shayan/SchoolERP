import { Button, Input, Select } from '@/features/shared/components';
import type { SectionOption } from './helpers';

interface Props {
  sections: SectionOption[];
  sectionsLoading?: boolean;
  sectionId: string;
  date: string;
  saving: boolean;
  onSectionChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onSave: () => void;
}

export default function AttendanceToolbar({ sections, sectionsLoading, sectionId, date, saving, onSectionChange, onDateChange, onSave }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
      <Select
        label="Section"
        placeholder={sectionsLoading ? 'Loading sections…' : 'Select class & section'}
        loading={sectionsLoading}
        options={sections.map((s) => ({ value: s.id, label: s.label }))}
        value={sectionId}
        onChange={(e) => onSectionChange(e.target.value)}
      />
      <Input label="Date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      <div className="flex items-end">
        <Button onClick={onSave} loading={saving} disabled={!sectionId} className="w-full">Save Attendance</Button>
      </div>
    </div>
  );
}
