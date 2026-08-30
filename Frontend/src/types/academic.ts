export interface Class {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  order: number;
  sections?: Section[];
  subjects?: Subject[];
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  capacity?: number;
  roomNumber?: string;
  class?: Class;
  _count?: { students: number };
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  code?: string;
}

export interface Term {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms?: Term[];
}

export interface ExamPaper {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  sectionId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  maxMarks?: number | null;
  roomNumber?: string | null;
  subject?: { id: string; name: string };
  section?: { id: string; name: string };
  class?: { id: string; name: string };
}

export interface Exam {
  id: string;
  schoolId: string;
  termId: string;
  name: string;
  startDate: string;
  endDate: string;
  term?: { id: string; name: string; academicYear?: { id: string; name: string } };
  papers?: ExamPaper[];
  _count?: { results: number };
}
