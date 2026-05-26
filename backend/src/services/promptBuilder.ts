import { IAssignment } from '../types';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice Questions',
  short: 'Short Answer Questions',
  long: 'Long Answer Questions',
  diagram: 'Diagram or Graph-Based Questions',
  numerical: 'Numerical Problems',
};

export function buildPrompt(assignment: IAssignment): string {
  const questionTypesDescription = assignment.questionTypes
    .map((questionType, index) => {
      const label = QUESTION_TYPE_LABELS[questionType.type] || questionType.type;
      return `${index + 1}. ${label}: ${questionType.count} question(s), ${questionType.marks} mark(s) each`;
    })
    .join('\n');

  const trimmedMaterial =
    assignment.uploadedFileText.length > 14000
      ? `${assignment.uploadedFileText.slice(0, 14000)}\n... [truncated]`
      : assignment.uploadedFileText;

  const sections = [
    'You are an expert school assessment designer.',
    'Create a polished question paper in a strict structured format.',
    '',
    'Exam brief:',
    `- Assessment title: ${assignment.title}`,
    `- Subject: ${assignment.subject}`,
    `- Total questions: ${assignment.totalQuestions}`,
    `- Total marks: ${assignment.totalMarks}`,
    `- Due date: ${assignment.dueDate instanceof Date ? assignment.dueDate.toISOString().split('T')[0] : assignment.dueDate}`,
    '',
    'Question type distribution:',
    questionTypesDescription,
    '',
    'Difficulty mix:',
    '- Around 30% Easy',
    '- Around 50% Moderate',
    '- Around 20% Hard',
    '',
    'Output rules:',
    '- Group questions into clear sections such as Section A, Section B, etc.',
    '- Each section must contain a title and an instruction line.',
    '- Each question must have question text, difficulty, and marks.',
    '- MCQ questions must include exactly 4 options.',
    '- Diagram questions must describe the diagram clearly in the question.',
    '- Numerical questions must contain concrete values or data where useful.',
    '- Do not include an answer key.',
    '- Do not include explanations outside the schema.',
    '- General instructions should read like a real exam paper.',
    '- If the material does not specify institution or class, create tasteful generic placeholders.',
  ];

  if (assignment.additionalInstructions.trim()) {
    sections.push('', 'Teacher instructions:', assignment.additionalInstructions.trim());
  }

  if (trimmedMaterial.trim()) {
    sections.push('', 'Reference material:', trimmedMaterial.trim());
  }

  return sections.join('\n');
}

export default buildPrompt;
