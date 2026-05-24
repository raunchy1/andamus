import { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";
import { PublicProfileView } from "@/components/PublicProfile";
import { computeTrustScore, getTrustLevel, formatAccountAge } from "@/lib/reputation";

interface PublicProfilePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";

  const supabase = await createClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("name, rating, review_count, completed_rides_count, created_at")
    .eq("slug", id)
    .single();

  if (!profile) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("name, rating, review_count, completed_rides_count, created_at")
      .eq("id", id)
      .single();
    profile = profileById;
  }

  if (!profile) {
    return {
      title: locale === "it" ? "Profilo non trovato | Andamus" : locale === "de" ? "Profil nicht gefunden | Andamus" : "Profile not found | Andamus",
    };
  }

  const trustScore = computeTrustScore(profile);
  const trustLevel = getTrustLevel(trustScore);

  const titles: Record<string, string> = {
    it: `${profile.name} — ${trustLevel.label} su Andamus`,
    en: `${profile.name} — ${trustLevel.label} on Andamus`,
    de: `${profile.name} — ${trustLevel.label} bei Andamus`,
  };

  const descriptions: Record<string, string> = {
    it: `${profile.rating.toFixed(1)}★ guidatore con ${profile.completed_rides_count} corse completate. ${profile.review_count} recensioni. Su Andamus dal ${new Date(profile.created_at).getFullYear()}.`,
    en: `${profile.rating.toFixed(1)}★ driver with ${profile.completed_rides_count} completed rides. ${profile.review_count} reviews. On Andamus since ${new Date(profile.created_at).getFullYear()}.`,
    de: `${profile.rating.toFixed(1)}★ Fahrer mit ${profile.completed_rides_count} abgeschlossenen Fahrten. ${profile.review_count} Bewertungen. Bei Andamus seit ${new Date(profile.created_at).getFullYear()}.`,
  };

  const title = titles[locale] || titles.it;
  const description = descriptions[locale] || descriptions.it;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "profile",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${baseUrl}/${locale}/u/${id}`,
      siteName: "Andamus",
      title,
      description,
      images: [`/${locale}/u/${id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/u/${id}/twitter-image`],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/u/${id}`,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id, locale } = await params;

  const supabase = await createClient();

  // Try resolving as slug first, then fall back to UUID
  let profileQuery = supabase.from("profiles").select("*").eq("slug", id);
  let { data: profileRaw } = await profileQuery.single();

  if (!profileRaw) {
    // Fallback to UUID lookup for backward compatibility
    const { data: profileById } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    profileRaw = profileById;
  }

  if (!profileRaw) {
    notFound();
  }

  const profile = profileRaw as {
    id: string;
    name: string;
    avatar_url: string | null;
    rating: number;
    review_count: number;
    rides_count: number;
    completed_rides_count: number;
    created_at: string;
    phone_verified: boolean;
    email_verified: boolean;
    id_verified: boolean;
    driver_verified: boolean;
    car_model: string | null;
    car_color: string | null;
    car_year: number | null;
    level: string;
    points: number;
  };

  const { data: reviewsRaw } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer:profiles(name, avatar_url), ride:rides(from_city, to_city, date)")
    .eq("reviewed_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews = (reviewsRaw || []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    rating: Number(r.rating),
    comment: r.comment as string | null,
    created_at: String(r.created_at),
    reviewer: r.reviewer as { name: string; avatar_url: string | null } | null,
    ride: r.ride as { from_city: string; to_city: string; date: string } | null,
  }));

  const { data: activeRides } = await supabase
    .from("rides")
    .select("id, from_city, to_city, date, time, price, seats, status")
    .eq("driver_id", id)
    .eq("status", "active")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(10);

  const trustScore = computeTrustScore(profile);
  const trustLevel = getTrustLevel(trustScore);
  const accountAge = formatAccountAge(profile.created_at);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    image: profile.avatar_url || undefined,
    memberOf: {
      "@type": "Organization",
      name: "Andamus",
      url: "https://andamus.it",
    },
    aggregateRating: profile.review_count > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: profile.rating.toFixed(1),
          reviewCount: profile.review_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    knowsAbout: ["Carpooling", "Ride Sharing", "Sustainable Transport"],
  };

  return (
    <>
      <Script
        id="profile-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicProfileView
        locale={locale}
        profile={{
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          rating: profile.rating,
          review_count: profile.review_count,
          rides_count: profile.rides_count,
          completed_rides_count: profile.completed_rides_count,
          created_at: profile.created_at,
          accountAge,
          phone_verified: profile.phone_verified,
          email_verified: profile.email_verified,
          id_verified: profile.id_verified,
          driver_verified: profile.driver_verified,
          car_model: profile.car_model,
          car_color: profile.car_color,
          car_year: profile.car_year,
          level: profile.level,
          points: profile.points,
          trustScore,
          trustLevel,
        }}
        reviews={reviews}
        activeRides={activeRides || []}
      />
    </>
  );
}
