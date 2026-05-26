import { Queue } from 'bullmq';
import { config } from '../config/env';
import { GenerationJobData } from '../types';

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

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (generationQueue) {
    return generationQueue;
  }

  const redisOpts = parseRedisUrl(config.REDIS_URL);

  generationQueue = new Queue<GenerationJobData>('paper-generation', {
    connection: {
      host: redisOpts.host,
      port: redisOpts.port,
      maxRetriesPerRequest: null,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100, // keep last 100 completed jobs
      },
      removeOnFail: {
        count: 50, // keep last 50 failed jobs
      },
    },
  });

  console.log('✅ BullMQ generation queue initialized');

  return generationQueue;
}

/**
 * Add a paper generation job to the queue.
 */
export async function addGenerationJob(assignmentId: string): Promise<void> {
  const queue = getGenerationQueue();
  await queue.add(
    'generate-paper',
    { assignmentId },
    {
      jobId: `gen-${assignmentId}-${Date.now()}`,
    }
  );
  console.log(`📋 Generation job queued for assignment: ${assignmentId}`);
}

export default getGenerationQueue;
