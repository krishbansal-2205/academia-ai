export type QuestionType = 'mcq' | 'short' | 'long' | 'diagram' | 'numerical';
export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type AssignmentStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type PdfStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeEntry {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface GeneratedQuestion {
  number: number;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer: string;
}

export interface GeneratedSection {
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  institutionName: string;
  examTitle: string;
  subject: string;
  className: string;
  duration: string;
  totalMarks: number;
  date: string;
  generalInstructions: string;
  sections: GeneratedSection[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: QuestionTypeEntry[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
  materialFileName: string | null;
  status: AssignmentStatus;
  pdfStatus: PdfStatus;
  generatedPaper: GeneratedPaper | null;
  pdfDownloadUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentFormValues {
  title: string;
  subject: string;
  dueDate: string;
  additionalInstructions: string;
  questionTypes: QuestionTypeEntry[];
  file: File | null;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  count: number;
}

export interface AssignmentSocketMessage {
  type: 'subscribed' | 'assignment:update';
  assignmentId: string;
  message?: string;
  assignment?: Assignment;
}

export const QUESTION_TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: 'mcq', label: 'Multiple Choice Questions' },
  { value: 'short', label: 'Short Questions' },
  { value: 'long', label: 'Long Answer Questions' },
  { value: 'diagram', label: 'Diagram/Graph-Based Questions' },
  { value: 'numerical', label: 'Numerical Problems' },
];
