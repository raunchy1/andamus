import { NextRequest, NextResponse } from "next/server";
import { searchVehicleModels } from "@/lib/server/data/vehicles";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const makeId = searchParams.get("makeId");
  const query = searchParams.get("q") || "";

  if (!makeId) {
    return NextResponse.json({ error: "makeId is required" }, { status: 400 });
  }

  try {
    const models = await searchVehicleModels(makeId, query);
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
