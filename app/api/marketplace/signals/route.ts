import { NextResponse } from "next/server";
import { getMarketplaceSignals } from "@/lib/server/liquidity/signals";

export async function GET() {
  try {
    const signals = await getMarketplaceSignals();
    return NextResponse.json(signals);
  } catch (error: any) {
    console.error("[api/marketplace/signals] Error fetching signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
