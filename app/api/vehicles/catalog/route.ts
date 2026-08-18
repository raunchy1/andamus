import { NextRequest, NextResponse } from "next/server";
import { searchVehicleCatalog } from "@/lib/server/data/vehicles";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const results = await searchVehicleCatalog(query);
    return NextResponse.json(
      { results },
      // The catalog is static reference data; let the edge hold it for a day.
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
    );
  } catch (error) {
    console.error("[api/vehicles/catalog]", error);
    return NextResponse.json({ error: "Failed to search catalog" }, { status: 500 });
  }
}
