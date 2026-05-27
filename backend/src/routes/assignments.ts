import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import multer from 'multer';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import Assignment from '../models/Assignment';
import { addGenerationJob } from '../queues/generationQueue';
import { addPdfJob } from '../queues/pdfQueue';
import { cacheAssignment, cacheAssignmentList, getCachedAssignment, getCachedAssignmentList, invalidateAssignmentCache, setJobState } from '../services/assignmentCache';
import { serializeAssignment } from '../services/assignmentSerializer';
import { CreateAssignmentBody, IQuestionTypeConfig } from '../types';

const router = Router();
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
  },
});

const QuestionTypeSchema = z.object({
  type: z.enum(['mcq', 'short', 'long', 'diagram', 'numerical']),
  count: z.number().int().positive(),
  marks: z.number().int().positive(),
});

const CreateAssignmentSchema = z.object({
  title: z.string().trim().max(120).optional().default(''),
  subject: z.string().trim().max(80).optional().default(''),
  dueDate: z.coerce.date(),
  additionalInstructions: z.string().trim().max(2000).optional().default(''),
  questionTypes: z.array(QuestionTypeSchema).min(1),
  totalQuestions: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
});

async function extractFileText(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function sentenceCaseFromSlug(value: string): string {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function inferSubject(explicitSubject: string, title: string, instructions: string): string {
  if (explicitSubject.trim()) {
    return explicitSubject.trim();
  }

  const source = `${title} ${instructions}`.toLowerCase();
  const subjectMatchers: Array<[RegExp, string]> = [
    [/\bphysics|chemistry|biology|science|electricity|electrolysis\b/, 'Science'],
    [/\balgebra|geometry|calculus|math|mathematics|equation\b/, 'Mathematics'],
    [/\bgrammar|poem|literature|comprehension|english\b/, 'English'],
    [/\bhistory|civics|geography|economics\b/, 'Social Studies'],
    [/\bpython|coding|computer|algorithm|programming\b/, 'Computer Science'],
  ];

  const matched = subjectMatchers.find(([matcher]) => matcher.test(source));
  return matched?.[1] ?? 'General Studies';
}

function buildTitle(explicitTitle: string, fileName: string | null, instructions: string): string {
  if (explicitTitle.trim()) {
    return explicitTitle.trim();
  }

  if (fileName) {
    return sentenceCaseFromSlug(fileName);
  }

  if (instructions.trim()) {
    const words = instructions.trim().split(/\s+/).slice(0, 6).join(' ');
    return `${words}${instructions.trim().split(/\s+/).length > 6 ? '...' : ''}`;
  }

  return `AI Assessment ${new Date().toLocaleDateString('en-IN')}`;
}

function parseQuestionTypes(rawQuestionTypes: string): IQuestionTypeConfig[] {
  const parsed = JSON.parse(rawQuestionTypes) as unknown;
  return z.array(QuestionTypeSchema).parse(parsed);
}

function sumQuestionTypes(questionTypes: IQuestionTypeConfig[]): { totalQuestions: number; totalMarks: number } {
  return questionTypes.reduce(
    (totals, questionType) => ({
      totalQuestions: totals.totalQuestions + questionType.count,
      totalMarks: totals.totalMarks + questionType.count * questionType.marks,
    }),
    { totalQuestions: 0, totalMarks: 0 }
  );
}

async function fetchAssignmentOr404(id: string, response: Response) {
  const assignment = await Assignment.findById(id);
  if (!assignment) {
    response.status(404).json({ error: 'Assignment not found' });
    return null;
  }

  return assignment;
}

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateAssignmentBody;
    const parsedQuestionTypes = parseQuestionTypes(body.questionTypes);
    const derivedTotals = sumQuestionTypes(parsedQuestionTypes);

    const validatedPayload = CreateAssignmentSchema.parse({
      title: body.title,
      subject: body.subject,
      dueDate: body.dueDate,
      additionalInstructions: body.additionalInstructions,
      questionTypes: parsedQuestionTypes,
      totalQuestions: Number(body.totalQuestions) || derivedTotals.totalQuestions,
      totalMarks: Number(body.totalMarks) || derivedTotals.totalMarks,
    });

    let uploadedFileText = '';
    let materialFileName: string | null = null;

    if (req.file) {
      materialFileName = req.file.originalname;
      uploadedFileText = await extractFileText(req.file.path, req.file.mimetype);
    }

    const title = buildTitle(
      validatedPayload.title,
      materialFileName,
      validatedPayload.additionalInstructions
    );
    const subject = inferSubject(
      validatedPayload.subject,
      title,
      `${validatedPayload.additionalInstructions} ${uploadedFileText.slice(0, 500)}`
    );

    const assignment = await Assignment.create({
      title,
      subject,
      dueDate: validatedPayload.dueDate,
      questionTypes: validatedPayload.questionTypes,
      totalQuestions: derivedTotals.totalQuestions,
      totalMarks: derivedTotals.totalMarks,
      additionalInstructions: validatedPayload.additionalInstructions,
      uploadedFileText,
      materialFileName,
      status: 'processing',
      pdfStatus: 'idle',
      generatedPaper: null,
      pdfPath: null,
    });

    await addGenerationJob(assignment._id.toString());

    const serializedAssignment = serializeAssignment(assignment);
    await cacheAssignment(serializedAssignment);
    await invalidateAssignmentCache(serializedAssignment.id);
    await setJobState({
      assignmentId: serializedAssignment.id,
      status: serializedAssignment.status,
      pdfStatus: serializedAssignment.pdfStatus,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: serializedAssignment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.flatten(),
      });
      return;
    }

    console.error('Error creating assignment:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to create assignment',
      message: (error as Error).message,
    });
  }
});

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cachedAssignments = await getCachedAssignmentList();
    if (cachedAssignments) {
      res.json({
        success: true,
        data: cachedAssignments,
        count: cachedAssignments.length,
      });
      return;
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 });
    const data = assignments.map((assignment) => serializeAssignment(assignment));

    await cacheAssignmentList(data);
    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list assignments',
      message: (error as Error).message,
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = routeParam(req.params.id);
    const cachedAssignment = await getCachedAssignment(assignmentId);
    if (cachedAssignment) {
      res.json({
        success: true,
        data: cachedAssignment,
      });
      return;
    }

    const assignment = await fetchAssignmentOr404(assignmentId, res);
    if (!assignment) {
      return;
    }

    const data = serializeAssignment(assignment);
    await cacheAssignment(data);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch assignment',
      message: (error as Error).message,
    });
  }
});

