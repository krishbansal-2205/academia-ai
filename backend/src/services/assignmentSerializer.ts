import { HydratedDocument } from 'mongoose';
import { IAssignmentDocument, AssignmentResponse } from '../types';

export function buildPdfDownloadUrl(id: string, pdfStatus: string): string | null {
  return pdfStatus === 'completed' ? `/api/assignments/${id}/pdf/download` : null;
}

export function serializeAssignment(
  assignment: HydratedDocument<IAssignmentDocument> | IAssignmentDocument
): AssignmentResponse {
  const id = assignment._id.toString();

  return {
    id,
    title: assignment.title,
    subject: assignment.subject,
    dueDate: assignment.dueDate.toISOString(),
    questionTypes: assignment.questionTypes,
    totalQuestions: assignment.totalQuestions,
    totalMarks: assignment.totalMarks,
    additionalInstructions: assignment.additionalInstructions,
    materialFileName: assignment.materialFileName,
    status: assignment.status,
    pdfStatus: assignment.pdfStatus,
    generatedPaper: assignment.generatedPaper,
    pdfDownloadUrl: buildPdfDownloadUrl(id, assignment.pdfStatus),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}
