interface Props {
  counts: Record<string, number>;
}

export default function AttendanceSummary({ counts }: Props) {
  if (counts.PRESENT === undefined) return null;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">Present: {counts.PRESENT ?? 0}</span>
      <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">Late: {counts.LATE ?? 0}</span>
      <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full">Absent: {counts.ABSENT ?? 0}</span>
      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Leave: {counts.LEAVE ?? 0}</span>
    </div>
  );
}
