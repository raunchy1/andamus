import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Andamus Ride";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;

  let fromCity = "???";
  let toCity = "???";
  let date = "";
  let time = "";
  let price = 0;
  let driverName = "";

  try {
    const supabase = await createClient();
    const { data: ride } = await supabase
      .from("rides")
      .select("from_city, to_city, date, time, price, profiles(name)")
      .eq("id", id)
      .single();

    if (ride) {
      fromCity = ride.from_city;
      toCity = ride.to_city;
      date = ride.date;
      time = ride.time?.slice(0, 5) || "";
      price = ride.price || 0;
      const profile = Array.isArray(ride.profiles) ? ride.profiles[0] : ride.profiles;
      driverName = profile?.name || "";
    }
  } catch {
    // Fallback to defaults
  }

  const priceText = price > 0 ? `€${price}` : locale === "it" ? "Gratis" : locale === "de" ? "Kostenlos" : "Free";
  const dateText = date ? `${date}${time ? ` · ${time}` : ""}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f1a 100%)",
          padding: 60,
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79, 179, 201,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,179,177,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#4FB3C9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
            Andamus
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 32,
            }}
          >
            <span style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
              {fromCity}
            </span>
            <span style={{ fontSize: 48, color: "#4FB3C9", fontWeight: 300 }}>→</span>
            <span style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
              {toCity}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {dateText && (
              <span style={{ fontSize: 28, color: "rgba(255,255,255,0.6)" }}>{dateText}</span>
            )}
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: price > 0 ? "#4FB3C9" : "#10b981",
                background: price > 0 ? "rgba(79, 179, 201,0.15)" : "rgba(16,185,129,0.15)",
                padding: "8px 20px",
                borderRadius: 12,
              }}
            >
              {priceText}
            </span>
          </div>
        </div>

        {/* Driver + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          {driverName && (
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>
              {locale === "it" ? "Guidato da" : locale === "de" ? "Gefahren von" : "Driven by"} {driverName}
            </span>
          )}
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#4FB3C9",
              background: "rgba(79, 179, 201,0.1)",
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid rgba(79, 179, 201,0.3)",
            }}
          >
            {locale === "it" ? "Prenota su Andamus" : locale === "de" ? "Auf Andamus buchen" : "Book on Andamus"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
