import { Queue } from 'bullmq';
import { config } from '../config/env';
import { PdfJobData } from '../types';

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

let pdfQueue: Queue<PdfJobData> | null = null;

export function getPdfQueue(): Queue<PdfJobData> {
  if (pdfQueue) {
    return pdfQueue;
  }

  const redisOptions = parseRedisUrl(config.REDIS_URL);

  pdfQueue = new Queue<PdfJobData>('paper-pdf-generation', {
    connection: {
      host: redisOptions.host,
      port: redisOptions.port,
      maxRetriesPerRequest: null,
    },
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 1500,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  });

  console.log('PDF queue initialized');

  return pdfQueue;
}

export async function addPdfJob(assignmentId: string): Promise<void> {
  const queue = getPdfQueue();
  await queue.add(
    'generate-pdf',
    { assignmentId },
    {
      jobId: `pdf-${assignmentId}-${Date.now()}`,
    }
  );
}
