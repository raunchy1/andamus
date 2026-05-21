import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { computeTrustScore, getTrustLevel } from "@/lib/reputation";

export const runtime = "edge";
export const alt = "Andamus Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;

  let name = "";
  let rating = 5.0;
  let reviewCount = 0;
  let completedRides = 0;
  let avatarUrl = "";

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url, rating, review_count, completed_rides_count, created_at")
      .eq("id", id)
      .single();

    if (profile) {
      name = profile.name;
      rating = profile.rating || 5.0;
      reviewCount = profile.review_count || 0;
      completedRides = profile.completed_rides_count || 0;
      avatarUrl = profile.avatar_url || "";
    }
  } catch {
    // Fallback
  }

  const trustScore = name
    ? computeTrustScore({
        rating,
        review_count: reviewCount,
        rides_count: 0,
        completed_rides_count: completedRides,
        created_at: new Date().toISOString(),
        phone_verified: false,
        email_verified: false,
        id_verified: false,
        driver_verified: false,
      })
    : 0;
  const trustLevel = getTrustLevel(trustScore);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  const titleText = locale === "it" ? "Profilo su Andamus" : locale === "de" ? "Profil bei Andamus" : "Profile on Andamus";
  const ridesLabel = locale === "it" ? "corse" : locale === "de" ? "Fahrten" : "rides";
  const reviewsLabel = locale === "it" ? "recensioni" : locale === "de" ? "Bewertungen" : "reviews";

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
            background: "radial-gradient(circle, rgba(230,57,70,0.12) 0%, transparent 70%)",
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
            background: "radial-gradient(circle, rgba(255,179,177,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#e63946",
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
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 48 }}>
          {/* Avatar */}
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 36,
              background: avatarUrl ? "transparent" : "linear-gradient(135deg, #e63946 0%, #c92a37 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
              border: "3px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            {initial}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
              {name || "???"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 32 }}>⭐</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: "white" }}>{rating.toFixed(1)}</span>
              </div>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
                {completedRides} {ridesLabel}
              </span>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
                {reviewCount} {reviewsLabel}
              </span>
            </div>

            {/* Trust badge */}
            {name && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 24px",
                  borderRadius: 14,
                  background: trustScore >= 60
                    ? "rgba(16,185,129,0.12)"
                    : trustScore >= 40
                      ? "rgba(234,179,8,0.12)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${trustScore >= 60 ? "rgba(16,185,129,0.3)" : trustScore >= 40 ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.1)"}`,
                  alignSelf: "flex-start",
                }}
              >
                <span style={{ fontSize: 28 }}>{trustLevel.emoji}</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: trustScore >= 60 ? "#34d399" : trustScore >= 40 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {trustLevel.label}
                </span>
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>{trustScore}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#e63946",
              background: "rgba(230,57,70,0.1)",
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid rgba(230,57,70,0.3)",
            }}
          >
            {titleText}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
