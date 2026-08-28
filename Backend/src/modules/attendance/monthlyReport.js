export async function buildMonthlyReport(repository, schoolId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);
  const [records, allClasses] = await Promise.all([
    repository.getMonthlySchoolAttendance(schoolId, startDate, endDate),
    repository.getClassesWithSections(schoolId),
  ]);

  // ── Group records by section ──
  const sectionMap = new Map();
  for (const record of records) {
    const section = record.student?.section;
    const key = section?.id || "unassigned";
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        classId: section?.class?.id || null,
        className: section?.class?.name || "Unassigned",
        sectionId: section?.id || null,
        sectionName: section?.name || "Unassigned",
        records: [],
      });
    }
    sectionMap.get(key).records.push(record);
  }

  // ── Compute summary per section ──
  const withSummary = [...sectionMap.values()].map((s) => {
    const present = s.records.filter((r) => r.status === "PRESENT").length;
    const late = s.records.filter((r) => r.status === "LATE").length;
    const absent = s.records.filter((r) => r.status === "ABSENT").length;
    const leave = s.records.filter((r) => r.status === "LEAVE").length;
    const manualOverride = s.records.filter((r) => r.status === "MANUAL_OVERRIDE").length;
    return {
      ...s,
      summary: {
        totalStudents: 0,
        present,
        late,
        absent,
        leave,
        manualOverride,
        totalRecords: s.records.length,
      },
    };
  });

  // ── Group sections by class (for frontend ClassAttendanceGroup[]) ──
  const classMap = new Map();
  for (const s of withSummary) {
    const classKey = s.classId || s.className;
    if (!classMap.has(classKey)) {
      classMap.set(classKey, {
        classId: s.classId,
        className: s.className,
        sections: [],
      });
    }
    classMap.get(classKey).sections.push(s);
  }

  // Include classes with zero attendance (from allClasses) so empty classes still show
  for (const cls of allClasses) {
    const classKey = cls.id || cls.name;
    if (!classMap.has(classKey)) {
      classMap.set(classKey, {
        classId: cls.id,
        className: cls.name,
        sections: (cls.sections || []).map((sec) => ({
          classId: cls.id,
          className: cls.name,
          sectionId: sec.id,
          sectionName: sec.name,
          summary: { totalStudents: 0, present: 0, late: 0, absent: 0, leave: 0, manualOverride: 0, totalRecords: 0 },
          records: [],
        })),
      });
    }
  }

  return { year, month, classes: [...classMap.values()] };
}
