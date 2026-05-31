import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateVehicle, deleteVehicle, setPrimaryVehicle } from "@/lib/server/data/vehicles";
import type { UpdateVehicleInput } from "@/lib/types/vehicle";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/vehicles/[id] — update vehicle
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const vehicle = await updateVehicle(user.id, { id, ...body } as UpdateVehicleInput);
    return NextResponse.json(vehicle);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update vehicle";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/vehicles/[id] — soft delete vehicle
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteVehicle(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete vehicle";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/vehicles/[id] — get single vehicle
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        images:vehicle_images(
          id, url, thumbnail_url, is_primary, order_index, moderation_status
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch vehicle";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
