import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 86400; // Revalidate once per day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";
  const locales = ["it", "en", "de"] as const;

  // Static pages for each locale
  const staticPaths = [
    "",
    "/cerca",
    "/termini-e-condizioni",
    "/privacy-policy",
  ];

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of staticPaths) {
      staticEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    }
  }

  // Fetch recent active rides (public, indexable)
  let rideEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: rides } = await supabase
      .from("rides")
      .select("id, updated_at")
      .eq("status", "active")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(100);

    if (rides) {
      rideEntries = rides.flatMap((ride) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/corsa/${ride.id}`,
          lastModified: new Date(ride.updated_at || Date.now()),
          changeFrequency: "daily" as const,
          priority: 0.8,
        }))
      );
    }
  } catch {
    // Sitemap is non-critical
  }

  // Fetch public profiles with activity
  let profileEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, created_at")
      .gt("completed_rides_count", 0)
      .order("completed_rides_count", { ascending: false })
      .limit(100);

    if (profiles) {
      profileEntries = profiles.flatMap((profile) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/u/${profile.id}`,
          lastModified: new Date(profile.created_at || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
      );
    }
  } catch {
    // Sitemap is non-critical
  }

  return [...staticEntries, ...rideEntries, ...profileEntries];
}
