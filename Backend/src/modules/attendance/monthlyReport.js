export async function buildMonthlyReport(repository, schoolId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);
  const [records, allClasses, students, offDays, weeklyOff] = await Promise.all([
    repository.getMonthlySchoolAttendance(schoolId, startDate, endDate),
    repository.getClassesWithSections(schoolId),
    repository.getEnrolledStudentsBySection(schoolId),
    repository.findOffDays(schoolId),
    repository.findWeeklyOff(schoolId),
  ]);

  // Base section nodes from allClasses so empty sections still appear.
  const sectionMap = new Map();
  for (const cls of allClasses) {
    for (const sec of cls.sections || []) {
      sectionMap.set(sec.id, {
        classId: cls.id,
        className: cls.name,
        sectionId: sec.id,
        sectionName: sec.name,
        students: [],
        records: [],
      });
    }
  }

  // Attach every enrolled student (rows = all students, marked or not).
  for (const stu of students) {
    const node = sectionMap.get(stu.sectionId);
    if (node) {
      node.students.push({
        id: stu.id,
        firstName: stu.firstName,
        lastName: stu.lastName,
        rollNumber: stu.rollNumber,
        imageUrl: stu.imageUrl,
        sectionId: stu.sectionId,
      });
    }
  }

  // Attach attendance records to their section (dedupe).
  for (const record of records) {
    const section = record.student?.section;
    const key = section?.id || "unassigned";
    let node = sectionMap.get(key);
    if (!node) {
      node = {
        classId: section?.class?.id || null,
        className: section?.class?.name || "Unassigned",
        sectionId: section?.id || null,
        sectionName: section?.name || "Unassigned",
        students: [],
        records: [],
      };
      sectionMap.set(key, node);
    }
    node.records.push(record);
  }

  // Per-section summary + school-wide totals.
  const classMap = new Map();
  const totals = { totalMarked: 0, present: 0, late: 0, absent: 0, leave: 0, manualOverride: 0 };

  for (const node of sectionMap.values()) {
    const present = node.records.filter((r) => r.status === "PRESENT").length;
    const late = node.records.filter((r) => r.status === "LATE").length;
    const absent = node.records.filter((r) => r.status === "ABSENT").length;
    const leave = node.records.filter((r) => r.status === "LEAVE").length;
    const manualOverride = node.records.filter((r) => r.status === "MANUAL_OVERRIDE").length;

    node.summary = {
      totalStudents: node.students.length,
      present,
      late,
      absent,
      leave,
      manualOverride,
      totalRecords: node.records.length,
    };

    totals.totalMarked += node.records.length;
    totals.present += present;
    totals.late += late;
    totals.absent += absent;
    totals.leave += leave;
    totals.manualOverride += manualOverride;

    const classKey = node.classId || node.className;
    if (!classMap.has(classKey)) {
      classMap.set(classKey, { classId: node.classId, className: node.className, sections: [] });
    }
    classMap.get(classKey).sections.push(node);
  }

  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const monthOffDays = (offDays ?? [])
    .filter((o) => typeof o?.date === "string" && o.date.startsWith(prefix))
    .map((o) => ({ date: o.date, reason: o.reason || null }));

  return {
    year,
    month,
    summary: { ...totals, totalWorkingDays: workingDaysInMonth(year, month, offDays, weeklyOff) },
    offDays: monthOffDays,
    weeklyOff,
    classes: [...classMap.values()],
  };
}

/** Working days count for the month — skips each school's weekly-off days and holidays. */
function workingDaysInMonth(year, month, offDays = [], weeklyOff = [0, 6]) {
  let count = 0;
  const offSet = new Set((offDays || []).map((o) => o?.date));
  const weeklyOffSet = new Set(weeklyOff ?? [0, 6]);
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (weeklyOffSet.has(dow)) continue;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (offSet.has(dateStr)) continue;
    count += 1;
  }
  return count;
}