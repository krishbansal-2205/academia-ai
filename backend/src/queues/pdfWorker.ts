import { Job, Worker } from 'bullmq';
import { config } from '../config/env';
import Assignment from '../models/Assignment';
import { PdfJobData } from '../types';
import { createPdfForPaper } from '../services/pdfService';
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

let worker: Worker<PdfJobData> | null = null;

async function processPdfJob(job: Job<PdfJobData>): Promise<void> {
  const { assignmentId } = job.data;
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new Error(`Assignment not found for PDF generation: ${assignmentId}`);
  }

  if (!assignment.generatedPaper) {
    throw new Error(`Generated paper is not available for assignment: ${assignmentId}`);
  }

  assignment.pdfStatus = 'processing';
  await assignment.save();

  let response = serializeAssignment(assignment);
  await cacheAssignment(response, assignment.userId);
  await invalidateAssignmentCache(assignmentId, assignment.userId);
  await setJobState({
    assignmentId,
    status: assignment.status,
    pdfStatus: assignment.pdfStatus,
    updatedAt: new Date().toISOString(),
  });
  broadcastAssignmentUpdate(response, 'Preparing PDF');

  try {
    assignment.pdfPath = createPdfForPaper(assignmentId, assignment.generatedPaper);
    assignment.pdfStatus = 'completed';
    await assignment.save();

    response = serializeAssignment(assignment);
    await cacheAssignment(response, assignment.userId);
    await invalidateAssignmentCache(assignmentId, assignment.userId);
    await setJobState({
      assignmentId,
      status: assignment.status,
      pdfStatus: assignment.pdfStatus,
      updatedAt: new Date().toISOString(),
    });
    broadcastAssignmentUpdate(response, 'PDF ready');
  } catch (error) {
    assignment.pdfStatus = 'failed';
    await assignment.save();

    response = serializeAssignment(assignment);
    await cacheAssignment(response, assignment.userId);
    await invalidateAssignmentCache(assignmentId, assignment.userId);
    await setJobState({
      assignmentId,
      status: assignment.status,
      pdfStatus: assignment.pdfStatus,
      updatedAt: new Date().toISOString(),
    });
    broadcastAssignmentUpdate(response, 'PDF generation failed');
    throw error;
  }
}

export function startPdfWorker(): Worker<PdfJobData> {
  if (worker) {
    return worker;
  }

  const redisOptions = parseRedisUrl(config.REDIS_URL);

  worker = new Worker<PdfJobData>('paper-pdf-generation', processPdfJob, {
    connection: {
      host: redisOptions.host,
      port: redisOptions.port,
      maxRetriesPerRequest: null,
    },
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    console.log(`PDF job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`PDF job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('PDF worker error:', error.message);
  });

  return worker;
}
