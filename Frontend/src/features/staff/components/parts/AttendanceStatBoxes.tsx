interface Summary {
  totalStaff: number;
  present: number;
  late: number;
  absent: number;
  unmarked: number;
}

const STAT_CONFIG: { label: string; key: keyof Summary; color: string }[] = [
  { label: 'Total Staff', key: 'totalStaff', color: 'text-gray-900' },
  { label: 'Present', key: 'present', color: 'text-emerald-600' },
  { label: 'Late', key: 'late', color: 'text-amber-600' },
  { label: 'Absent', key: 'absent', color: 'text-red-600' },
  { label: 'Unmarked', key: 'unmarked', color: 'text-blue-600' },
];

export default function AttendanceStatBoxes({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {STAT_CONFIG.map((s) => (
        <div key={s.key} className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</p>
          <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${s.color}`}>{summary[s.key]}</p>
        </div>
      ))}
    </div>
  );
}