router.post('/:id/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = routeParam(req.params.id);
    const assignment = await fetchAssignmentOr404(assignmentId, res);
    if (!assignment) {
      return;
    }

    assignment.status = 'processing';
    assignment.pdfStatus = 'idle';
    assignment.generatedPaper = null;
    assignment.pdfPath = null;
    await assignment.save();

    await addGenerationJob(assignment._id.toString());

    const serializedAssignment = serializeAssignment(assignment);
    await cacheAssignment(serializedAssignment);
    await invalidateAssignmentCache(serializedAssignment.id);
    await setJobState({
      assignmentId: serializedAssignment.id,
      status: serializedAssignment.status,
      pdfStatus: serializedAssignment.pdfStatus,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: serializedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to regenerate assignment',
      message: (error as Error).message,
    });
  }
});

router.post('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = routeParam(req.params.id);
    const assignment = await fetchAssignmentOr404(assignmentId, res);
    if (!assignment) {
      return;
    }

    if (!assignment.generatedPaper) {
      res.status(409).json({
        error: 'Question paper not ready yet',
      });
      return;
    }

    assignment.pdfStatus = 'processing';
    await assignment.save();
    await addPdfJob(assignment._id.toString());

    const serializedAssignment = serializeAssignment(assignment);
    await cacheAssignment(serializedAssignment);
    await invalidateAssignmentCache(serializedAssignment.id);
    await setJobState({
      assignmentId: serializedAssignment.id,
      status: serializedAssignment.status,
      pdfStatus: serializedAssignment.pdfStatus,
      updatedAt: new Date().toISOString(),
    });

    res.status(202).json({
      success: true,
      data: serializedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to queue PDF generation',
      message: (error as Error).message,
    });
  }
});

router.get('/:id/pdf/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = routeParam(req.params.id);
    const assignment = await fetchAssignmentOr404(assignmentId, res);
    if (!assignment) {
      return;
    }

    if (assignment.pdfStatus !== 'completed' || !assignment.pdfPath || !fs.existsSync(assignment.pdfPath)) {
      res.status(409).json({
        error: 'PDF is not ready yet',
      });
      return;
    }

    res.download(assignment.pdfPath, `${assignment.title.replace(/[^\w\s-]/g, '').trim() || 'assessment'}.pdf`);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to download PDF',
      message: (error as Error).message,
    });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = routeParam(req.params.id);
    const assignment = await fetchAssignmentOr404(assignmentId, res);
    if (!assignment) {
      return;
    }

    // Delete the generated PDF file if it exists
    if (assignment.pdfPath && fs.existsSync(assignment.pdfPath)) {
      try {
        fs.unlinkSync(assignment.pdfPath);
      } catch {
        // Non-fatal — continue with DB deletion
      }
    }

    // Delete uploaded source file if it exists
    if (req.file) {
      // req.file won't be present here, but pdfPath gives us a hint
    }

    await Assignment.findByIdAndDelete(assignmentId);
    await invalidateAssignmentCache(assignmentId);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete assignment',
      message: (error as Error).message,
    });
  }
});

export default router;
