"use server";

/**
 * Queue System Core
 * =================
 * Redis-backed priority queues with dead-letter queues, exponential backoff,
 * idempotency keys, and job scheduling.
 *
 * WHY: Background work (notifications, analytics, AI) must not block
 * user requests. Priority queues ensure critical work (SOS alerts)
 * is processed before batch work (analytics aggregation).
 */

import { getRedis } from "@/lib/redis";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueueName =
  | "notifications"
  | "notifications:critical"
  | "emails"
  | "analytics"
  | "reputation"
  | "recommendations"
  | "moderation"
  | "search:index"
  | "webhooks"
  | "exports";

export type JobPriority = "critical" | "high" | "normal" | "low" | "batch";

export interface JobPayload {
  [key: string]: unknown;
}

export interface Job {
  id: string;
  queue: QueueName;
  type: string;
  payload: JobPayload;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor: string;
  idempotencyKey?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueOptions {
  priority?: JobPriority;
  delayMs?: number;
  maxAttempts?: number;
  idempotencyKey?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueStats {
  queued: number;
  processing: number;
  scheduled: number;
  dead: number;
  processedToday: number;
  failedToday: number;
}

const PRIORITY_SCORES: Record<JobPriority, number> = {
  critical: 0,
  high: 25,
  normal: 50,
  low: 75,
  batch: 100,
};

const MAX_ATTEMPTS_DEFAULT = 3;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 300000; // 5 minutes

// ---------------------------------------------------------------------------
// Key builders
// ---------------------------------------------------------------------------

function queueKey(queue: QueueName): string {
  return `queue:${queue}:pending`;
}

function processingKey(queue: QueueName): string {
  return `queue:${queue}:processing`;
}

function scheduledKey(queue: QueueName): string {
  return `queue:${queue}:scheduled`;
}

function deadKey(queue: QueueName): string {
  return `queue:${queue}:dead`;
}

function idempotencyKey(key: string): string {
  return `queue:idempotency:${key}`;
}

function statsKey(queue: QueueName, metric: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `queue:stats:${queue}:${metric}:${today}`;
}

// ---------------------------------------------------------------------------
// Enqueue
// ---------------------------------------------------------------------------

/**
 * Add a job to a queue.
 * Jobs are dequeued in priority order, then FIFO within same priority.
 */
export async function enqueueJob(
  queue: QueueName,
  type: string,
  payload: JobPayload,
  options: EnqueueOptions = {}
): Promise<{ jobId: string; enqueued: boolean; duplicate?: boolean; error?: string }> {
  const redis = getRedis();
  if (!redis) {
    return { jobId: "", enqueued: false, error: "Redis unavailable" };
  }

  // Idempotency check
  if (options.idempotencyKey) {
    const exists = await redis.get(idempotencyKey(options.idempotencyKey));
    if (exists) {
      return { jobId: exists as string, enqueued: false, duplicate: true };
    }
  }

  const jobId = randomUUID();
  const now = Date.now();
  const scheduledFor = now + (options.delayMs ?? 0);
  const priorityScore = PRIORITY_SCORES[options.priority ?? "normal"];
  // Combine priority + scheduled time for sorting
  const score = priorityScore * 1e12 + scheduledFor;

  const job: Job = {
    id: jobId,
    queue,
    type,
    payload,
    priority: options.priority ?? "normal",
    attempts: 0,
    maxAttempts: options.maxAttempts ?? MAX_ATTEMPTS_DEFAULT,
    createdAt: new Date().toISOString(),
    scheduledFor: new Date(scheduledFor).toISOString(),
    idempotencyKey: options.idempotencyKey,
    correlationId: options.correlationId,
    metadata: options.metadata,
  };

  try {
    const pipeline = redis.pipeline();

    if (options.delayMs && options.delayMs > 0) {
      // Scheduled for future
      pipeline.zadd(scheduledKey(queue), { score: scheduledFor, member: jobId });
    } else {
      // Immediate
      pipeline.zadd(queueKey(queue), { score, member: jobId });
    }

    pipeline.hset(`queue:job:${jobId}`, "data", JSON.stringify(job));
    pipeline.expire(`queue:job:${jobId}`, 86400 * 7); // 7 days TTL

    if (options.idempotencyKey) {
      pipeline.setex(idempotencyKey(options.idempotencyKey), 86400, jobId);
    }

    await pipeline.exec();

    return { jobId, enqueued: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { jobId, enqueued: false, error: message };
  }
}

/**
 * Enqueue multiple jobs in a batch (single round-trip).
 */
export async function enqueueJobs(
  jobs: Array<{ queue: QueueName; type: string; payload: JobPayload; options?: EnqueueOptions }>
): Promise<Array<{ jobId: string; enqueued: boolean; error?: string }>> {
  const results: Array<{ jobId: string; enqueued: boolean; error?: string }> = [];

  for (const job of jobs) {
    const result = await enqueueJob(job.queue, job.type, job.payload, job.options);
    results.push(result);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Dequeue
// ---------------------------------------------------------------------------

/**
 * Claim the next available job from a queue.
 * Moves the job from pending to processing.
 */
export async function dequeueJob(queue: QueueName): Promise<Job | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    // First, promote any scheduled jobs that are now due
    const now = Date.now();
    const dueJobs = await redis.zrangebyscore(scheduledKey(queue), 0, now, { limit: { offset: 0, count: 100 } });

    if (dueJobs && dueJobs.length > 0) {
      const promotePipeline = redis.pipeline();
      for (const jobId of dueJobs) {
        const priorityScore = PRIORITY_SCORES.normal;
        const score = priorityScore * 1e12 + now;
        promotePipeline.zadd(queueKey(queue), { score, member: jobId as string });
        promotePipeline.zrem(scheduledKey(queue), jobId as string);
      }
      await promotePipeline.exec();
    }

    // Now claim the highest priority job
    const pending = await redis.zrange(queueKey(queue), 0, 0, { withScores: false });
    if (!pending || pending.length === 0) return null;

    const jobId = pending[0] as string;

    // Atomic claim: remove from pending, add to processing
    const pipeline = redis.pipeline();
    pipeline.zrem(queueKey(queue), jobId);
    pipeline.zadd(processingKey(queue), { score: now, member: jobId });
    pipeline.hget(`queue:job:${jobId}`, "data");
    const results = await pipeline.exec();

    const jobData = results?.[2] as string | undefined;
    if (!jobData) return null;

    const job = JSON.parse(jobData) as Job;
    job.attempts += 1;

    // Update attempts
    await redis.hset(`queue:job:${jobId}`, "data", JSON.stringify(job));

    return job;
  } catch (err) {
    console.error(`[queue] dequeueJob(${queue}) error:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Ack / Nack / Retry
// ---------------------------------------------------------------------------

/**
 * Mark a job as completed successfully.
 */
export async function ackJob(queue: QueueName, jobId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const pipeline = redis.pipeline();
  pipeline.zrem(processingKey(queue), jobId);
  pipeline.del(`queue:job:${jobId}`);
  pipeline.incr(statsKey(queue, "processed"));
  pipeline.expire(statsKey(queue, "processed"), 86400 * 7);

  await pipeline.exec();
}

/**
 * Mark a job as failed. Either retries with backoff or moves to DLQ.
 */
export async function nackJob(
  queue: QueueName,
  jobId: string,
  errorMessage: string
): Promise<{ retried: boolean; deadLettered: boolean }> {
  const redis = getRedis();
  if (!redis) return { retried: false, deadLettered: false };

  const jobData = await redis.hget(`queue:job:${jobId}`, "data");
  if (!jobData) {
    // Job already gone
    await redis.zrem(processingKey(queue), jobId);
    return { retried: false, deadLettered: false };
  }

  const job = JSON.parse(jobData as string) as Job;

  if (job.attempts < job.maxAttempts) {
    // Retry with exponential backoff
    const backoff = Math.min(
      BACKOFF_BASE_MS * Math.pow(2, job.attempts - 1),
      BACKOFF_MAX_MS
    );
    const retryAt = Date.now() + backoff;
    const priorityScore = PRIORITY_SCORES[job.priority];
    const score = priorityScore * 1e12 + retryAt;

    const pipeline = redis.pipeline();
    pipeline.zrem(processingKey(queue), jobId);
    pipeline.zadd(scheduledKey(queue), { score: retryAt, member: jobId });
    pipeline.hset(`queue:job:${jobId}`, "data", JSON.stringify({
      ...job,
      lastError: errorMessage,
    }));

    await pipeline.exec();

    return { retried: true, deadLettered: false };
  }

  // Max attempts reached — move to dead letter queue
  const deadJob = {
    ...job,
    failedAt: new Date().toISOString(),
    finalError: errorMessage,
  };

  const pipeline = redis.pipeline();
  pipeline.zrem(processingKey(queue), jobId);
  pipeline.zadd(deadKey(queue), { score: Date.now(), member: jobId });
  pipeline.hset(`queue:job:${jobId}`, "data", JSON.stringify(deadJob));
  pipeline.incr(statsKey(queue, "failed"));
  pipeline.expire(statsKey(queue, "failed"), 86400 * 7);

  await pipeline.exec();

  return { retried: false, deadLettered: true };
}

// ---------------------------------------------------------------------------
// Dead letter queue management
// ---------------------------------------------------------------------------

/**
 * Get dead letter jobs for a queue.
 */
export async function getDeadLetterJobs(
  queue: QueueName,
  options?: { limit?: number; offset?: number }
): Promise<Job[]> {
  const redis = getRedis();
  if (!redis) return [];

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const jobIds = await redis.zrevrange(deadKey(queue), offset, offset + limit - 1);
  if (!jobIds || jobIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of jobIds) {
    pipeline.hget(`queue:job:${id}`, "data");
  }

  const results = await pipeline.exec();
  const jobs: Job[] = [];

  for (const result of results ?? []) {
    if (result) {
      try {
        jobs.push(JSON.parse(result as string) as Job);
      } catch {
        // Skip invalid
      }
    }
  }

  return jobs;
}

/**
 * Requeue a dead letter job for retry.
 */
export async function requeueDeadJob(queue: QueueName, jobId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const jobData = await redis.hget(`queue:job:${jobId}`, "data");
  if (!jobData) return false;

  const job = JSON.parse(jobData as string) as Job;
  job.attempts = 0;
  job.maxAttempts = job.maxAttempts + 1; // Give it one more chance

  const now = Date.now();
  const priorityScore = PRIORITY_SCORES[job.priority];
  const score = priorityScore * 1e12 + now;

  const pipeline = redis.pipeline();
  pipeline.zrem(deadKey(queue), jobId);
  pipeline.zadd(queueKey(queue), { score, member: jobId });
  pipeline.hset(`queue:job:${jobId}`, "data", JSON.stringify(job));

  await pipeline.exec();
  return true;
}

/**
 * Permanently delete a dead letter job.
 */
export async function deleteDeadJob(queue: QueueName, jobId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const pipeline = redis.pipeline();
  pipeline.zrem(deadKey(queue), jobId);
  pipeline.del(`queue:job:${jobId}`);
  await pipeline.exec();
}
