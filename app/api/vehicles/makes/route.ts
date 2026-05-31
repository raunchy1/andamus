import { NextRequest, NextResponse } from "next/server";
import { searchVehicleMakes } from "@/lib/server/data/vehicles";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const makes = await searchVehicleMakes(query);
    return NextResponse.json({ makes });
  } catch (error) {
    console.error("Error fetching vehicle makes:", error);
    return NextResponse.json({ error: "Failed to fetch makes" }, { status: 500 });
  }
}
