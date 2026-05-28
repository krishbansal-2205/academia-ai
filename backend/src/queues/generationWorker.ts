import { Job, Worker } from 'bullmq';
import { config } from '../config/env';
import Assignment from '../models/Assignment';
import { generatePaper } from '../services/aiService';
import { GenerationJobData } from '../types';
import { addPdfJob } from './pdfQueue';
import { broadcastAssignmentUpdate } from '../websocket/socketManager';
import { serializeAssignment } from '../services/assignmentSerializer';
import { cacheAssignment, invalidateAssignmentCache, setJobState } from '../services/assignmentCache';

function parseRedisUrl(url: string): { host: string; port: number } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 6379,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

let worker: Worker<GenerationJobData> | null = null;

async function persistAndBroadcast(assignmentId: string, message?: string): Promise<void> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return;
  }

  const response = serializeAssignment(assignment);
  await cacheAssignment(response, assignment.userId);
  await invalidateAssignmentCache(assignmentId, assignment.userId);
  await setJobState({
    assignmentId,
    status: assignment.status,
    pdfStatus: assignment.pdfStatus,
    updatedAt: new Date().toISOString(),
  });
  broadcastAssignmentUpdate(response, message);
}

async function processGenerationJob(job: Job<GenerationJobData>): Promise<void> {
  const { assignmentId } = job.data;
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  assignment.status = 'processing';
  assignment.pdfStatus = 'idle';
  assignment.generatedPaper = null;
  assignment.pdfPath = null;
  await assignment.save();
  await persistAndBroadcast(assignmentId, 'Generating question paper');

  try {
    const generatedPaper = await generatePaper(assignment.toObject());

    assignment.generatedPaper = generatedPaper;
    assignment.status = 'completed';
    assignment.pdfStatus = 'processing';
    await assignment.save();

    await persistAndBroadcast(assignmentId, 'Question paper ready, preparing PDF');
    await addPdfJob(assignmentId);
  } catch (error) {
    assignment.status = 'failed';
    assignment.pdfStatus = 'idle';
    await assignment.save();
    await persistAndBroadcast(assignmentId, 'Generation failed');
    throw error;
  }
}

export function startGenerationWorker(): Worker<GenerationJobData> {
  if (worker) {
    return worker;
  }

  const redisOptions = parseRedisUrl(config.REDIS_URL);

  worker = new Worker<GenerationJobData>('paper-generation', processGenerationJob, {
    connection: {
      host: redisOptions.host,
      port: redisOptions.port,
      maxRetriesPerRequest: null,
    },
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`Generation job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Generation job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('Generation worker error:', error.message);
  });

  return worker;
}

export default startGenerationWorker;
