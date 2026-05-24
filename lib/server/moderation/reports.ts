"use server";

/**
 * Moderation Reports
 * ==================
 * User-generated content reporting system with admin queues,
 * escalation workflows, and audit trails.
 *
 * WHY: At 100K+ users, content moderation must be scalable,
 * transparent, and fair. Automated triage + human review = efficiency.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";
import { publishEvent } from "@/lib/server/events";
import { logInfo, logWarn } from "@/lib/server/observability/logging";
import { recordModerationAction } from "@/lib/server/observability/metrics";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reportedRideId: z.string().uuid().optional(),
  reportedContentId: z.string().uuid().optional(),
  contentType: z.enum(["ride", "message", "review", "profile", "group", "event"]),
  reason: z.string().min(10).max(2000),
  details: z.string().max(5000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export type CreateReportInput = z.infer<typeof reportSchema>;

// ---------------------------------------------------------------------------
// Report creation
// ---------------------------------------------------------------------------

export interface ReportResult {
  reportId: string;
  created: boolean;
  autoAction?: string;
  error?: string;
}

/**
 * Create a content report. Triggers automated triage and
 * publishes a domain event for async processing.
 */
export async function createReport(
  reporterId: string,
  input: CreateReportInput
): Promise<ReportResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { reportId: "", created: false, error: parsed.error.message };
  }

  // Prevent self-reporting
  if (input.reportedUserId === reporterId) {
    return { reportId: "", created: false, error: "Cannot report yourself" };
  }

  const supabase = await createClient();

  // Check for duplicate reports within 24h
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { data: existing } = await supabase
    .from("content_reports")
    .select("id")
    .eq("reporter_id", reporterId)
    .eq("reported_user_id", input.reportedUserId)
    .eq("content_type", input.contentType)
    .gte("created_at", oneDayAgo)
    .maybeSingle();

  if (existing) {
    return { reportId: existing.id, created: false, error: "Duplicate report" };
  }

  // Auto-determine severity based on content
  const severity = input.severity ?? autoTriageSeverity(input.reason, input.details);

  const { data, error } = await supabase
    .from("content_reports")
    .insert({
      reporter_id: reporterId,
      reported_user_id: input.reportedUserId,
      reported_ride_id: input.reportedRideId,
      reported_content_id: input.reportedContentId,
      content_type: input.contentType,
      reason: input.reason,
      details: input.details,
      severity,
      status: severity === "critical" ? "escalated" : "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { reportId: "", created: false, error: error?.message ?? "Insert failed" };
  }

  const reportId = data.id;

  // Publish event
  await publishEvent(
    {
      type: "content.reported",
      payload: {
        reportId,
        reporterId,
        reportedUserId: input.reportedUserId,
        contentType: input.contentType,
        reason: input.reason,
        severity,
      },
    },
    { emittedBy: reporterId }
  );

  logInfo("Content report created", {
    metadata: { reportId, reporterId, reportedUserId: input.reportedUserId, severity },
  });

  // Auto-actions for critical severity
  let autoAction: string | undefined;
  if (severity === "critical") {
    autoAction = await applyAutoAction(input.reportedUserId, reportId, "auto_suspend_critical");
  }

  return { reportId, created: true, autoAction };
}

// ---------------------------------------------------------------------------
// Automated triage
// ---------------------------------------------------------------------------

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  critical: [
    "violenza", "violence", "aggressione", "assault", "arma", "weapon",
    "molestia", "harassment", "stalking", "minaccia", "threat",
    "droga", "drugs", "traffico", "trafficking", "bambino", "child",
    "furto", "theft", "rapina", "robbery",
  ],
  high: [
    "truffa", "scam", "fraud", "falso", "fake", "spam",
    "discriminazione", "discrimination", "odio", "hate",
    "dati personali", "personal data", "privacy",
  ],
  medium: [
    "comportamento scorretto", "misconduct", "rude", "scortese",
    "prezzo errato", "wrong price", "descrizione fuorviante", "misleading",
  ],
};

function autoTriageSeverity(reason: string, details?: string): "low" | "medium" | "high" | "critical" {
  const text = `${reason} ${details ?? ""}`.toLowerCase();

  for (const keyword of SEVERITY_KEYWORDS.critical) {
    if (text.includes(keyword)) return "critical";
  }
  for (const keyword of SEVERITY_KEYWORDS.high) {
    if (text.includes(keyword)) return "high";
  }
  for (const keyword of SEVERITY_KEYWORDS.medium) {
    if (text.includes(keyword)) return "medium";
  }

  return "low";
}

