"use server";

import { getRedis } from "@/lib/redis";

export interface JobPayload {
  id: string;
  type: string;
  data: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
}

const MAX_ATTEMPTS = 3;
const JOB_QUEUE_KEY = "jobs:queue";
const JOB_DLQ_KEY = "jobs:dlq";
const JOB_PROCESSING_KEY = "jobs:processing";

function generateJobId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Enqueue a background job.
 */
export async function enqueueJob(
  type: string,
  data: Record<string, unknown>,
  options?: { delayMs?: number; idempotencyKey?: string }
): Promise<string> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis not available for job queue");
  }

  const id = options?.idempotencyKey || generateJobId();

  // Idempotency check
  if (options?.idempotencyKey) {
    const existing = await redis.get(`job:idempotency:${id}`);
    if (existing) return id;
    await redis.setex(`job:idempotency:${id}`, 86400, "1");
  }

  const job: JobPayload = {
    id,
    type,
    data,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: new Date().toISOString(),
  };

  if (options?.delayMs && options.delayMs > 0) {
    const score = Date.now() + options.delayMs;
    await redis.zadd("jobs:delayed", { score, member: JSON.stringify(job) });
  } else {
    await redis.rpush(JOB_QUEUE_KEY, JSON.stringify(job));
  }

  return id;
}

/**
 * Dequeue the next available job.
 */
export async function dequeueJob(): Promise<JobPayload | null> {
  const redis = getRedis();
  if (!redis) return null;

  // First, promote delayed jobs that are ready
  const readyJobs = await redis.zrange("jobs:delayed", 0, Date.now(), { byScore: true });
  for (const jobStr of readyJobs) {
    await redis.zrem("jobs:delayed", jobStr);
    await redis.rpush(JOB_QUEUE_KEY, jobStr);
  }

  // Then dequeue from main queue
  const item = await redis.lpop(JOB_QUEUE_KEY);
  if (!item) return null;

  try {
    const job = JSON.parse(item as string) as JobPayload;
    job.attempts += 1;
    await redis.hset(JOB_PROCESSING_KEY, { [job.id]: JSON.stringify(job) });
    return job;
  } catch {
    return null;
  }
}

/**
 * Acknowledge a job as completed.
 */
export async function ackJob(jobId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.hdel(JOB_PROCESSING_KEY, jobId);
}

/**
 * Move a failed job to the dead letter queue or retry.
 */
export async function failJob(job: JobPayload, errorMessage: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  await redis.hdel(JOB_PROCESSING_KEY, job.id);

  if (job.attempts < job.maxAttempts) {
    // Exponential backoff retry
    const delayMs = Math.pow(2, job.attempts) * 1000;
    const score = Date.now() + delayMs;
    await redis.zadd("jobs:delayed", { score, member: JSON.stringify(job) });
  } else {
    // Move to DLQ
    const deadJob = { ...job, failedAt: new Date().toISOString(), error: errorMessage };
    await redis.rpush(JOB_DLQ_KEY, JSON.stringify(deadJob));
  }
}

/**
 * Get queue statistics.
 */
export async function getQueueStats(): Promise<{
  queued: number;
  processing: number;
  delayed: number;
  dead: number;
}> {
  const redis = getRedis();
  if (!redis) return { queued: 0, processing: 0, delayed: 0, dead: 0 };

  const [queued, processing, delayed, dead] = await Promise.all([
    redis.llen(JOB_QUEUE_KEY),
    redis.hlen(JOB_PROCESSING_KEY),
    redis.zcard("jobs:delayed"),
    redis.llen(JOB_DLQ_KEY),
  ]);

  return {
    queued: queued || 0,
    processing: processing || 0,
    delayed: delayed || 0,
    dead: dead || 0,
  };
}

/**
 * Reprocess all jobs in the dead letter queue.
 */
export async function reprocessDeadLetterJobs(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  let count = 0;
  while (true) {
    const item = await redis.lpop(JOB_DLQ_KEY);
    if (!item) break;
    await redis.rpush(JOB_QUEUE_KEY, item);
    count++;
  }
  return count;
}
