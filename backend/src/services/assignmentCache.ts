import { AssignmentResponse, JobStateSnapshot } from '../types';
import { getRedisClient } from '../config/redis';

const ASSIGNMENT_TTL_SECONDS = 60 * 30;
const JOB_STATE_TTL_SECONDS = 60 * 60 * 6;
const ASSIGNMENT_LIST_KEY = 'assignments:list';

function assignmentKey(id: string): string {
  return `assignment:${id}`;
}

function jobStateKey(id: string): string {
  return `assignment:${id}:job-state`;
}

export async function getCachedAssignment(id: string): Promise<AssignmentResponse | null> {
  const cached = await getRedisClient().get(assignmentKey(id));
  return cached ? (JSON.parse(cached) as AssignmentResponse) : null;
}

export async function cacheAssignment(assignment: AssignmentResponse): Promise<void> {
  const client = getRedisClient();
  await client.setex(assignmentKey(assignment.id), ASSIGNMENT_TTL_SECONDS, JSON.stringify(assignment));
}

export async function invalidateAssignmentCache(id: string): Promise<void> {
  const client = getRedisClient();
  await client.del(assignmentKey(id), ASSIGNMENT_LIST_KEY);
}

export async function getCachedAssignmentList(): Promise<AssignmentResponse[] | null> {
  const cached = await getRedisClient().get(ASSIGNMENT_LIST_KEY);
  return cached ? (JSON.parse(cached) as AssignmentResponse[]) : null;
}

export async function cacheAssignmentList(assignments: AssignmentResponse[]): Promise<void> {
  await getRedisClient().setex(
    ASSIGNMENT_LIST_KEY,
    ASSIGNMENT_TTL_SECONDS,
    JSON.stringify(assignments)
  );
}

export async function setJobState(state: JobStateSnapshot): Promise<void> {
  await getRedisClient().setex(jobStateKey(state.assignmentId), JOB_STATE_TTL_SECONDS, JSON.stringify(state));
}

export async function getJobState(assignmentId: string): Promise<JobStateSnapshot | null> {
  const cached = await getRedisClient().get(jobStateKey(assignmentId));
  return cached ? (JSON.parse(cached) as JobStateSnapshot) : null;
}
