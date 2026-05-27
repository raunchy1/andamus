import { NextRequest, NextResponse } from "next/server";
import { getEmptySearchAlternatives } from "@/lib/server/liquidity/alternatives";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    if (!from && !to) {
      return NextResponse.json({ error: "Missing from/to parameters" }, { status: 400 });
    }

    const data = await getEmptySearchAlternatives(from || "", to || "", date);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[api/cerca/alternatives] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
