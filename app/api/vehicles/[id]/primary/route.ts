import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setPrimaryVehicle } from "@/lib/server/data/vehicles";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await setPrimaryVehicle(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to set primary";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
