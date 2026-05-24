import "server-only";

/**
 * Queue Workers
 * =============
 * Worker framework for processing jobs from queues.
 * Each worker polls a queue, processes jobs, and handles errors.
 *
 * WHY: Provides a consistent, observable pattern for background job
 * processing with graceful shutdown support.
 */

import type { QueueName, Job, JobPayload } from "./core";
import { dequeueJob, ackJob, nackJob } from "./core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobHandler = (job: Job) => Promise<{ success: boolean; error?: string }>;

export interface WorkerConfig {
  queue: QueueName;
  handler: JobHandler;
  pollIntervalMs?: number;
  maxConcurrent?: number;
  maxRuntimeMs?: number;
}

export interface WorkerStatus {
  queue: QueueName;
  running: boolean;
  processed: number;
  failed: number;
  lastProcessedAt: string | null;
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Worker registry (in-memory, per-process)
// ---------------------------------------------------------------------------

const _workers = new Map<QueueName, WorkerStatus>();

export function getWorkerStatus(queue: QueueName): WorkerStatus | undefined {
  return _workers.get(queue);
}

export function getAllWorkerStatuses(): WorkerStatus[] {
  return Array.from(_workers.values());
}

// ---------------------------------------------------------------------------
// Process a single job
// ---------------------------------------------------------------------------

export async function processJob(
  queue: QueueName,
  handler: JobHandler,
  options?: { timeoutMs?: number }
): Promise<{ processed: boolean; jobId?: string; error?: string; deadLettered?: boolean }> {
  const job = await dequeueJob(queue);
  if (!job) {
    return { processed: false };
  }

  const timeoutMs = options?.timeoutMs ?? 30000;
  const status = _workers.get(queue);
  if (status) {
    status.lastProcessedAt = new Date().toISOString();
  }

  try {
    // Race against timeout
    const result = await Promise.race([
      handler(job),
      new Promise<{ success: false; error: string }>((_, reject) =>
        setTimeout(() => reject(new Error(`Job timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    if (result.success) {
      await ackJob(queue, job.id);
      if (status) {
        status.processed += 1;
      }
      return { processed: true, jobId: job.id };
    }

    const nackResult = await nackJob(queue, job.id, result.error ?? "Unknown error");
    if (status) {
      status.failed += 1;
      status.lastError = result.error ?? "Unknown error";
    }
    return { processed: false, jobId: job.id, error: result.error, deadLettered: nackResult.deadLettered };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const nackResult = await nackJob(queue, job.id, message);
    if (status) {
      status.failed += 1;
      status.lastError = message;
    }
    return { processed: false, jobId: job.id, error: message, deadLettered: nackResult.deadLettered };
  }
}

// ---------------------------------------------------------------------------
// Process a batch of jobs
// ---------------------------------------------------------------------------

export async function processJobBatch(
  queue: QueueName,
  handler: JobHandler,
  options?: { batchSize?: number; timeoutMs?: number }
): Promise<{
  processed: number;
  failed: number;
  deadLettered: number;
  errors: Array<{ jobId: string; error: string }>;
}> {
  const batchSize = options?.batchSize ?? 10;
  let processed = 0;
  let failed = 0;
  let deadLettered = 0;
  const errors: Array<{ jobId: string; error: string }> = [];

  for (let i = 0; i < batchSize; i++) {
    const result = await processJob(queue, handler, { timeoutMs: options?.timeoutMs });
    if (!result.processed && !result.jobId) {
      // No more jobs
      break;
    }
    if (result.processed) {
      processed++;
    } else {
      failed++;
      if (result.deadLettered) deadLettered++;
      if (result.error && result.jobId) {
        errors.push({ jobId: result.jobId, error: result.error });
      }
    }
  }

  return { processed, failed, deadLettered, errors };
}

// ---------------------------------------------------------------------------
// Pre-built job handlers for common tasks
// ---------------------------------------------------------------------------

export async function createNotificationJobHandler(
  sendFn: (payload: JobPayload) => Promise<{ success: boolean; error?: string }>
): Promise<JobHandler> {
  return async (job: Job) => {
    return sendFn(job.payload);
  };
}

export async function createAnalyticsJobHandler(
  aggregateFn: (payload: JobPayload) => Promise<void>
): Promise<JobHandler> {
  return async (job: Job) => {
    try {
      await aggregateFn(job.payload);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}

// ---------------------------------------------------------------------------
// Worker initialization
// ---------------------------------------------------------------------------

export function initializeWorker(config: WorkerConfig): WorkerStatus {
  const status: WorkerStatus = {
    queue: config.queue,
    running: true,
    processed: 0,
    failed: 0,
    lastProcessedAt: null,
    lastError: null,
  };

  _workers.set(config.queue, status);
  return status;
}

export function stopWorker(queue: QueueName): void {
  const status = _workers.get(queue);
  if (status) {
    status.running = false;
  }
}

export function stopAllWorkers(): void {
  for (const status of _workers.values()) {
    status.running = false;
  }
}
