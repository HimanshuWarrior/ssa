export const EXAM_TYPES = ['PA1', 'PA2', 'Half Yearly', 'PA3', 'PA4', 'Annual'] as const;

export type ExamType = typeof EXAM_TYPES[number];

export interface SubjectMapping {
  name: string;
  code: string;
  fromClass: number;
  toClass: number;
}

export const SUBJECT_MAPPINGS: SubjectMapping[] = [
  { name: 'Hindi', code: 'HINDI', fromClass: 1, toClass: 12 },
  { name: 'English', code: 'ENG', fromClass: 1, toClass: 12 },
  { name: 'Maths', code: 'MATH', fromClass: 1, toClass: 12 },
  { name: 'EVS', code: 'EVS', fromClass: 1, toClass: 5 },
  { name: 'Computer', code: 'COMP', fromClass: 1, toClass: 8 },
  { name: 'S.St', code: 'SST', fromClass: 6, toClass: 10 },
  { name: 'Science', code: 'SCI', fromClass: 6, toClass: 10 },
  { name: 'AI', code: 'AI', fromClass: 9, toClass: 12 },
];

export function getSubjectsForClass(classNumber: number): SubjectMapping[] {
  return SUBJECT_MAPPINGS.filter(
    subject => classNumber >= subject.fromClass && classNumber <= subject.toClass
  );
}

export function isSubjectApplicableForClass(subjectCode: string, classNumber: number): boolean {
  const subject = SUBJECT_MAPPINGS.find(s => s.code === subjectCode);
  if (!subject) return false;
  return classNumber >= subject.fromClass && classNumber <= subject.toClass;
}

export function getClassLevel(className: string): number {
  const match = className.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}
