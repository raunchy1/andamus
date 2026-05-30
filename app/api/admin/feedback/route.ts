import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/admin/feedback
 * Fetch all user feedback for the admin panel.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  
  // Try querying public.feedback first
  const { data: initialData, error } = await supabase
    .from("feedback")
    .select("*, profiles(name, email, avatar_url)")
    .order("created_at", { ascending: false });

  let data = initialData;

  if (error) {
    console.warn("[api/admin/feedback] failed to fetch from public.feedback, trying feedback_reports:", error.message);
    
    // Fallback 1: feedback_reports
    const { data: reportsData, error: reportsError } = await supabase
      .from("feedback_reports")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (reportsError) {
      console.warn("[api/admin/feedback] failed to fetch from feedback_reports, trying beta_feedback:", reportsError.message);
      
      // Fallback 2: beta_feedback
      const { data: betaData, error: betaError } = await supabase
        .from("beta_feedback")
        .select("*, profiles(name, email, avatar_url)")
        .order("created_at", { ascending: false });
        
      if (betaError) {
        return NextResponse.json({ error: betaError.message }, { status: 500 });
      }
      
      data = betaData;
    } else {
      data = reportsData;
    }
  }

  return NextResponse.json({ items: data || [] });
}

/**
 * POST /api/admin/feedback
 * Update feedback status (resolve) or priority.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const body = await request.json().catch(() => ({}));
  const { id, action, value } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let table = "feedback";
  
  // Probe which table the record belongs to
  const { data: feedbackRow } = await supabase.from("feedback").select("id").eq("id", id).maybeSingle();
  if (!feedbackRow) {
    const { data: reportsRow } = await supabase.from("feedback_reports").select("id").eq("id", id).maybeSingle();
    if (reportsRow) {
      table = "feedback_reports";
    } else {
      const { data: betaRow } = await supabase.from("beta_feedback").select("id").eq("id", id).maybeSingle();
      if (betaRow) {
        table = "beta_feedback";
      } else {
        return NextResponse.json({ error: "Feedback record not found" }, { status: 404 });
      }
    }
  }

  let updateFields: Record<string, any> = {};

  if (action === "resolve") {
    if (table === "beta_feedback") {
      updateFields = { resolved_at: value ? new Date().toISOString() : null };
    } else {
      updateFields = { status: value ? "resolved" : "open" };
    }
  } else if (action === "priority") {
    // If priority is requested, we can update priority or store it in a notes field if priority column is missing
    updateFields = { priority: value };
  } else if (action === "notes") {
    updateFields = { notes: value };
  }

  const { error } = await supabase
    .from(table)
    .update(updateFields)
    .eq("id", id);

  if (error) {
    // If column doesn't exist (e.g. priority column), fall back to storing it in the 'notes' or 'text' metadata
    if (action === "priority" && error.message.includes("column")) {
      const notesValue = `[Priority: ${value}]`;
      const { error: fallbackErr } = await supabase
        .from(table)
        .update({ notes: notesValue })
        .eq("id", id);
        
      if (fallbackErr) {
        return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
