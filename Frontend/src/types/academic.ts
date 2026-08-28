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

export interface Exam {
  id: string;
  schoolId: string;
  termId: string;
  name: string;
  startDate: string;
  endDate: string;
  term?: { id: string; name: string; academicYear?: { id: string; name: string } };
  _count?: { results: number };
}
