import { AssignmentResponse, JobStateSnapshot } from '../types';
import { getRedisClient } from '../config/redis';

const ASSIGNMENT_TTL_SECONDS = 60 * 30;
const JOB_STATE_TTL_SECONDS = 60 * 60 * 6;

function assignmentListKey(userId: string): string {
  return `assignments:list:${userId}`;
}

function assignmentKey(id: string, userId: string): string {
  return `assignment:${userId}:${id}`;
}

function jobStateKey(id: string): string {
  return `assignment:${id}:job-state`;
}

export async function getCachedAssignment(id: string, userId: string): Promise<AssignmentResponse | null> {
  const cached = await getRedisClient().get(assignmentKey(id, userId));
  return cached ? (JSON.parse(cached) as AssignmentResponse) : null;
}

export async function cacheAssignment(assignment: AssignmentResponse, userId: string): Promise<void> {
  const client = getRedisClient();
  await client.setex(assignmentKey(assignment.id, userId), ASSIGNMENT_TTL_SECONDS, JSON.stringify(assignment));
}

export async function invalidateAssignmentCache(id: string, userId: string): Promise<void> {
  const client = getRedisClient();
  await client.del(assignmentKey(id, userId), assignmentListKey(userId));
}

export async function getCachedAssignmentList(userId: string): Promise<AssignmentResponse[] | null> {
  const cached = await getRedisClient().get(assignmentListKey(userId));
  return cached ? (JSON.parse(cached) as AssignmentResponse[]) : null;
}

export async function cacheAssignmentList(assignments: AssignmentResponse[], userId: string): Promise<void> {
  await getRedisClient().setex(
    assignmentListKey(userId),
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
