import { NextRequest } from "next/server";
import { dequeueJob, ackJob, failJob, processJob } from "@/lib/server/jobs";
import { apiSuccess, apiError } from "@/lib/server/api-utils";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = env().CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const job = await dequeueJob();
  if (!job) {
    return apiSuccess({ processed: false, reason: "no_jobs" });
  }

  try {
    await processJob(job);
    await ackJob(job.id);
    return apiSuccess({ processed: true, jobId: job.id, type: job.type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    await failJob(job, message);
    return apiError(message, "JOB_FAILED", 500, { jobId: [job.id], type: [job.type] });
  }
}
