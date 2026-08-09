// Shapes for the Terminal Report Card. `subjects` mirrors a rollup of
// `term_subject_results` for one student in one term; the rest mirrors
// `users`, `terms`/`academic_sessions`, and the school_profile settings.

export interface ReportCardSubjectRow {
  subjectName: string;
  caScore: number;
  terminalScore: number;
  totalScore: number;
  maxScore: number;
  gradeLetter: string | null;
  remark: string | null;
}

export interface ReportCardData {
  schoolName: string;
  schoolMotto?: string;
  schoolAddress?: string;
  logoUrl?: string | null;

  studentName: string;
  admissionNumber: string;
  className: string;
  studentPhotoUrl?: string | null;

  termName: string;
  sessionName: string;

  subjects: ReportCardSubjectRow[];
  overallTotal: number;
  overallMaxTotal: number;
  overallGradeLetter: string | null;
  positionInClass: number;
  classSize: number;

  teacherComment?: string;
  principalName?: string;
}