async function applyAutoAction(
  userId: string,
  reportId: string,
  actionType: string
): Promise<string> {
  const supabase = await createServiceRoleClient();

  await supabase.from("moderation_actions").insert({
    target_user_id: userId,
    target_report_id: reportId,
    action_type: actionType,
    reason: "Automated action based on critical severity report",
    details: { auto: true, reportId },
  });

  recordModerationAction(actionType);
  return actionType;
}

// ---------------------------------------------------------------------------
// Admin queue management
// ---------------------------------------------------------------------------

export interface ModerationQueueItem {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: string;
  reason: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to: string | null;
  reporter_name?: string;
  reported_user_name?: string;
}

export async function getModerationQueue(options?: {
  status?: string;
  severity?: string;
  assignedTo?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  items: ModerationQueueItem[];
  total: number;
}> {
  const supabase = await createServiceRoleClient();

  let query = supabase
    .from("content_reports")
    .select("*, reporter:profiles!reporter_id(name), reported:profiles!reported_user_id(name)", { count: "exact" });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.severity) query = query.eq("severity", options.severity);
  if (options?.assignedTo) query = query.eq("assigned_to", options.assignedTo);

  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    logWarn("Failed to load moderation queue", { metadata: { error: error?.message } });
    return { items: [], total: 0 };
  }

  const items = (data as Array<Record<string, unknown>>).map((row) => {
    const reporter = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;
    const reported = Array.isArray(row.reported) ? row.reported[0] : row.reported;
    return {
      id: row.id as string,
      reporter_id: row.reporter_id as string,
      reported_user_id: row.reported_user_id as string,
      content_type: row.content_type as string,
      reason: row.reason as string,
      severity: row.severity as string,
      status: row.status as string,
      created_at: row.created_at as string,
      assigned_to: row.assigned_to as string | null,
      reporter_name: reporter?.name as string | undefined,
      reported_user_name: reported?.name as string | undefined,
    };
  });

  return { items, total: count ?? 0 };
}

/**
 * Assign a report to a moderator.
 */
export async function assignReport(
  reportId: string,
  moderatorId: string
): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from("content_reports")
    .update({ assigned_to: moderatorId, status: "under_review" })
    .eq("id", reportId);

  return !error;
}

/**
 * Resolve a report with a moderation action.
 */
export async function resolveReport(
  reportId: string,
  moderatorId: string,
  resolution: {
    action: "warn" | "suspend" | "ban" | "unban" | "delete_content" | "dismiss";
    reason: string;
    targetUserId: string;
  }
): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  // Update report status
  const { error: reportError } = await supabase
    .from("content_reports")
    .update({
      status: resolution.action === "dismiss" ? "dismissed" : "resolved",
      resolution: resolution.reason,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (reportError) return false;

  // Log moderation action
  await supabase.from("moderation_actions").insert({
    moderator_id: moderatorId,
    target_user_id: resolution.targetUserId,
    target_report_id: reportId,
    action_type: resolution.action,
    reason: resolution.reason,
  });

  // Apply action to user if needed
  if (resolution.action === "suspend" || resolution.action === "ban") {
    await supabase
      .from("profiles")
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
      })
      .eq("id", resolution.targetUserId);
  }

  recordModerationAction(resolution.action);

  logInfo("Report resolved", {
    metadata: { reportId, moderatorId, action: resolution.action },
  });

  return true;
}

// ---------------------------------------------------------------------------
// User blocking
// ---------------------------------------------------------------------------

export async function blockUser(
  blockerId: string,
  blockedId: string,
  reason?: string
): Promise<{ blocked: boolean; error?: string }> {
  if (blockerId === blockedId) {
    return { blocked: false, error: "Cannot block yourself" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId, reason })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate")) {
      return { blocked: true };
    }
    return { blocked: false, error: error.message };
  }

  return { blocked: true };
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  return !error;
}

export async function getBlockedUsers(blockerId: string): Promise<
  Array<{ blocked_id: string; reason?: string; created_at: string; blocked_name?: string }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, reason, created_at, blocked:profiles!blocked_id(name)")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => {
    const blocked = Array.isArray(row.blocked) ? row.blocked[0] : row.blocked;
    return {
      blocked_id: row.blocked_id as string,
      reason: row.reason as string | undefined,
      created_at: row.created_at as string,
      blocked_name: blocked?.name as string | undefined,
    };
  });
}

/**
 * Check if a user is blocked by another user.
 */
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check if either user has blocked the other (mutual block check).
 */
export async function hasMutualBlock(userA: string, userB: string): Promise<boolean> {
  const [aBlocksB, bBlocksA] = await Promise.all([
    isBlocked(userA, userB),
    isBlocked(userB, userA),
  ]);

  return aBlocksB || bBlocksA;
}
