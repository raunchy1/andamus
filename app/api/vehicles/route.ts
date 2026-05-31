import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateVehicleInput } from "@/lib/types/vehicle";
import { createVehicle, updateVehicle } from "@/lib/server/data/vehicles";

// POST /api/vehicles — create a new vehicle
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as CreateVehicleInput;

    if (!body.make_name || !body.model_name || !body.year) {
      return NextResponse.json(
        { error: "make_name, model_name, and year are required" },
        { status: 400 }
      );
    }

    const vehicle = await createVehicle(user.id, body);
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create vehicle";
    console.error("POST /api/vehicles error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/vehicles — get user's vehicles
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select(`
        *,
        images:vehicle_images(
          id, url, thumbnail_url, is_primary, order_index, moderation_status
        )
      `)
      .eq("owner_id", user.id)
      .eq("active", true)
      .order("primary_vehicle", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ vehicles: data ?? [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch vehicles";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
