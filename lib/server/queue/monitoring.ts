"use server";

/**
 * Queue Monitoring
 * ================
 * Health checks, metrics, and alerting for the queue system.
 */

import { getRedis } from "@/lib/redis";
import type { QueueName, QueueStats, Job } from "./core";

// ---------------------------------------------------------------------------
// Stats per queue
// ---------------------------------------------------------------------------

export async function getQueueStats(queue: QueueName): Promise<QueueStats> {
  const redis = getRedis();
  if (!redis) {
    return { queued: 0, processing: 0, scheduled: 0, dead: 0, processedToday: 0, failedToday: 0 };
  }

  const today = new Date().toISOString().split("T")[0];

  const [
    queued,
    processing,
    scheduled,
    dead,
    processedToday,
    failedToday,
  ] = await Promise.all([
    redis.zcard(`queue:${queue}:pending`),
    redis.zcard(`queue:${queue}:processing`),
    redis.zcard(`queue:${queue}:scheduled`),
    redis.zcard(`queue:${queue}:dead`),
    redis.get(`queue:stats:${queue}:processed:${today}`),
    redis.get(`queue:stats:${queue}:failed:${today}`),
  ]);

  return {
    queued: Number(queued ?? 0),
    processing: Number(processing ?? 0),
    scheduled: Number(scheduled ?? 0),
    dead: Number(dead ?? 0),
    processedToday: Number(processedToday ?? 0),
    failedToday: Number(failedToday ?? 0),
  };
}

/**
 * Get stats for all queues.
 */
export async function getAllQueueStats(): Promise<Record<QueueName, QueueStats>> {
  const queues: QueueName[] = [
    "notifications",
    "notifications:critical",
    "emails",
    "analytics",
    "reputation",
    "recommendations",
    "moderation",
    "search:index",
    "webhooks",
    "exports",
  ];

  const stats: Partial<Record<QueueName, QueueStats>> = {};

  await Promise.all(
    queues.map(async (queue) => {
      stats[queue] = await getQueueStats(queue);
    })
  );

  return stats as Record<QueueName, QueueStats>;
}

// ---------------------------------------------------------------------------
// Processing jobs that are stuck
// ---------------------------------------------------------------------------

export interface StuckJob {
  jobId: string;
  queue: QueueName;
  inProcessingForMs: number;
}

/**
 * Find jobs that have been in "processing" state for too long.
 * These likely indicate crashed workers.
 */
export async function findStuckJobs(
  maxProcessingMs = 300000 // 5 minutes
): Promise<StuckJob[]> {
  const redis = getRedis();
  if (!redis) return [];

  const queues: QueueName[] = [
    "notifications",
    "notifications:critical",
    "emails",
    "analytics",
    "reputation",
    "recommendations",
    "moderation",
    "search:index",
    "webhooks",
    "exports",
  ];

  const now = Date.now();
  const stuckJobs: StuckJob[] = [];

  for (const queue of queues) {
    const processing = await redis.zrangebyscore(
      `queue:${queue}:processing`,
      0,
      now - maxProcessingMs,
      { withScores: true }
    );

    for (let i = 0; i < processing.length; i += 2) {
      const jobId = processing[i] as string;
      const score = Number(processing[i + 1] ?? 0);
      stuckJobs.push({
        jobId,
        queue,
        inProcessingForMs: now - score,
      });
    }
  }

  return stuckJobs;
}

/**
 * Recover stuck jobs by moving them back to the pending queue.
 */
export async function recoverStuckJobs(
  maxProcessingMs = 300000
): Promise<{ recovered: number; jobs: StuckJob[] }> {
  const redis = getRedis();
  if (!redis) return { recovered: 0, jobs: [] };

  const stuck = await findStuckJobs(maxProcessingMs);
  let recovered = 0;

  for (const job of stuck) {
    try {
      const jobData = await redis.hget(`queue:job:${job.jobId}`, "data");
      if (!jobData) {
        // Job data lost — just remove from processing
        await redis.zrem(`queue:${job.queue}:processing`, job.jobId);
        continue;
      }

      const parsed = JSON.parse(jobData as string) as Job;
      const now = Date.now();
      const priorityScore = parsed.priority === "critical" ? 0 :
        parsed.priority === "high" ? 25 :
        parsed.priority === "normal" ? 50 :
        parsed.priority === "low" ? 75 : 100;
      const score = priorityScore * 1e12 + now;

      const pipeline = redis.pipeline();
      pipeline.zrem(`queue:${job.queue}:processing`, job.jobId);
      pipeline.zadd(`queue:${job.queue}:pending`, { score, member: job.jobId });
      await pipeline.exec();

      recovered++;
    } catch {
      // Skip failed recoveries
    }
  }

  return { recovered, jobs: stuck };
}

// ---------------------------------------------------------------------------
// Queue health
// ---------------------------------------------------------------------------

export interface QueueHealth {
  healthy: boolean;
  queuesAtRisk: QueueName[];
  totalDead: number;
  totalStuck: number;
  avgProcessingTimeMs?: number;
}

export async function getQueueHealth(): Promise<QueueHealth> {
  const stats = await getAllQueueStats();
  const stuck = await findStuckJobs();

  const queuesAtRisk: QueueName[] = [];
  let totalDead = 0;

  for (const [queue, stat] of Object.entries(stats) as [QueueName, QueueStats][]) {
    totalDead += stat.dead;
    if (stat.dead > 100 || stat.processing > 100) {
      queuesAtRisk.push(queue);
    }
  }

  const healthy = queuesAtRisk.length === 0 && stuck.length < 50 && totalDead < 500;

  return {
    healthy,
    queuesAtRisk,
    totalDead,
    totalStuck: stuck.length,
  };
}
