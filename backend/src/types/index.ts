import { Document } from 'mongoose';

export type QuestionType = 'mcq' | 'short' | 'long' | 'diagram' | 'numerical';
export type Difficulty = 'Easy' | 'Moderate' | 'Hard';
export type AssignmentStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type PdfStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface IQuestionTypeConfig {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface IQuestion {
  number: number;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  answer: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedPaper {
  institutionName: string;
  examTitle: string;
  subject: string;
  className: string;
  duration: string;
  totalMarks: number;
  date: string;
  generalInstructions: string;
  sections: ISection[];
}

export interface IAssignment {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: IQuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
  uploadedFileText: string;
  materialFileName: string | null;
  status: AssignmentStatus;
  pdfStatus: PdfStatus;
  generatedPaper: IGeneratedPaper | null;
  pdfPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentDocument extends IAssignment, Document {}

export interface CreateAssignmentBody {
  title?: string;
  subject?: string;
  dueDate: string;
  questionTypes: string;
  totalQuestions?: string;
  totalMarks?: string;
  additionalInstructions?: string;
}

export interface AssignmentResponse {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: IQuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
  materialFileName: string | null;
  status: AssignmentStatus;
  pdfStatus: PdfStatus;
  generatedPaper: IGeneratedPaper | null;
  pdfDownloadUrl: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface WSSubscribeMessage {
  type: 'subscribe';
  assignmentId: string;
}

export interface WSSubscribedMessage {
  type: 'subscribed';
  assignmentId: string;
}

export interface WSAssignmentUpdateMessage {
  type: 'assignment:update';
  assignmentId: string;
  assignment: AssignmentResponse;
  message?: string;
}

export type WSIncomingMessage = WSSubscribeMessage;
export type WSOutgoingMessage = WSSubscribedMessage | WSAssignmentUpdateMessage;

export interface GenerationJobData {
  assignmentId: string;
}

export interface PdfJobData {
  assignmentId: string;
}

export interface JobStateSnapshot {
  assignmentId: string;
  status: AssignmentStatus;
  pdfStatus: PdfStatus;
  updatedAt: string;
}
