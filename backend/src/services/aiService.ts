import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { IAssignment, IGeneratedPaper } from '../types';
import { buildPrompt } from './promptBuilder';

const QuestionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1),
  type: z.enum(['mcq', 'short', 'long', 'diagram', 'numerical']),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
  marks: z.number().positive(),
  options: z.array(z.string().min(1)).optional(),
  answer: z.string().min(1),
});

const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

const GeneratedPaperSchema = z.object({
  institutionName: z.string().min(1),
  examTitle: z.string().min(1),
  subject: z.string().min(1),
  className: z.string().min(1),
  duration: z.string().min(1),
  totalMarks: z.number().positive(),
  date: z.string().min(1),
  generalInstructions: z.string().min(1),
  sections: z.array(SectionSchema).min(1),
});

export async function generatePaper(assignment: IAssignment): Promise<IGeneratedPaper> {
  const prompt = buildPrompt(assignment);

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: GeneratedPaperSchema,
    prompt,
  });

  return object satisfies IGeneratedPaper;
}

export default generatePaper;
