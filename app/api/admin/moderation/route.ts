import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server/guards";
import { getModerationQueue, resolveReport } from "@/lib/server/moderation/reports";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["pending", "under_review", "resolved", "dismissed", "escalated"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

/**
 * GET /api/admin/moderation
 * Returns the moderation queue for admin review.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    severity: searchParams.get("severity") ?? undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "50",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const limit = parsed.data.limit ?? 50;
  const offset = ((parsed.data.page ?? 1) - 1) * limit;

  const { items, total } = await getModerationQueue({
    status: parsed.data.status,
    severity: parsed.data.severity,
    limit,
    offset,
  });

  return NextResponse.json({ items, total, page: parsed.data.page ?? 1, pageSize: limit });
}

const resolveSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["warn", "suspend", "ban", "unban", "delete_content", "dismiss"]),
  reason: z.string().min(10),
  targetUserId: z.string().uuid(),
});

/**
 * POST /api/admin/moderation
 * Resolve a moderation report.
 */
export async function POST(request: NextRequest) {
  let auth: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    auth = await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = resolveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const success = await resolveReport(
    parsed.data.reportId,
    auth.userId,
    {
      action: parsed.data.action,
      reason: parsed.data.reason,
      targetUserId: parsed.data.targetUserId,
    }
  );

  if (!success) {
    return NextResponse.json({ error: "Failed to resolve report" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
